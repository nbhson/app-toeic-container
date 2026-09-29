/**
 * JSON file-based stats store for per-user TOEIC practice data.
 * Each user's stats are stored in data/stats/{userId}.json
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
    writeFileSync(filePath, JSON.stringify(toSave, null, 2), 'utf-8');
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