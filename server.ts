import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dotenv from 'dotenv';

// Load .env only in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Request logging - helpful for debugging Vercel logs
app.use((req, res, next) => {
  console.log(`[Server] ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    time: new Date().toISOString(), 
    node: process.version,
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL
  });
});

app.get('/api/debug', (req, res) => {
  res.json({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Present' : 'Missing',
    SOMARK_API_KEY: process.env.SOMARK_API_KEY ? 'Present' : 'Missing',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: !!process.env.VERCEL
  });
});

// Multer setup - Using memoryStorage for serverless compatibility
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit (Vercel body limit is 4.5MB anyway)
});

/**
 * AI Chat Proxy Route
 */
app.post('/api/ai/chat', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: OPENAI_API_KEY is missing.' });
  }

  try {
    const { messages, temperature = 0.7, response_format } = req.body;
    
    const apiResponse = await fetch('https://api.gptsapi.net/v1/chat/completions', {
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
      const errorData = await apiResponse.json().catch(() => ({}));
      return res.status(apiResponse.status).json({ error: 'AI Service error', details: errorData });
    }

    const data = await apiResponse.json();
    res.json(data);
  } catch (error) {
    console.error('Chat Proxy Exception:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * SoMark PDF Parse Route
 */
app.post('/api/parse', upload.single('file'), async (req, res) => {
  const apiKey = process.env.SOMARK_API_KEY;
  const file = req.file;

  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: SOMARK_API_KEY is missing.' });
  }

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    console.log(`Forwarding file ${file.originalname} (${file.size} bytes) to SoMark...`);
    
    // Using native Node.js FormData (available in Node 18+)
    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);
    formData.append('api_key', apiKey);

    const apiResponse = await fetch('https://somark.tech/api/v1/parse/sync', {
      method: 'POST',
      body: formData
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.error('SoMark API Error Status:', apiResponse.status, errorData);
      return res.status(apiResponse.status).json({ error: 'SoMark API service error', details: errorData });
    }

    const data = await apiResponse.json();
    
    let extractedText = '';
    // Structure: { code: 0, data: { elements: [...] } }
    if (data.code === 0 && data.data && data.data.elements) {
      extractedText = data.data.elements
        .filter((el: any) => el.type === 'text' || el.type === 'title')
        .map((el: any) => el.content || el.text || '')
        .join('\n');
    } else if (data.content) {
      extractedText = data.content;
    } else if (data.data?.content) {
      extractedText = data.data.content;
    } else {
      extractedText = JSON.stringify(data.data || data);
    }

    res.json({ text: extractedText, raw: data });
  } catch (error) {
    console.error('SoMark Parse Exception:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Catch unmatched /api routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.url}` });
});

// In Vercel, we only export the app. 
// In development or container production, we listen on a port.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Development server started on http://localhost:${PORT}`);
    });
  });
} else if (!process.env.VERCEL) {
  // Production container (listening on port)
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Production server started on port ${PORT}`);
  });
}

export default app;
