import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createTestHistoryStore,
  sanitizeTestHistoryEntry,
  ValidationError,
} from '../test-history-store.js';

const validEntry = {
  takenAt: 1730000000000,
  score: 350,
  correct: 70,
  total: 100,
  percent: 70,
  level: 'Intermediate',
  partScores: { part5: { correct: 20, total: 30 } },
};

describe('sanitizeTestHistoryEntry', () => {
  it('accepts a valid entry and keeps partScores', () => {
    expect(sanitizeTestHistoryEntry(validEntry)).toEqual(validEntry);
  });

  it('rejects non-object payloads', () => {
    expect(() => sanitizeTestHistoryEntry(null)).toThrow(ValidationError);
    expect(() => sanitizeTestHistoryEntry('x')).toThrow(ValidationError);
    expect(() => sanitizeTestHistoryEntry([])).toThrow(ValidationError);
  });

  it('rejects non-numeric takenAt', () => {
    expect(() => sanitizeTestHistoryEntry({ ...validEntry, takenAt: 'x' })).toThrow(ValidationError);
  });

  it('rejects correct > total and non-integer counts', () => {
    expect(() => sanitizeTestHistoryEntry({ ...validEntry, correct: 5, total: 4 })).toThrow(ValidationError);
    expect(() => sanitizeTestHistoryEntry({ ...validEntry, correct: 1.5 })).toThrow(ValidationError);
    expect(() => sanitizeTestHistoryEntry({ ...validEntry, total: 0 })).toThrow(ValidationError);
  });

  it('rejects negative scores', () => {
    expect(() => sanitizeTestHistoryEntry({ ...validEntry, score: -5 })).toThrow(ValidationError);
  });

  it('rejects malformed partScores', () => {
    expect(() => sanitizeTestHistoryEntry({ ...validEntry, partScores: { part5: 'x' } })).toThrow(ValidationError);
    expect(() => sanitizeTestHistoryEntry({ ...validEntry, partScores: [] })).toThrow(ValidationError);
  });

  it('clamps score into the 5..495 range', () => {
    expect(sanitizeTestHistoryEntry({ ...validEntry, score: 9999 }).score).toBe(495);
    expect(sanitizeTestHistoryEntry({ ...validEntry, score: 0 }).score).toBe(5);
  });

  it('computes percent when missing', () => {
    const out = sanitizeTestHistoryEntry({ takenAt: 1, score: 100, correct: 50, total: 100 });
    expect(out.percent).toBe(50);
  });
});

describe('test-history store', () => {
  let tempDir;
  let store;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'test-history-'));
    store = createTestHistoryStore(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('starts empty for a new user', () => {
    expect(store.getResults('user1')).toEqual([]);
  });

  it('stores and returns results', () => {
    store.addResult('user1', validEntry);
    const results = store.getResults('user1');
    expect(results).toHaveLength(1);
    expect(results[0].score).toBe(350);
  });

  it('trims to the cap, oldest first', () => {
    for (let i = 0; i < 105; i++) {
      store.addResult('user1', { ...validEntry, takenAt: i, correct: i % 100, score: 100 + i });
    }
    const results = store.getResults('user1');
    expect(results.length).toBeLessThanOrEqual(100);
    expect(results[results.length - 1].takenAt).toBe(104);
  });

  it('isolates users', () => {
    store.addResult('user1', validEntry);
    expect(store.getResults('user2')).toEqual([]);
  });

  it('sanitizes userId against path traversal', () => {
    store.addResult('../../etc/passwd', validEntry);
    const dir = join(tempDir, 'test-history');
    expect(existsSync(dir)).toBe(true);
    const files = readdirSync(dir);
    expect(files.length).toBe(1);
    files.forEach((f) => expect(f).toMatch(/^[a-zA-Z0-9_-]+\.json$/));
  });

  it('deletes history and reports deletion status', () => {
    store.addResult('user1', validEntry);
    expect(store.deleteHistory('user1')).toBe(true);
    expect(store.deleteHistory('user1')).toBe(false);
    expect(store.getResults('user1')).toEqual([]);
  });
});
