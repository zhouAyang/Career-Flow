import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method Not Allowed' });
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return response.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  try {
    // 逻辑：点评用户的面试回答
    return response.status(200).json({
      feedback: "回答逻辑清晰，但建议在技术细节上增加更多量化指标。",
      score: 8
    });
  } catch (error) {
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
