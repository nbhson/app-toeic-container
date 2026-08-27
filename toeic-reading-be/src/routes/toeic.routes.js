import { Router } from 'express';
import {
  generateToeicQuestions,
  generateToeicPart6Passages,
  generateToeicPart7Passages,
} from '../services/omniroute.service.js';
import { getKey } from '../db/key-store.js';

const router = Router();

const DEFAULT_API_KEY = process.env.OMNIROUTE_API_KEY || '';

/**
 * Resolves the API key with priority:
 * 1. Provided key from request body (UI override)
 * 2. Stored key from BE key store (user saved via settings)
 * 3. Default key from .env
 */
function resolveApiKey(providedKey) {
  // 1. Key provided directly in request
  if (providedKey) {
    return providedKey;
  }

  // 2. Key stored in BE key store
  const storedKey = getKey('omniroute');
  if (storedKey) {
    return storedKey;
  }

  // 3. Default key from .env
  if (DEFAULT_API_KEY) {
    return DEFAULT_API_KEY;
  }

  return null;
}

/**
 * POST /api/toeic/part5
 * Generates TOEIC Part 5 questions.
 * Body: { count: number, apiKey?: string }
 */
router.post('/part5', async (req, res) => {
  try {
    const { count, apiKey: providedKey } = req.body;

    const apiKey = resolveApiKey(providedKey);
    if (!apiKey) {
      return res.status(400).json({ error: 'apiKey is required. Provide it in the request body or set OMNIROUTE_API_KEY in the server .env file.' });
    }
    if (!count || count < 1) {
      return res.status(400).json({ error: 'count must be a positive number.' });
    }

    const start = Date.now();
    console.log(`[Part5] Generating ${count} questions...`);
    const questions = await generateToeicQuestions(count, apiKey);
    console.log(`[Part5] Done in ${Date.now() - start}ms (${questions.length} questions)`);
    res.json({ questions });
  } catch (error) {
    console.error('Error generating Part 5 questions:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * POST /api/toeic/part6
 * Generates TOEIC Part 6 passages.
 * Body: { count: number, apiKey?: string }
 */
router.post('/part6', async (req, res) => {
  try {
    const { count, apiKey: providedKey } = req.body;

    const apiKey = resolveApiKey(providedKey);
    if (!apiKey) {
      return res.status(400).json({ error: 'apiKey is required. Provide it in the request body or set OMNIROUTE_API_KEY in the server .env file.' });
    }
    if (!count || count < 1) {
      return res.status(400).json({ error: 'count must be a positive number.' });
    }

    const start = Date.now();
    console.log(`[Part6] Generating ${count} passages...`);
    const passages = await generateToeicPart6Passages(count, apiKey);
    console.log(`[Part6] Done in ${Date.now() - start}ms (${passages.length} passages)`);
    res.json({ passages });
  } catch (error) {
    console.error('Error generating Part 6 passages:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * POST /api/toeic/part7
 * Generates TOEIC Part 7 passages.
 * Body: { passageType: 'Single'|'Double'|'Triple', count: number, startQuestionNumber: number, apiKey?: string }
 */
router.post('/part7', async (req, res) => {
  try {
    const { passageType, count, startQuestionNumber, apiKey: providedKey } = req.body;

    const apiKey = resolveApiKey(providedKey);
    if (!apiKey) {
      return res.status(400).json({ error: 'apiKey is required. Provide it in the request body or set OMNIROUTE_API_KEY in the server .env file.' });
    }
    if (!passageType || !['Single', 'Double', 'Triple'].includes(passageType)) {
      return res.status(400).json({ error: 'passageType must be Single, Double, or Triple.' });
    }
    if (!count || count < 1) {
      return res.status(400).json({ error: 'count must be a positive number.' });
    }
    if (startQuestionNumber === undefined || startQuestionNumber < 1) {
      return res.status(400).json({ error: 'startQuestionNumber must be a positive number.' });
    }

    const start = Date.now();
    console.log(`[Part7] Generating ${count} ${passageType} passages (starting at Q${startQuestionNumber})...`);
    const passages = await generateToeicPart7Passages(passageType, count, startQuestionNumber, apiKey);
    console.log(`[Part7] Done in ${Date.now() - start}ms (${passages.length} passages)`);
    res.json({ passages });
  } catch (error) {
    console.error('Error generating Part 7 passages:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * POST /api/toeic/part7/batch
 * Generates multiple batches of Part 7 passages in a SINGLE request.
 * This eliminates multiple HTTP round-trips from the UI.
 * Body: {
 *   batches: Array<{ passageType, count, startQuestionNumber }>,
 *   apiKey?: string
 * }
 */
router.post('/part7/batch', async (req, res) => {
  try {
    const { batches, apiKey: providedKey } = req.body;

    const apiKey = resolveApiKey(providedKey);
    if (!apiKey) {
      return res.status(400).json({ error: 'apiKey is required. Provide it in the request body or set OMNIROUTE_API_KEY in the server .env file.' });
    }
    if (!Array.isArray(batches) || batches.length === 0) {
      return res.status(400).json({ error: 'batches must be a non-empty array.' });
    }

    const totalStart = Date.now();
    console.log(`[Part7-Batch] Processing ${batches.length} batches...`);

    const allPassages = [];

    for (let i = 0; i < batches.length; i++) {
      const { passageType, count, startQuestionNumber } = batches[i];

      if (!passageType || !['Single', 'Double', 'Triple'].includes(passageType)) {
        return res.status(400).json({ error: `Batch ${i}: passageType must be Single, Double, or Triple.` });
      }
      if (!count || count < 1) {
        return res.status(400).json({ error: `Batch ${i}: count must be a positive number.` });
      }
      if (startQuestionNumber === undefined || startQuestionNumber < 1) {
        return res.status(400).json({ error: `Batch ${i}: startQuestionNumber must be a positive number.` });
      }

      const batchStart = Date.now();
      console.log(`[Part7-Batch] Batch ${i + 1}/${batches.length}: ${count} ${passageType} (Q${startQuestionNumber})...`);

      const passages = await generateToeicPart7Passages(passageType, count, startQuestionNumber, apiKey);
      allPassages.push(...passages);

      console.log(`[Part7-Batch] Batch ${i + 1}/${batches.length}: Done in ${Date.now() - batchStart}ms (${passages.length} passages)`);
    }

    console.log(`[Part7-Batch] All ${batches.length} batches completed in ${Date.now() - totalStart}ms (${allPassages.length} total passages)`);
    res.json({ passages: allPassages });
  } catch (error) {
    console.error('Error generating Part 7 batch:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

export default router;