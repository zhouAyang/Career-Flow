import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * AI Chat Proxy Handler
 * Path: /api/ai/chat
 * 
 * This serverless function acts as a secure bridge between the frontend 
 * and the third-party OpenAI proxy API.
 */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // 1. Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. Get API Key from environment variables (Secure: hidden from client)
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('OPENAI_API_KEY is missing in environment variables');
    return response.status(500).json({ 
      error: 'Server configuration error: API Key is missing.' 
    });
  }

  try {
    const { messages, temperature = 0.7, response_format } = request.body;

    if (!messages || !Array.isArray(messages)) {
      return response.status(400).json({ error: 'Invalid request: messages are required.' });
    }

    // 3. Forward request to the OpenAI proxy (gptsapi)
    const openaiBaseUrl = process.env.OPENAI_API_URL || 'https://api.gptsapi.net';
    const apiResponse = await fetch(`${openaiBaseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature,
        response_format
      })
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      console.error('Upstream API Error:', errorData);
      return response.status(apiResponse.status).json({ 
        error: 'AI Service currently unavailable.',
        details: errorData 
      });
    }

    const data = await apiResponse.json();
    
    // 4. Return the data to the frontend
    return response.status(200).json(data);

  } catch (error) {
    console.error('Proxy Error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
