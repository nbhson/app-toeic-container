/**
 * File-based notebook store: server-side persistence of the wrong-answer
 * notebook's "đã ôn" (reviewed) flags, one file per user
 * (data/notebook/{userId}.json). The UI keeps localStorage as the optimistic
 * cache/fallback and syncs the full reviewed-id list through GET/PUT here
 * (Round 3).
 *
 * File shape: { updatedAt: number, reviewedIds: string[] }
 */

import { readFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJsonFileAtomic } from './atomic-write.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_DATA_DIR = join(__dirname, '../../data');
const NOTEBOOK_DIRNAME = 'notebook';

/** Maximum stored reviewed question ids per user (notebook is capped in the UI). */
export const MAX_NOTEBOOK_REVIEWED = parseInt(process.env.MAX_NOTEBOOK_REVIEWED || '500', 10) || 500;

/** Sanity cap for a single question id (UI ids are well below this). */
const MAX_ID_LENGTH = 200;

/** Marks client-caused validation failures (→ HTTP 400) vs server faults (→ 500). */
export class NotebookValidationError extends Error {}

/**
 * Validates + normalizes a reviewedIds payload: array of non-empty strings,
 * deduplicated, capped at MAX_NOTEBOOK_REVIEWED. Order is preserved.
 * @param {unknown} input
 * @returns {string[]}
 */
export function sanitizeNotebookIds(input) {
  if (!Array.isArray(input)) {
    throw new NotebookValidationError('reviewedIds must be an array of strings.');
  }
  if (input.length > MAX_NOTEBOOK_REVIEWED) {
    throw new NotebookValidationError(
      `reviewedIds must not exceed ${MAX_NOTEBOOK_REVIEWED} items.`,
    );
  }
  const seen = new Set();
  const out = [];
  for (let i = 0; i < input.length; i++) {
    const id = input[i];
    if (typeof id !== 'string' || id.length === 0) {
      throw new NotebookValidationError(`reviewedIds[${i}] must be a non-empty string.`);
    }
    if (id.length > MAX_ID_LENGTH) {
      throw new NotebookValidationError(`reviewedIds[${i}] must not exceed ${MAX_ID_LENGTH} characters.`);
    }
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

/**
 * Creates a notebook store instance.
 * @param {string} dataDir - Base data directory (files live in dataDir/notebook/).
 */
export function createNotebookStore(dataDir = DEFAULT_DATA_DIR) {
  const dir = join(dataDir, NOTEBOOK_DIRNAME);

  function getFilePath(userId) {
    // Sanitize userId to prevent path traversal (same policy as test-history).
    const sanitized = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
    return join(dir, `${sanitized}.json`);
  }

  function readNotebook(filePath) {
    if (!existsSync(filePath)) return { updatedAt: 0, reviewedIds: [] };
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf-8'));
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { updatedAt: 0, reviewedIds: [] };
      }
      const ids = Array.isArray(parsed.reviewedIds)
        ? parsed.reviewedIds.filter((x) => typeof x === 'string')
        : [];
      return {
        updatedAt: Number.isFinite(Number(parsed.updatedAt)) ? Number(parsed.updatedAt) : 0,
        reviewedIds: ids.slice(0, MAX_NOTEBOOK_REVIEWED),
      };
    } catch {
      return { updatedAt: 0, reviewedIds: [] };
    }
  }

  function ensureDir() {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  /** @param {string} userId */
  function getReviewedIds(userId) {
    return readNotebook(getFilePath(userId)).reviewedIds;
  }

  /**
   * Replaces the full reviewed-id list (validated + deduped).
   * Returns the sanitized list that was stored.
   * @param {string} userId
   * @param {unknown} ids
   */
  function setReviewedIds(userId, ids) {
    const reviewedIds = sanitizeNotebookIds(ids);
    ensureDir();
    writeJsonFileAtomic(getFilePath(userId), { updatedAt: Date.now(), reviewedIds });
    return reviewedIds;
  }

  function deleteNotebook(userId) {
    const filePath = getFilePath(userId);
    if (!existsSync(filePath)) return false;
    unlinkSync(filePath);
    return true;
  }

  return { getReviewedIds, setReviewedIds, deleteNotebook };
}

/** Default instance using the production data directory. */
export const notebookStore = createNotebookStore();
