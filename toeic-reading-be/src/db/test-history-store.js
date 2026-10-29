/**
 * File-based test-history store: server-side record of completed full Reading
 * tests, one file per user (data/test-history/{userId}.json, capped array).
 * Powers the score-trend feature in the UI (R2-7).
 *
 * Each entry shape (validated before insert):
 *   { takenAt: number, score: number, correct: number, total: number,
 *     percent: number, level: string,
 *     partScores?: { part5: {correct,total}, part6: {...}, part7: {...} } }
 */

import { readFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJsonFileAtomic } from './atomic-write.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_DATA_DIR = join(__dirname, '../../data');
const HISTORY_DIRNAME = 'test-history';

/** Maximum stored test results per user (oldest trimmed first). */
export const MAX_TEST_HISTORY = parseInt(process.env.MAX_TEST_HISTORY || '100', 10) || 100;

/** Marks client-caused validation failures (→ HTTP 400) vs server faults (→ 500). */
export class ValidationError extends Error {}

/**
 * Validates + normalizes one test-history entry. Throws a ValidationError with
 * a client-safe message when malformed; clamps numbers into safe ranges.
 * @param {unknown} entry
 */
export function sanitizeTestHistoryEntry(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new ValidationError('history entry must be an object.');
  }
  const takenAt = Number(entry.takenAt);
  if (!Number.isFinite(takenAt)) {
    throw new ValidationError('takenAt must be a number.');
  }
  const score = Number(entry.score);
  const correct = Number(entry.correct);
  const total = Number(entry.total);
  for (const [name, value] of [
    ['score', score],
    ['correct', correct],
    ['total', total],
  ]) {
    if (!Number.isFinite(value) || value < 0) {
      throw new ValidationError(`${name} must be a non-negative number.`);
    }
  }
  if (!Number.isInteger(correct) || !Number.isInteger(total) || total < 1 || correct > total) {
    throw new ValidationError('correct must be an integer within 0..total (total >= 1).');
  }
  const percent = Number.isFinite(Number(entry.percent))
    ? Math.min(100, Math.max(0, Number(entry.percent)))
    : Math.round((correct / total) * 1000) / 10;
  const level = typeof entry.level === 'string' ? entry.level : '';
  let partScores;
  if (entry.partScores !== undefined) {
    if (!entry.partScores || typeof entry.partScores !== 'object' || Array.isArray(entry.partScores)) {
      throw new ValidationError('partScores must be an object.');
    }
    partScores = {};
    for (const [part, v] of Object.entries(entry.partScores)) {
      if (!v || typeof v !== 'object') throw new ValidationError(`partScores.${part} must be an object.`);
      const c = Number(v.correct);
      const t = Number(v.total);
      if (!Number.isInteger(c) || !Number.isInteger(t) || c < 0 || t < 0) {
        throw new ValidationError(`partScores.${part} needs non-negative integer correct/total.`);
      }
      partScores[part] = { correct: c, total: t };
    }
  }
  return {
    takenAt,
    score: Math.min(495, Math.max(5, score)),
    correct,
    total,
    percent,
    level,
    ...(partScores ? { partScores } : {}),
  };
}

/**
 * Creates a test-history store instance.
 * @param {string} dataDir - Base data directory (history lives in dataDir/test-history/).
 */
export function createTestHistoryStore(dataDir = DEFAULT_DATA_DIR) {
  const dir = join(dataDir, HISTORY_DIRNAME);

  function ensureDir() {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  function getFilePath(userId) {
    // Sanitize userId to prevent path traversal
    const sanitized = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
    return join(dir, `${sanitized}.json`);
  }

  function getHistory(userId) {
    const filePath = getFilePath(userId);
    if (!existsSync(filePath)) return [];
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf-8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Appends a test result (validated). Returns the trimmed stored array.
   * @param {string} userId
   * @param {object} entry
   */
  function addResult(userId, entry) {
    const sanitized = sanitizeTestHistoryEntry(entry);
    ensureDir();
    const list = getHistory(userId);
    list.push(sanitized);
    const trimmed = list.slice(Math.max(0, list.length - MAX_TEST_HISTORY));
    writeJsonFileAtomic(getFilePath(userId), trimmed);
    return trimmed;
  }

  function getResults(userId) {
    return getHistory(userId);
  }

  function deleteHistory(userId) {
    const filePath = getFilePath(userId);
    if (!existsSync(filePath)) return false;
    unlinkSync(filePath);
    return true;
  }

  return { addResult, getResults, deleteHistory };
}

/** Default instance using the production data directory. */
export const testHistoryStore = createTestHistoryStore();
