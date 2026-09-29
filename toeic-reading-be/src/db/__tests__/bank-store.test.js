import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createBankStore, BANK_PARTS } from '../bank-store.js';

describe('bank-store', () => {
  let tempDir;
  let bank;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'bank-store-test-'));
    bank = createBankStore(tempDir, 10);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('reads return empty (no dir creation) when bank is missing', () => {
    expect(bank.summary()).toEqual(
      Object.fromEntries(BANK_PARTS.map((p) => [p, 0])),
    );
    expect(bank.sample('part5', 5)).toEqual([]);
  });

  it('adds items and counts them', () => {
    const added = bank.addItems('part5', [
      { id: 'q1', question: 'Hello _______ world' },
      { id: 'q2', question: 'Foo _______ bar' },
    ]);
    expect(added).toBe(2);
    expect(bank.count('part5')).toBe(2);
  });

  it('skips duplicates by question text', () => {
    bank.addItems('part5', [{ id: 'q1', question: 'Same _______ text' }]);
    const added = bank.addItems('part5', [{ id: 'q2', question: 'Same _______ text' }]);
    expect(added).toBe(0);
    expect(bank.count('part5')).toBe(1);
  });

  it('caps stored items at the configured max', () => {
    const items = Array.from({ length: 15 }, (_, i) => ({ id: `q${i}`, question: `Text _______ ${i}` }));
    bank.addItems('part5', items);
    expect(bank.count('part5')).toBe(10);
  });

  it('samples without replacement up to n', () => {
    bank.addItems('part5', Array.from({ length: 5 }, (_, i) => ({ id: `q${i}`, question: `Text _______ ${i}` })));
    const s = bank.sample('part5', 3);
    expect(s).toHaveLength(3);
    expect(new Set(s.map((x) => x.id)).size).toBe(3);
  });

  it('clears a part and reports removed count', () => {
    bank.addItems('part6', [{ id: 'p1', text: 'Some _______ [131] passage' }]);
    expect(bank.clear('part6')).toBe(1);
    expect(bank.count('part6')).toBe(0);
  });

  it('rejects unknown parts', () => {
    expect(() => bank.sample('part9', 1)).toThrow(/Unknown bank part/);
  });
});
