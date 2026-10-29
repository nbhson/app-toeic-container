/**
 * File-based question bank: every AI-generated item that passes validation is
 * archived here, so repeat practice sessions can be served from the bank
 * (fast + free + stable quality) instead of always calling the AI.
 * Storage: data/bank/{part}.json — each file is a capped array (default 500).
 * Reads NEVER create directories (safe to call in tests and request paths).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJsonFileAtomic } from './atomic-write.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_DATA_DIR = join(__dirname, '../../data');
const BANK_DIRNAME = 'bank';

export const BANK_PARTS = ['part5', 'part6', 'part7-Single', 'part7-Double', 'part7-Triple'];
export const DEFAULT_BANK_CAP = parseInt(process.env.BANK_MAX_ITEMS || '500', 10) || 500;

function bankFile(dataDir, part) {
  return join(dataDir, BANK_DIRNAME, `${part}.json`);
}

function readItems(file) {
  try {
    if (!existsSync(file)) return [];
    const raw = readFileSync(file, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Dedupe key: question text for Part 5, passage text for Part 6/7. */
function itemKey(part, item) {
  if (part === 'part5') return (item?.question || '').trim().toLowerCase();
  return (item?.text || '').trim().toLowerCase().slice(0, 400);
}

export function createBankStore(dataDir = DEFAULT_DATA_DIR, cap = DEFAULT_BANK_CAP) {
  const dir = join(dataDir, BANK_DIRNAME);

  function ensureDir() {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }

  function assertPart(part) {
    if (!BANK_PARTS.includes(part)) {
      throw new Error(`Unknown bank part "${part}". Expected one of: ${BANK_PARTS.join(', ')}`);
    }
  }

  /**
   * Appends items to the bank, skipping duplicates. Returns added count.
   * @param {string} part - One of BANK_PARTS.
   * @param {Array} items
   */
  function addItems(part, items) {
    assertPart(part);
    if (!Array.isArray(items) || items.length === 0) return 0;
    ensureDir();
    const file = bankFile(dataDir, part);
    const existing = readItems(file);
    const known = new Set(existing.map((it) => itemKey(part, it)));
    let added = 0;
    for (const item of items) {
      const key = itemKey(part, item);
      if (!key || known.has(key)) continue;
      known.add(key);
      existing.push(item);
      added += 1;
    }
    // Cap: keep the most recent items so the file never grows unbounded.
    const trimmed = existing.length > cap ? existing.slice(existing.length - cap) : existing;
    writeJsonFileAtomic(file, trimmed);
    return added;
  }

  /**
   * Returns up to n random items from the bank (no replacement).
   * @param {string} part
   * @param {number} n
   */
  function sample(part, n) {
    assertPart(part);
    const items = readItems(bankFile(dataDir, part));
    if (items.length === 0 || n <= 0) return [];
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
  }

  function count(part) {
    assertPart(part);
    return readItems(bankFile(dataDir, part)).length;
  }

  function summary() {
    const out = {};
    for (const part of BANK_PARTS) {
      try {
        out[part] = readItems(bankFile(dataDir, part)).length;
      } catch {
        out[part] = 0;
      }
    }
    return out;
  }

  function clear(part) {
    assertPart(part);
    const file = bankFile(dataDir, part);
    if (!existsSync(file)) return 0;
    const n = readItems(file).length;
    writeJsonFileAtomic(file, []);
    return n;
  }

  return { addItems, sample, count, summary, clear, BANK_PARTS };
}

export const bankStore = createBankStore();
