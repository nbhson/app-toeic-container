import { Router } from 'express';
import { generateContent } from '../services/gemini.service.js';
import { getKey } from '../db/key-store.js';
import { generationRateLimit } from '../middleware/rate-limit.js';

const router = Router();

const API_KEY_ERROR =
  'Gemini API key is not configured. Pass apiKey in the request body, save it via /api/toeic/keys, or set GEMINI_API_KEY in the server .env file.';

/**
 * POST /api/toeic/gemini/generate
 * Server-side proxy for the Gemini generateContent API so the browser never
 * talks to Google directly and the key never lives in client code.
 * The key is resolved with priority: body apiKey (UI override) -> BE key
 * store ('gemini', saved via /api/toeic/keys) -> GEMINI_API_KEY env.
 * Body: { contents: Array, generationConfig?: object, model?: string, apiKey?: string }
 * Responds with the raw Gemini JSON (candidates...).
 */
router.post('/generate', generationRateLimit, async (req, res) => {
  try {
    const { contents, generationConfig, model, apiKey: providedKey } = req.body ?? {};

    if (!contents) {
      return res.status(400).json({ error: 'contents is required.' });
    }

    const apiKey =
      (typeof providedKey === 'string' && providedKey.trim()) ||
      getKey('gemini') ||
      (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(400).json({ error: API_KEY_ERROR });
    }

    // NOTE: never log or echo apiKey — API keys must not leak into logs/responses.
    const data = await generateContent({ contents, generationConfig, model, apiKey });
    res.json(data);
  } catch (error) {
    console.error('Error calling Gemini API:', error.message);
    res.status(500).json({ error: error?.message || 'Internal server error.' });
  }
});

export default router;
