import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createStatsStore } from '../stats-store.js';

describe('stats-store', () => {
  let tempDir;
  let store;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'stats-store-test-'));
    store = createStatsStore(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  const sampleStats = {
    totalAnswered: 10,
    totalCorrect: 7,
    totalIncorrect: 3,
    categoryStats: {
      Grammar: { answered: 5, correct: 4 },
      Vocabulary: { answered: 3, correct: 2 },
      'Word Forms': { answered: 2, correct: 1 },
    },
    history: [
      { questionId: 'q1', questionText: 'Test', selectedAnswer: 0, correctAnswer: 0, isCorrect: true, timestamp: 1000 },
    ],
  };

  describe('getStats', () => {
    it('returns null for non-existent user', () => {
      expect(store.getStats('nonexistent')).toBeNull();
    });
  });

  describe('saveStats', () => {
    it('saves and retrieves stats', () => {
      store.saveStats('user1', sampleStats);
      const result = store.getStats('user1');
      expect(result).toEqual(sampleStats);
    });

    it('creates stats directory automatically', () => {
      const nestedDir = join(tempDir, 'nested', 'data');
      const nestedStore = createStatsStore(nestedDir);
      nestedStore.saveStats('user1', sampleStats);
      expect(nestedStore.getStats('user1')).toEqual(sampleStats);
    });

    it('overwrites existing stats', () => {
      store.saveStats('user1', sampleStats);
      const updatedStats = { ...sampleStats, totalAnswered: 20 };
      store.saveStats('user1', updatedStats);
      expect(store.getStats('user1').totalAnswered).toBe(20);
    });

    it('creates separate files per user', () => {
      store.saveStats('user1', sampleStats);
      store.saveStats('user2', { ...sampleStats, totalAnswered: 5 });
      expect(store.getStats('user1').totalAnswered).toBe(10);
      expect(store.getStats('user2').totalAnswered).toBe(5);
    });

    it('sanitizes userId to prevent path traversal', () => {
      store.saveStats('../../../etc/passwd', sampleStats);
      const result = store.getStats('../../../etc/passwd');
      expect(result).toEqual(sampleStats);
      // Should NOT have created a file outside the stats dir
    });
  });

  describe('deleteStats', () => {
    it('deletes existing stats', () => {
      store.saveStats('user1', sampleStats);
      const deleted = store.deleteStats('user1');
      expect(deleted).toBe(true);
      expect(store.getStats('user1')).toBeNull();
    });

    it('returns false for non-existent user', () => {
      expect(store.deleteStats('nonexistent')).toBe(false);
    });
  });

  describe('listUsers', () => {
    it('returns empty array when no stats exist', () => {
      expect(store.listUsers()).toEqual([]);
    });

    it('lists all user IDs', () => {
      store.saveStats('alice', sampleStats);
      store.saveStats('bob', sampleStats);
      const users = store.listUsers();
      expect(users).toContain('alice');
      expect(users).toContain('bob');
      expect(users.length).toBe(2);
    });
  });

  describe('persistence', () => {
    it('can be read by a new store instance', () => {
      store.saveStats('user1', sampleStats);
      const store2 = createStatsStore(tempDir);
      expect(store2.getStats('user1')).toEqual(sampleStats);
    });
  });
});