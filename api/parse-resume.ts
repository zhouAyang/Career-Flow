import type { VercelRequest, VercelResponse } from '@vercel/node';
import mammoth from 'mammoth';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx'] as const;

type SupportedFileType = (typeof ALLOWED_EXTENSIONS)[number];

type ParsedUploadFile = {
  fieldName: string;
  fileName: string;
  contentType: string;
  buffer: Buffer;
};

function getFileType(fileName: string): SupportedFileType | null {
  const ext = fileName.toLowerCase().match(/\.([^.]+)$/)?.[1];
  if (!ext) return null;

  return ALLOWED_EXTENSIONS.includes(ext as SupportedFileType)
    ? (ext as SupportedFileType)
    : null;
}

function splitBufferByBoundary(buffer: Buffer, boundary: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;

  while (start < buffer.length) {
    const index = buffer.indexOf(boundary, start);
    if (index === -1) break;

    parts.push(buffer.slice(start, index));
    start = index + boundary.length;
  }

  parts.push(buffer.slice(start));
  return parts;
}

function trimCRLF(buffer: Buffer): Buffer {
  let start = 0;
  let end = buffer.length;

  if (buffer.subarray(0, 2).equals(Buffer.from('\r\n'))) {
    start = 2;
  }

  if (end - start >= 2 && buffer.subarray(end - 2, end).equals(Buffer.from('\r\n'))) {
    end -= 2;
  }

  return buffer.subarray(start, end);
}

function parseMultipartFile(bodyBuffer: Buffer, contentTypeHeader: string): ParsedUploadFile {
  const boundaryMatch = contentTypeHeader.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch?.[1] || boundaryMatch?.[2];

  if (!boundary) {
    throw new Error('Invalid multipart/form-data request: boundary is missing.');
  }

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const rawParts = splitBufferByBoundary(bodyBuffer, boundaryBuffer)
    .map(trimCRLF)
    .filter((part) => part.length > 0 && !part.equals(Buffer.from('--')));

  for (const rawPart of rawParts) {
    const headerEndIndex = rawPart.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEndIndex === -1) continue;

    const headerText = rawPart.subarray(0, headerEndIndex).toString('utf8');
    const contentBuffer = trimCRLF(rawPart.subarray(headerEndIndex + 4));

    const dispositionMatch = headerText.match(/content-disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
    if (!dispositionMatch) continue;

    const fieldName = dispositionMatch[1];
    const fileName = dispositionMatch[2];

    if (fieldName !== 'file' || !fileName) {
      continue;
    }

    const mimeMatch = headerText.match(/content-type:\s*([^\r\n]+)/i);

    return {
      fieldName,
      fileName,
      contentType: mimeMatch?.[1]?.trim() || 'application/octet-stream',
      buffer: contentBuffer,
    };
  }

  throw new Error('没有上传文件');
}

async function readRequestBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buf.length;

    if (totalBytes > MAX_FILE_SIZE + 1024 * 1024) {
      throw new Error('上传文件过大（最大 10MB）');
    }

    chunks.push(buf);
  }

  return Buffer.concat(chunks);
}

function extractTextFromSoMarkResponse(data: any): string {
  if (data?.code !== 0) {
    throw new Error(data?.message || 'SoMark 解析失败');
  }

  const outputs = data?.data?.result?.outputs;
  if (!outputs) {
    throw new Error('SoMark 返回结果中缺少 outputs 字段');
  }

  if (outputs.markdown && typeof outputs.markdown === 'string') {
    return outputs.markdown.trim();
  }

  if (outputs.json?.pages && Array.isArray(outputs.json.pages)) {
    return outputs.json.pages
      .flatMap((page: any) =>
        (page.blocks || [])
          .filter((block: any) => block.content && block.content.trim().length > 0)
          .map((block: any) => block.content.trim())
      )
      .join('\n\n');
  }

  return JSON.stringify(data);
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const contentTypeHeader = request.headers['content-type'] || '';
  if (!contentTypeHeader.toLowerCase().includes('multipart/form-data')) {
    return response.status(400).json({ error: '请求必须是 multipart/form-data' });
  }

  try {
    const bodyBuffer = await readRequestBody(request);
    const file = parseMultipartFile(bodyBuffer, contentTypeHeader);

    const fileType = getFileType(file.fileName);
    if (!fileType) {
      return response.status(400).json({ error: '不支持的文件格式。仅支持 PDF、DOC、DOCX 文件。' });
    }

    if (file.buffer.length === 0 || file.buffer.length > MAX_FILE_SIZE) {
      return response.status(400).json({ error: '文件为空或超过 10MB 限制。' });
    }

    let extractedText = '';

    if (fileType === 'doc' || fileType === 'docx') {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
    } else {
      const somarkKey = process.env.SOMARK_API_KEY;
      if (!somarkKey) {
        return response.status(500).json({
          error: 'Server configuration error: SOMARK_API_KEY is missing.',
        });
      }

      const fileBlob = new Blob([file.buffer], { type: file.contentType || 'application/pdf' });
      const formData = new FormData();
      formData.append('api_key', somarkKey);
      formData.append('file', fileBlob, file.fileName);

      const somarkResponse = await fetch('https://somark.tech/api/v1/parse/sync', {
        method: 'POST',
        body: formData,
      });

      if (!somarkResponse.ok) {
        const responseText = await somarkResponse.text().catch(() => 'Failed to read response text');
        console.error('SoMark API error:', somarkResponse.status, responseText);
        return response.status(somarkResponse.status).json({ error: 'PDF 解析失败' });
      }

      const somarkData = await somarkResponse.json();
      extractedText = extractTextFromSoMarkResponse(somarkData);
    }

    return response.status(200).json({
      text: extractedText,
      fileName: file.fileName,
      fileType: fileType.toUpperCase(),
    });
  } catch (error) {
    console.error('Resume parsing error:', error);

    if (error instanceof Error && error.message === '没有上传文件') {
      return response.status(400).json({ error: '没有上传文件' });
    }

    if (error instanceof Error && error.message.includes('上传文件过大')) {
      return response.status(400).json({ error: '上传文件过大（最大 10MB）' });
    }

    return response.status(500).json({ error: '文件解析失败' });
  }
}
