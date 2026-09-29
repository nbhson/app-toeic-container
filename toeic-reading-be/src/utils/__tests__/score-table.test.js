import { describe, it, expect } from 'vitest';
import { scoreReading, scoreAnswers, levelFor, READING_TEST_CONFIG } from '../score-table.js';

describe('score-table', () => {
  it('scores a perfect paper at 495', () => {
    expect(scoreReading(100, 100).score).toBe(495);
  });

  it('scores zero at 5', () => {
    expect(scoreReading(0, 100).score).toBe(5);
  });

  it('is monotonic increasing', () => {
    let prev = 0;
    for (let c = 0; c <= 100; c += 5) {
      const s = scoreReading(c, 100).score;
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });

  it('rounds to increments of 5 within 5-495', () => {
    for (let c = 0; c <= 100; c++) {
      const s = scoreReading(c, 100).score;
      expect(s % 5).toBe(0);
      expect(s).toBeGreaterThanOrEqual(5);
      expect(s).toBeLessThanOrEqual(495);
    }
  });

  it('scales partial totals to /100', () => {
    expect(scoreReading(15, 30).score).toBe(scoreReading(50, 100).score);
  });

  it('clamps out-of-range input', () => {
    expect(scoreReading(150, 100).correct).toBe(100);
    expect(scoreReading(-3, 100).correct).toBe(0);
  });

  it('scores an answers array', () => {
    const answers = [
      { selectedAnswer: 0, correctAnswer: 0 },
      { selectedAnswer: 1, correctAnswer: 2 },
      { selectedAnswer: 3, correctAnswer: 3 },
    ];
    const r = scoreAnswers(answers);
    expect(r.correct).toBe(2);
    expect(r.total).toBe(3);
  });

  it('maps levels across the scale', () => {
    expect(levelFor(495)).toContain('Advanced');
    expect(levelFor(300)).toContain('Intermediate');
    expect(levelFor(5)).toContain('Beginner');
  });

  it('exposes a 100-question / 75-minute test config', () => {
    expect(READING_TEST_CONFIG.totalQuestions).toBe(100);
    expect(READING_TEST_CONFIG.timeLimitMinutes).toBe(75);
    expect(READING_TEST_CONFIG.parts.reduce((n, p) => n + p.count, 0)).toBe(100);
  });
});
