import { Router } from 'express';
import {
  generateToeicQuestions,
  generateToeicPart6Passages,
  generateToeicPart7Passages,
} from '../services/omniroute.service.js';
import { getKey } from '../db/key-store.js';
import { bankStore } from '../db/bank-store.js';

const router = Router();

// Safety caps mirroring the real exam (Part 5: 30, Part 6: 4 passages, Part 7: 10 sets/batch).
const MAX_PART5_COUNT = 30;
const MAX_PART6_COUNT = 4;
const MAX_PART7_COUNT = 10;

/** useCache defaults to true; pass false to force fresh AI generation. */
function useBankCache(flag) {
  return flag !== false && flag !== 'false' && flag !== 0;
}

/** Rewrite Part 6 blank markers sequentially ([131]...) across served passages. */
function renumberPart6Blanks(passages) {
  let next = 131;
  return passages.map((p) => ({
    ...p,
    text: p.text.replace(/\[\d+\]/g, () => `[${next++}]`),
  }));
}

/** Renumber Part 7 questions sequentially from `start` across served sets. */
function renumberPart7Questions(passages, start) {
  let next = start;
  return passages.map((p) => ({
    ...p,
    questions: p.questions.map((q) => ({ ...q, questionNumber: next++ })),
  }));
}

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
 * Serves cached bank items first (fast + free), AI-generates the remainder.
 * Body: { count: number, apiKey?: string, useCache?: boolean }
 */
router.post('/part5', async (req, res) => {
  try {
    const { count, apiKey: providedKey, useCache } = req.body;

    const apiKey = resolveApiKey(providedKey);
    if (!apiKey) {
      return res.status(400).json({ error: 'apiKey is required. Provide it in the request body or set OMNIROUTE_API_KEY in the server .env file.' });
    }
    if (!count || count < 1) {
      return res.status(400).json({ error: 'count must be a positive number.' });
    }
    if (count > MAX_PART5_COUNT) {
      return res.status(400).json({ error: `count must not exceed ${MAX_PART5_COUNT} (official Part 5 size).` });
    }

    const start = Date.now();
    let cached = [];
    if (useBankCache(useCache)) {
      try {
        cached = bankStore.sample('part5', count);
      } catch {
        cached = [];
      }
    }
    const needed = count - cached.length;
    let fresh = [];
    if (needed > 0) {
      console.log(`[Part5] Generating ${needed} questions... (${cached.length} from bank)`);
      fresh = await generateToeicQuestions(needed, apiKey);
    } else {
      console.log(`[Part5] Served ${cached.length} questions from bank (no AI call)`);
    }
    const questions = [...cached, ...fresh];
    console.log(`[Part5] Done in ${Date.now() - start}ms (${questions.length} questions, ${cached.length} cached)`);
    res.json({ questions, fromCache: cached.length });
  } catch (error) {
    console.error('Error generating Part 5 questions:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * POST /api/toeic/part6
 * Generates TOEIC Part 6 passages.
 * Serves cached bank items first (blanks renumbered sequentially from [131]).
 * Body: { count: number, apiKey?: string, useCache?: boolean }
 */
router.post('/part6', async (req, res) => {
  try {
    const { count, apiKey: providedKey, useCache } = req.body;

    const apiKey = resolveApiKey(providedKey);
    if (!apiKey) {
      return res.status(400).json({ error: 'apiKey is required. Provide it in the request body or set OMNIROUTE_API_KEY in the server .env file.' });
    }
    if (!count || count < 1) {
      return res.status(400).json({ error: 'count must be a positive number.' });
    }
    if (count > MAX_PART6_COUNT) {
      return res.status(400).json({ error: `count must not exceed ${MAX_PART6_COUNT} (official Part 6 size).` });
    }

    const start = Date.now();
    let cached = [];
    if (useBankCache(useCache)) {
      try {
        cached = bankStore.sample('part6', count);
      } catch {
        cached = [];
      }
    }
    const needed = count - cached.length;
    let fresh = [];
    if (needed > 0) {
      console.log(`[Part6] Generating ${needed} passages... (${cached.length} from bank)`);
      fresh = await generateToeicPart6Passages(needed, apiKey);
    } else {
      console.log(`[Part6] Served ${cached.length} passages from bank (no AI call)`);
    }
    // Renumber blanks sequentially across the combined set so cached + fresh
    // passages never collide ([131]...).
    const passages = renumberPart6Blanks([...cached, ...fresh]);
    console.log(`[Part6] Done in ${Date.now() - start}ms (${passages.length} passages, ${cached.length} cached)`);
    res.json({ passages, fromCache: cached.length });
  } catch (error) {
    console.error('Error generating Part 6 passages:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * POST /api/toeic/part7
 * Generates TOEIC Part 7 passages.
 * Serves cached bank items first (renumbered from startQuestionNumber).
 * Body: { passageType: 'Single'|'Double'|'Triple', count: number, startQuestionNumber: number, apiKey?: string, useCache?: boolean }
 */
router.post('/part7', async (req, res) => {
  try {
    const { passageType, count, startQuestionNumber, apiKey: providedKey, useCache } = req.body;

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
    if (count > MAX_PART7_COUNT) {
      return res.status(400).json({ error: `count must not exceed ${MAX_PART7_COUNT} sets per request.` });
    }
    if (startQuestionNumber === undefined || startQuestionNumber < 1) {
      return res.status(400).json({ error: 'startQuestionNumber must be a positive number.' });
    }

    const start = Date.now();
    let cached = [];
    if (useBankCache(useCache)) {
      try {
        cached = bankStore.sample(`part7-${passageType}`, count);
      } catch {
        cached = [];
      }
    }
    const needed = count - cached.length;
    let fresh = [];
    if (needed > 0) {
      const freshStart = startQuestionNumber + cached.reduce((n, p) => n + p.questions.length, 0);
      console.log(`[Part7] Generating ${needed} ${passageType} passages (Q${freshStart})... (${cached.length} from bank)`);
      fresh = await generateToeicPart7Passages(passageType, needed, freshStart, apiKey);
    } else {
      console.log(`[Part7] Served ${cached.length} ${passageType} passages from bank (no AI call)`);
    }
    // Renumber across the combined set for a gapless sequence from startQuestionNumber.
    const passages = renumberPart7Questions([...cached, ...fresh], startQuestionNumber);
    console.log(`[Part7] Done in ${Date.now() - start}ms (${passages.length} passages, ${cached.length} cached)`);
    res.json({ passages, fromCache: cached.length });
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