import { Router } from 'express';
import {
  generateToeicQuestions,
  generateToeicPart6Passages,
  generateToeicPart7Passages,
} from '../services/omniroute.service.js';
import { getKey } from '../db/key-store.js';
import { bankStore } from '../db/bank-store.js';
import { generationRateLimit } from '../middleware/rate-limit.js';

const router = Router();

// Safety caps mirroring the real exam (Part 5: 30, Part 6: 4 passages, Part 7: 10 sets/batch).
const MAX_PART5_COUNT = 30;
const MAX_PART6_COUNT = 4;
const MAX_PART7_COUNT = 10;
const MAX_BATCHES = 20;

const PART7_TYPES = ['Single', 'Double', 'Triple'];

const API_KEY_ERROR =
  'apiKey is required. Provide it in the request body or set OMNIROUTE_API_KEY in the server .env file.';

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
  if (providedKey) return providedKey;
  const storedKey = getKey('omniroute');
  if (storedKey) return storedKey;
  if (DEFAULT_API_KEY) return DEFAULT_API_KEY;
  return null;
}

/** Count validation shared by all generation endpoints. */
function countValidationError(count, max, maxMessage) {
  if (!Number.isInteger(count) || count < 1) {
    return 'count must be a positive integer.';
  }
  if (count > max) {
    return `count must not exceed ${max}${maxMessage}`;
  }
  return null;
}

function passageTypeValidationError(passageType, batchPrefix = '') {
  if (!passageType || !PART7_TYPES.includes(passageType)) {
    return `${batchPrefix}passageType must be Single, Double, or Triple.`;
  }
  return null;
}

function startQuestionValidationError(startQuestionNumber, batchPrefix = '') {
  if (!Number.isInteger(startQuestionNumber) || startQuestionNumber < 1) {
    return `${batchPrefix}startQuestionNumber must be a positive integer.`;
  }
  return null;
}

/**
 * Shared generation pipeline used by part5/part6/part7:
 * validate -> sample bank (unless useCache=false) -> AI-generate remainder ->
 * optional post-process (renumbering) -> respond.
 * Centralizes logging and the cache/generate merge so each route stays thin.
 *
 * @param {object} p
 * @param {import('express').Response} p.res
 * @param {string} p.part           bank part key, or '' to skip bank sampling
 * @param {number} p.count
 * @param {string} p.apiKey
 * @param {string} p.logLabel       e.g. 'Part5'
 * @param {string} p.responseKey    'questions' | 'passages'
 * @param {(needed: number, cached: any[]) => Promise<any[]>} p.generate
 * @param {(items: any[]) => any[]} [p.postProcess]
 */
async function handleGeneration({
  res,
  part,
  count,
  apiKey,
  logLabel,
  responseKey,
  generate,
  postProcess,
}) {
  const start = Date.now();
  let cached = [];
  if (part) {
    try {
      cached = bankStore.sample(part, count);
    } catch {
      cached = [];
    }
  }
  const needed = count - cached.length;
  let fresh = [];
  if (needed > 0) {
    console.log(`[${logLabel}] Generating ${needed}... (${cached.length} from bank)`);
    fresh = await generate(needed, cached);
  } else {
    console.log(`[${logLabel}] Served ${count} from bank (no AI call)`);
  }
  const items = postProcess ? postProcess([...cached, ...fresh]) : [...cached, ...fresh];
  console.log(
    `[${logLabel}] Done in ${Date.now() - start}ms (${items.length} items, ${cached.length} cached)`,
  );
  res.json({ [responseKey]: items, fromCache: cached.length });
}

/**
 * POST /api/toeic/part5
 * Generates TOEIC Part 5 questions.
 * Serves cached bank items first (fast + free), AI-generates the remainder.
 * Body: { count: number, apiKey?: string, useCache?: boolean }
 */
router.post('/part5', generationRateLimit, async (req, res) => {
  try {
    const { count, apiKey: providedKey, useCache } = req.body ?? {};

    const apiKey = resolveApiKey(providedKey);
    if (!apiKey) {
      return res.status(400).json({ error: API_KEY_ERROR });
    }
    const countError = countValidationError(count, MAX_PART5_COUNT, ' (official Part 5 size).');
    if (countError) {
      return res.status(400).json({ error: countError });
    }

    await handleGeneration({
      res,
      part: useBankCache(useCache) ? 'part5' : '',
      count,
      apiKey,
      logLabel: 'Part5',
      responseKey: 'questions',
      generate: (needed) => generateToeicQuestions(needed, apiKey),
    });
  } catch (error) {
    console.error('Error generating Part 5 questions:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/toeic/part6
 * Generates TOEIC Part 6 passages.
 * Serves cached bank items first (blanks renumbered sequentially from [131]).
 * Body: { count: number, apiKey?: string, useCache?: boolean }
 */
router.post('/part6', generationRateLimit, async (req, res) => {
  try {
    const { count, apiKey: providedKey, useCache } = req.body ?? {};

    const apiKey = resolveApiKey(providedKey);
    if (!apiKey) {
      return res.status(400).json({ error: API_KEY_ERROR });
    }
    const countError = countValidationError(count, MAX_PART6_COUNT, ' (official Part 6 size).');
    if (countError) {
      return res.status(400).json({ error: countError });
    }

    await handleGeneration({
      res,
      part: useBankCache(useCache) ? 'part6' : '',
      count,
      apiKey,
      logLabel: 'Part6',
      responseKey: 'passages',
      generate: (needed) => generateToeicPart6Passages(needed, apiKey),
      // Renumber blanks sequentially across the combined set so cached + fresh
      // passages never collide ([131]...).
      postProcess: renumberPart6Blanks,
    });
  } catch (error) {
    console.error('Error generating Part 6 passages:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/toeic/part7
 * Generates TOEIC Part 7 passages.
 * Serves cached bank items first (renumbered from startQuestionNumber).
 * Body: { passageType: 'Single'|'Double'|'Triple', count: number, startQuestionNumber: number, apiKey?: string, useCache?: boolean }
 */
router.post('/part7', generationRateLimit, async (req, res) => {
  try {
    const { passageType, count, startQuestionNumber, apiKey: providedKey, useCache } = req.body ?? {};

    const apiKey = resolveApiKey(providedKey);
    if (!apiKey) {
      return res.status(400).json({ error: API_KEY_ERROR });
    }
    const typeError = passageTypeValidationError(passageType);
    if (typeError) {
      return res.status(400).json({ error: typeError });
    }
    const countError = countValidationError(count, MAX_PART7_COUNT, ' sets per request.');
    if (countError) {
      return res.status(400).json({ error: countError });
    }
    const startError = startQuestionValidationError(startQuestionNumber);
    if (startError) {
      return res.status(400).json({ error: startError });
    }

    await handleGeneration({
      res,
      part: useBankCache(useCache) ? `part7-${passageType}` : '',
      count,
      apiKey,
      logLabel: 'Part7',
      responseKey: 'passages',
      generate: (needed, cached) => {
        const freshStart = startQuestionNumber + cached.reduce((n, p) => n + p.questions.length, 0);
        return generateToeicPart7Passages(passageType, needed, freshStart, apiKey);
      },
      // Renumber across the combined set for a gapless sequence from startQuestionNumber.
      postProcess: (items) => renumberPart7Questions(items, startQuestionNumber),
    });
  } catch (error) {
    console.error('Error generating Part 7 passages:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
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
router.post('/part7/batch', generationRateLimit, async (req, res) => {
  try {
    const { batches, apiKey: providedKey } = req.body ?? {};

    const apiKey = resolveApiKey(providedKey);
    if (!apiKey) {
      return res.status(400).json({ error: API_KEY_ERROR });
    }
    if (!Array.isArray(batches) || batches.length === 0) {
      return res.status(400).json({ error: 'batches must be a non-empty array.' });
    }
    // Cap số batch: mỗi batch gọi upstream AI — array khổng lồ trước đây
    // biến endpoint này thành generation farm tùy ý.
    if (batches.length > MAX_BATCHES) {
      return res.status(400).json({ error: `batches must not exceed ${MAX_BATCHES} items per request.` });
    }

    for (let i = 0; i < batches.length; i++) {
      const { passageType, count, startQuestionNumber } = batches[i];
      const prefix = `Batch ${i}: `;
      const error =
        passageTypeValidationError(passageType, prefix) ??
        (Number.isInteger(count) && count >= 1
          ? null
          : `${prefix}count must be a positive integer.`) ??
        startQuestionValidationError(startQuestionNumber, prefix);
      if (error) {
        return res.status(400).json({ error });
      }
    }

    const totalStart = Date.now();
    console.log(`[Part7-Batch] Processing ${batches.length} batches...`);

    const allPassages = [];

    for (let i = 0; i < batches.length; i++) {
      const { passageType, count, startQuestionNumber } = batches[i];
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
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
