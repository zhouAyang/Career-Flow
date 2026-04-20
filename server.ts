import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import dotenv from 'dotenv';
import FormData from 'form-data';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Request logging
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
    env: process.env.NODE_ENV
  });
});

app.get('/api/debug', (req, res) => {
  res.json({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'Present (Masked: ' + process.env.OPENAI_API_KEY.slice(0, 5) + '...)' : 'Missing',
    SOMARK_API_KEY: process.env.SOMARK_API_KEY ? 'Present (Masked: ' + process.env.SOMARK_API_KEY.slice(0, 5) + '...)' : 'Missing',
    NODE_ENV: process.env.NODE_ENV,
    CWD: process.cwd()
  });
});

// Multer setup
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 } // 200MB per docs
});

/**
 * AI Chat Proxy Route
 */
app.post('/api/ai/chat', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is missing');
    return res.status(500).json({ error: 'Server configuration error: OPENAI_API_KEY is missing.' });
  }

  try {
    const { messages, temperature = 0.7, response_format } = req.body;
    
    console.log('Forwarding chat request to OpenAI proxy...');
    
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
      console.error('OpenAI Proxy Error Status:', apiResponse.status, errorData);
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
    console.error('SOMARK_API_KEY is missing');
    return res.status(500).json({ error: 'Server configuration error: SOMARK_API_KEY is missing.' });
  }

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  try {
    console.log(`Forwarding file ${file.originalname} to SoMark...`);
    
    const formData = new FormData();
    formData.append('file', file.buffer, { 
      filename: file.originalname,
      contentType: file.mimetype,
      knownLength: file.size
    });
    formData.append('api_key', apiKey);

    const apiResponse = await fetch('https://somark.tech/api/v1/parse/sync', {
      method: 'POST',
      headers: formData.getHeaders(),
      body: formData.getBuffer()
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.error('SoMark API Error Status:', apiResponse.status, errorData);
      return res.status(apiResponse.status).json({ error: 'SoMark API service error', details: errorData });
    }

    const data = await apiResponse.json();
    
    let extractedText = '';
    if (data.code === 0 && data.data && data.data.elements) {
      extractedText = data.data.elements
        .filter((el: any) => el.type === 'text' || el.type === 'title')
        .map((el: any) => el.content || el.text)
        .join('\n');
    } else if (data.content) {
      extractedText = data.content;
    } else if (data.data && data.data.content) {
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

// Catch unmatched /api routes and return JSON 404
app.all('/api/*', (req, res) => {
  console.log(`[Server] Unmatched API route: ${req.method} ${req.url}`);
  res.status(404).json({ error: `Not Found: ${req.method} ${req.url}` });
});

// Vite middleware for development (Only if not running as a Vercel function)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  }).then((vite) => {
    app.use(vite.middlewares);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Development server started on http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to start Vite middleware:', err);
  });
} else if (process.env.NODE_ENV === 'production') {
  // Serve static files in production (For containerized deployment, not Vercel)
  const distPath = path.join(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
  
  // Conditionally listen if not using Vercel (Vercel exports the app)
  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Production server started on port ${PORT}`);
    });
  }
}

export default app;
