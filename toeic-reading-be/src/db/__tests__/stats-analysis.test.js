import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createStatsStore, analyzeStats, MAX_HISTORY_SIZE } from '../stats-store.js';

describe('stats history cap', () => {
  let tempDir;
  let store;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'stats-cap-test-'));
    store = createStatsStore(tempDir);
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it(`trims history to MAX_HISTORY_SIZE (${MAX_HISTORY_SIZE}) on save`, () => {
    const history = Array.from({ length: MAX_HISTORY_SIZE + 50 }, (_, i) => ({
      questionId: `q${i}`,
      questionText: `Q${i}`,
      selectedAnswer: 0,
      correctAnswer: 0,
      isCorrect: true,
      timestamp: i,
    }));
    store.saveStats('u1', { totalAnswered: history.length, totalCorrect: 1, totalIncorrect: 0, categoryStats: {}, history });
    const saved = store.getStats('u1');
    expect(saved.history).toHaveLength(MAX_HISTORY_SIZE);
    // Oldest-first trim: keeps the most recent entries
    expect(saved.history[0].questionId).toBe('q50');
  });

  it('keeps small histories untouched', () => {
    const history = [{ questionId: 'q1', isCorrect: true, timestamp: 1 }];
    store.saveStats('u1', { totalAnswered: 1, totalCorrect: 1, totalIncorrect: 0, categoryStats: {}, history });
    expect(store.getStats('u1').history).toEqual(history);
  });
});

describe('analyzeStats', () => {
  it('returns empty analysis for null stats', () => {
    const a = analyzeStats(null);
    expect(a.overall).toEqual({ answered: 0, correct: 0, accuracy: 0 });
    expect(a.weakest).toEqual([]);
    expect(a.recentWrong).toEqual([]);
  });

  it('computes per-category accuracy and weakest list', () => {
    const a = analyzeStats({
      totalAnswered: 10,
      totalCorrect: 5,
      totalIncorrect: 5,
      categoryStats: {
        Grammar: { answered: 5, correct: 1 },
        Vocabulary: { answered: 5, correct: 4 },
        'Word Forms': { answered: 1, correct: 0 },
      },
      history: [],
    });
    expect(a.overall).toMatchObject({ answered: 11, correct: 5 });
    // Word Forms has <3 answered -> excluded from weakest
    expect(a.weakest.map((w) => w.category)).toEqual(['Grammar', 'Vocabulary']);
    const grammar = a.byCategory.find((c) => c.category === 'Grammar');
    expect(grammar.accuracy).toBe(20);
  });

  it('returns up to 10 recent wrong answers, newest first', () => {
    const history = Array.from({ length: 12 }, (_, i) => ({
      questionId: `q${i}`,
      isCorrect: i % 2 === 0,
      timestamp: i,
    }));
    const a = analyzeStats({ categoryStats: {}, history });
    expect(a.recentWrong).toHaveLength(6);
    expect(a.recentWrong[0].questionId).toBe('q11');
  });
});
