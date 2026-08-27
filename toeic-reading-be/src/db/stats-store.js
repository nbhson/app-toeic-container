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
   * @param {string} userId
   * @param {object} stats - The complete stats object to save.
   */
  function saveStats(userId, stats) {
    ensureStatsDir();
    const filePath = getStatsPath(userId);
    writeFileSync(filePath, JSON.stringify(stats, null, 2), 'utf-8');
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