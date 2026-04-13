import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Method Not Allowed' });
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return response.status(500).json({ error: 'OPENAI_API_KEY not configured' });

  try {
    // 逻辑：基于简历和 JD 生成面试题
    return response.status(200).json({
      questions: [
        { id: '1', question: "请结合简历谈谈你在项目中的架构选型思路？" },
        { id: '2', question: "针对该岗位的性能要求，你会如何优化首屏加载？" }
      ],
    });
  } catch (error) {
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
