import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  createNotebookStore,
  sanitizeNotebookIds,
  NotebookValidationError,
  MAX_NOTEBOOK_REVIEWED,
} from '../notebook-store.js';

describe('sanitizeNotebookIds', () => {
  it('accepts an array of id strings and preserves order', () => {
    expect(sanitizeNotebookIds(['q1', 'q2'])).toEqual(['q1', 'q2']);
  });

  it('deduplicates ids while keeping the first occurrence position', () => {
    expect(sanitizeNotebookIds(['b', 'a', 'b', 'c'])).toEqual(['b', 'a', 'c']);
  });

  it('rejects non-array payloads', () => {
    expect(() => sanitizeNotebookIds(null)).toThrow(NotebookValidationError);
    expect(() => sanitizeNotebookIds('q1')).toThrow(NotebookValidationError);
    expect(() => sanitizeNotebookIds({ 0: 'q1' })).toThrow(NotebookValidationError);
  });

  it('rejects non-string and empty items', () => {
    expect(() => sanitizeNotebookIds(['q1', 5])).toThrow(NotebookValidationError);
    expect(() => sanitizeNotebookIds(['q1', ''])).toThrow(NotebookValidationError);
    expect(() => sanitizeNotebookIds([null])).toThrow(NotebookValidationError);
  });

  it('rejects arrays over the cap', () => {
    const tooMany = Array.from({ length: MAX_NOTEBOOK_REVIEWED + 1 }, (_, i) => `q${i}`);
    expect(() => sanitizeNotebookIds(tooMany)).toThrow(/must not exceed/);
  });

  it('rejects ids over the length cap', () => {
    expect(() => sanitizeNotebookIds(['x'.repeat(201)])).toThrow(NotebookValidationError);
  });
});

describe('notebook store', () => {
  let tempDir;
  let store;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'notebook-'));
    store = createNotebookStore(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('starts empty for a new user and never creates directories on read', () => {
    expect(store.getReviewedIds('nobody')).toEqual([]);
    expect(existsSync(join(tempDir, 'notebook'))).toBe(false);
  });

  it('stores and returns reviewed ids', () => {
    const stored = store.setReviewedIds('user1', ['q1', 'q2']);
    expect(stored).toEqual(['q1', 'q2']);
    expect(store.getReviewedIds('user1')).toEqual(['q1', 'q2']);
  });

  it('replaces the whole list on each write', () => {
    store.setReviewedIds('user1', ['q1', 'q2']);
    store.setReviewedIds('user1', ['q2', 'q3']);
    expect(store.getReviewedIds('user1')).toEqual(['q2', 'q3']);
  });

  it('keeps users isolated (one file per user)', () => {
    store.setReviewedIds('user1', ['q1']);
    store.setReviewedIds('user2', ['q2']);
    expect(store.getReviewedIds('user1')).toEqual(['q1']);
    expect(store.getReviewedIds('user2')).toEqual(['q2']);
    expect(readdirSync(join(tempDir, 'notebook'))).toEqual(['user1.json', 'user2.json']);
  });

  it('sanitizes userId to prevent path traversal', () => {
    store.setReviewedIds('../../etc/passwd', ['q1']);
    // The traversal attempt must not escape the notebook dir.
    expect(readdirSync(join(tempDir, 'notebook'))).toEqual(['______etc_passwd.json']);
    expect(existsSync(join(tempDir, 'etc', 'passwd'))).toBe(false);
    expect(store.getReviewedIds('../../etc/passwd')).toEqual(['q1']);
  });

  it('tolerates a corrupted file (returns empty list)', () => {
    store.setReviewedIds('user1', ['q1']);
    const file = join(tempDir, 'notebook', 'user1.json');
    writeFileSync(file, '{ not valid json');
    expect(store.getReviewedIds('user1')).toEqual([]);
    // And a subsequent write recovers the store.
    store.setReviewedIds('user1', ['q2']);
    expect(store.getReviewedIds('user1')).toEqual(['q2']);
  });

  it('deleteNotebook removes the file and reports misses', () => {
    store.setReviewedIds('user1', ['q1']);
    expect(store.deleteNotebook('user1')).toBe(true);
    expect(store.getReviewedIds('user1')).toEqual([]);
    expect(store.deleteNotebook('user1')).toBe(false);
  });
});
