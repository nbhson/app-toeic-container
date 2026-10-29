import { describe, it, expect } from 'vitest';
import { sanitizeStats } from '../stats-store.js';

const validStats = {
  totalAnswered: 10,
  totalCorrect: 7,
  totalIncorrect: 3,
  categoryStats: {
    Grammar: { answered: 5, correct: 4 },
  },
  history: [
    {
      questionId: 'q1',
      questionText: 'Test',
      selectedAnswer: 0,
      correctAnswer: 1,
      isCorrect: false,
      timestamp: 1234,
    },
  ],
};

describe('sanitizeStats', () => {
  it('accepts a valid payload and returns a clean copy', () => {
    const out = sanitizeStats(validStats);
    expect(out).toEqual(validStats);
  });

  it('defaults totals and collections when omitted', () => {
    const out = sanitizeStats({});
    expect(out).toEqual({ totalAnswered: 0, totalCorrect: 0, totalIncorrect: 0, categoryStats: {}, history: [] });
  });

  it('rejects non-object payloads', () => {
    expect(() => sanitizeStats(null)).toThrow();
    expect(() => sanitizeStats('x')).toThrow();
    expect(() => sanitizeStats([1])).toThrow();
  });

  it('rejects negative totals', () => {
    expect(() => sanitizeStats({ ...validStats, totalAnswered: -1 })).toThrow(/totalAnswered/);
  });

  it('rejects NaN/string/float totals', () => {
    expect(() => sanitizeStats({ totalAnswered: '5' })).toThrow(/totalAnswered/);
    expect(() => sanitizeStats({ totalAnswered: Number.NaN })).toThrow(/totalAnswered/);
    expect(() => sanitizeStats({ totalCorrect: 1.5 })).toThrow(/totalCorrect/);
  });

  it('rejects malformed category entries', () => {
    expect(() =>
      sanitizeStats({ categoryStats: { Grammar: { answered: -1, correct: 0 } } }),
    ).toThrow(/Grammar/);
    expect(() => sanitizeStats({ categoryStats: { Grammar: 'nope' } })).toThrow(/Grammar/);
    expect(() => sanitizeStats({ categoryStats: { Grammar: { answered: 1 } } })).toThrow(/correct/);
  });

  it('rejects malformed history entries', () => {
    expect(() =>
      sanitizeStats({ history: [{ questionId: 'q1', questionText: 'x', isCorrect: true, timestamp: 1 }] }),
    ).toThrow(/history\[0\]/);
    expect(() => sanitizeStats({ history: [{ questionId: 'q1', questionText: 'x', selectedAnswer: 0, correctAnswer: 0, isCorrect: 'yes', timestamp: 1 }] }))
      .toThrow(/isCorrect/);
    expect(() => sanitizeStats({ history: ['nope'] })).toThrow(/history\[0\]/);
  });

  it('rejects oversized history and category maps', () => {
    const bigHistory = Array.from({ length: 201 }, (_, i) => ({ ...validStats.history[0], questionId: `q${i}` }));
    expect(() => sanitizeStats({ history: [...validStats.history, ...bigHistory] })).toThrow(/history/);
    expect(() => sanitizeStats({ categoryStats: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [`C${i}`, { answered: 0, correct: 0 }])) })).toThrow(/100/);
  });

  it('strips unknown extra fields from history entries', () => {
    const out = sanitizeStats({
      ...validStats,
      history: [{ ...validStats.history[0], evil: 'payload' }],
    });
    expect(out.history[0]).not.toHaveProperty('evil');
    expect(out.history[0]).toEqual(validStats.history[0]);
  });
});
