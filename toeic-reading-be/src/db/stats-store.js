/**
 * JSON file-based stats store for per-user TOEIC practice data.
 * Each user's stats are stored in data/stats/{userId}.json
 */

import { readFileSync, mkdirSync, existsSync, unlinkSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJsonFileAtomic } from './atomic-write.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_DATA_DIR = join(__dirname, '../../data');
const STATS_DIRNAME = 'stats';

/**
 * Maximum history entries kept per user. The file is trimmed (oldest first)
 * on every save so stats files never grow unbounded.
 * Override with the MAX_HISTORY_SIZE env var.
 */
export const MAX_HISTORY_SIZE = parseInt(process.env.MAX_HISTORY_SIZE || '200', 10) || 200;

/**
 * Derives a weak-point analysis from a stats object (pure function, no I/O).
 * @param {object|null} stats - User stats or null.
 * @returns {{ overall: object, byCategory: Array, weakest: Array, recentWrong: Array }}
 */
export function analyzeStats(stats) {
  const empty = {
    overall: { answered: 0, correct: 0, accuracy: 0 },
    byCategory: [],
    weakest: [],
    recentWrong: [],
  };
  if (!stats || typeof stats !== 'object') return empty;
  const catStats = stats.categoryStats && typeof stats.categoryStats === 'object' ? stats.categoryStats : {};
  const byCategory = Object.entries(catStats).map(([category, v]) => {
    const answered = Number(v?.answered) || 0;
    const correct = Number(v?.correct) || 0;
    return { category, answered, correct, accuracy: answered === 0 ? 0 : Math.round((correct / answered) * 1000) / 10 };
  });
  const answered = byCategory.reduce((n, c) => n + c.answered, 0);
  const correct = byCategory.reduce((n, c) => n + c.correct, 0);
  // Weakest = attempted categories (min 3 answers) sorted by accuracy ascending, top 3.
  const weakest = byCategory
    .filter((c) => c.answered >= 3)
    .sort((a, b) => a.accuracy - b.accuracy || b.answered - a.answered)
    .slice(0, 3);
  const history = Array.isArray(stats.history) ? stats.history : [];
  const recentWrong = history.filter((h) => h && h.isCorrect === false).slice(-10).reverse();
  return {
    overall: { answered, correct, accuracy: answered === 0 ? 0 : Math.round((correct / answered) * 1000) / 10 },
    byCategory: byCategory.sort((a, b) => b.answered - a.answered),
    weakest,
    recentWrong,
  };
}

/**
 * Validates + normalizes a stats payload coming from the network.
 * Throws an Error with a client-safe message when the payload is malformed;
 * returns a clean copy (clamped integers, whitelisted fields, trimmed history)
 * so corrupt data can never reach the store or skew analytics.
 *
 * @param {unknown} stats
 * @returns {object} normalized stats
 */
export function sanitizeStats(stats) {
  if (!stats || typeof stats !== 'object' || Array.isArray(stats)) {
    throw new Error('stats must be an object.');
  }

  /** Non-negative safe integer (strict: booleans/strings/floats are rejected). */
  function nonNegInt(value, label) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error(`${label} must be a non-negative integer.`);
    }
    return Math.min(value, Number.MAX_SAFE_INTEGER);
  }

  function historyEntry(entry, index) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new Error(`history[${index}] must be an object.`);
    }
    if (typeof entry.questionId !== 'string' || !entry.questionId) {
      throw new Error(`history[${index}].questionId must be a non-empty string.`);
    }
    if (typeof entry.questionText !== 'string') {
      throw new Error(`history[${index}].questionText must be a string.`);
    }
    if (typeof entry.isCorrect !== 'boolean') {
      throw new Error(`history[${index}].isCorrect must be a boolean.`);
    }
    const timestamp = Number(entry.timestamp);
    if (typeof entry.timestamp !== 'number' || !Number.isFinite(timestamp)) {
      throw new Error(`history[${index}].timestamp must be a number.`);
    }
    return {
      questionId: entry.questionId,
      questionText: entry.questionText,
      selectedAnswer: nonNegInt(entry.selectedAnswer, `history[${index}].selectedAnswer`),
      correctAnswer: nonNegInt(entry.correctAnswer, `history[${index}].correctAnswer`),
      isCorrect: entry.isCorrect,
      timestamp,
    };
  }

  const categoryStats = {};
  if (stats.categoryStats !== undefined) {
    if (typeof stats.categoryStats !== 'object' || stats.categoryStats === null || Array.isArray(stats.categoryStats)) {
      throw new Error('stats.categoryStats must be an object.');
    }
    const entries = Object.entries(stats.categoryStats);
    if (entries.length > 100) {
      throw new Error('stats.categoryStats must not contain more than 100 categories.');
    }
    for (const [category, v] of entries) {
      if (typeof category !== 'string' || !category.trim() || category.length > 100) {
        throw new Error('category names must be non-empty strings (max 100 chars).');
      }
      if (!v || typeof v !== 'object' || Array.isArray(v)) {
        throw new Error(`categoryStats["${category}"] must be an object.`);
      }
      categoryStats[category] = {
        answered: nonNegInt(v.answered, `categoryStats["${category}"].answered`),
        correct: nonNegInt(v.correct, `categoryStats["${category}"].correct`),
      };
    }
  }

  let history = [];
  if (stats.history !== undefined) {
    if (!Array.isArray(stats.history)) {
      throw new Error('stats.history must be an array.');
    }
    if (stats.history.length > MAX_HISTORY_SIZE) {
      throw new Error(`stats.history must not contain more than ${MAX_HISTORY_SIZE} entries.`);
    }
    history = stats.history.map(historyEntry);
  }

  return {
    totalAnswered: nonNegInt(stats.totalAnswered ?? 0, 'totalAnswered'),
    totalCorrect: nonNegInt(stats.totalCorrect ?? 0, 'totalCorrect'),
    totalIncorrect: nonNegInt(stats.totalIncorrect ?? 0, 'totalIncorrect'),
    categoryStats,
    history,
  };
}

/**
 * Creates a stats store instance with the given data directory.
 * @param {string} dataDir - Base data directory (stats will be in dataDir/stats/)
 * @returns {{ getStats: Function, saveStats: Function, deleteStats: Function, listUsers: Function }}
 */
export function createStatsStore(dataDir = DEFAULT_DATA_DIR) {
  const statsDir = join(dataDir, STATS_DIRNAME);

  function ensureStatsDir() {
    if (!existsSync(statsDir)) {
      mkdirSync(statsDir, { recursive: true });
    }
  }

  function getStatsPath(userId) {
    // Sanitize userId to prevent path traversal
    const sanitized = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return join(statsDir, `${sanitized}.json`);
  }

  const DEFAULT_STATS = {
    totalAnswered: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    categoryStats: {
      Grammar: { answered: 0, correct: 0 },
      Vocabulary: { answered: 0, correct: 0 },
      'Word Forms': { answered: 0, correct: 0 },
      'Sentence Insertion': { answered: 0, correct: 0 },
      'Single Passage': { answered: 0, correct: 0 },
      'Double Passage': { answered: 0, correct: 0 },
      'Triple Passage': { answered: 0, correct: 0 },
    },
    history: [],
  };

  /**
   * Gets stats for a specific user.
   * @param {string} userId
   * @returns {object|null} The user's stats or null if not found.
   */
  function getStats(userId) {
    const filePath = getStatsPath(userId);
    if (!existsSync(filePath)) {
      return null;
    }
    try {
      const raw = readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  /**
   * Saves stats for a specific user (full replacement).
   * History is trimmed to MAX_HISTORY_SIZE (oldest first) to bound file size.
   * @param {string} userId
   * @param {object} stats - The complete stats object to save.
   */
  function saveStats(userId, stats) {
    ensureStatsDir();
    const filePath = getStatsPath(userId);
    const toSave = { ...stats };
    if (Array.isArray(toSave.history) && toSave.history.length > MAX_HISTORY_SIZE) {
      toSave.history = toSave.history.slice(toSave.history.length - MAX_HISTORY_SIZE);
    }
    // Atomic write: a crash mid-write can no longer corrupt the stats file.
    writeJsonFileAtomic(filePath, toSave);
  }

  /**
   * Deletes stats for a specific user.
   * @param {string} userId
   * @returns {boolean} True if deleted, false if not found.
   */
  function deleteStats(userId) {
    const filePath = getStatsPath(userId);
    if (!existsSync(filePath)) {
      return false;
    }
    unlinkSync(filePath);
    return true;
  }

  /**
   * Lists all user IDs that have stats.
   * @returns {string[]} Array of user IDs.
   */
  function listUsers() {
    ensureStatsDir();
    const files = readdirSync(statsDir);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  }

  return { getStats, saveStats, deleteStats, listUsers, DEFAULT_STATS };
}

/**
 * Default stats store instance using the production data directory.
 */
export const statsStore = createStatsStore();

// Re-export for backward compatibility
export const getStats = statsStore.getStats;
export const saveStats = statsStore.saveStats;
export const deleteStats = statsStore.deleteStats;