import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { classifyWithGeminiOrFallback } from './geminiService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Root Endpoint
app.get('/', (req, res) => {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    process.env.GEMINI_API_KEY !== 'YOUR_API_KEY_HERE'
  );

  res.json({
    status: 'online',
    campus: 'Lovely Professional University (LPU), Phagwara',
    service: 'CampusResolve AI Backend Server',
    message: 'Backend API is operational and ready.',
    endpoints: {
      health: 'GET /api/health',
      classify: 'POST /api/classify',
    },
    geminiConfigured: hasKey,
    activeModel: hasKey ? 'gemini-2.5-flash' : 'rule-based-fallback',
    timestamp: new Date().toISOString(),
  });
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  const hasKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    process.env.GEMINI_API_KEY !== 'YOUR_API_KEY_HERE'
  );

  res.json({
    status: 'online',
    campus: 'Lovely Professional University (LPU), Phagwara',
    service: 'CampusResolve AI Classification Backend',
    geminiConfigured: hasKey,
    activeModel: hasKey ? 'gemini-2.5-flash' : 'rule-based-fallback',
    timestamp: new Date().toISOString(),
  });
});

// Classification Endpoint
app.post('/api/classify', async (req, res) => {
  try {
    const { text, language, block, floor, roomNumber } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Complaint text is required for classification.',
      });
    }

    const trimmedText = text.trim();
    if (trimmedText.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Complaint text is too short. Please provide at least 5 characters.',
      });
    }

    const result = await classifyWithGeminiOrFallback({
      text: trimmedText,
      language,
      block,
      floor,
      roomNumber,
    });

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[API Error /api/classify]:', error);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing the complaint classification.',
      details: error.message,
    });
  }
});

// Start listening if run directly
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY.trim() !== '' &&
      process.env.GEMINI_API_KEY !== 'YOUR_API_KEY_HERE'
    );
    console.log(`======================================================`);
    console.log(`  CampusResolve AI Backend Server Started`);
    console.log(`  Target: Lovely Professional University (LPU), Phagwara`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Gemini AI API Key Configured: ${hasKey ? 'YES (gemini-2.5-flash)' : 'NO (Fallback active)'}`);
    console.log(`======================================================`);
  });
}

export default app;
