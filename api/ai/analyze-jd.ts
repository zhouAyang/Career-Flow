import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * 示例：JD 匹配分析接口代理
 * 部署在 Vercel 后，访问路径为 /api/ai/analyze-jd
 */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // 1. 验证请求方法
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. 获取环境变量中的 API Key (安全：Key 仅在服务端可见)
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ 
      error: 'OPENAI_API_KEY is not configured in Vercel environment variables.' 
    });
  }

  try {
    const { resumeContent, jdText } = request.body;

    // 3. 此处未来对接 OpenAI SDK 或直接 fetch OpenAI API
    // const completion = await openai.chat.completions.create({ ... });
    
    // 模拟延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 4. 返回处理结果
    return response.status(200).json({
      matchScore: 85,
      analysis: "这是一段由服务端代理生成的模拟分析结果...",
      suggestions: ["建议补充更多项目细节", "突出前端架构能力"]
    });
  } catch (error) {
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
