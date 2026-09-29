/**
 * TOEIC Reading score estimation (5-495 scale).
 * Real ETS conversion varies per test form; this is a documented
 * approximation so learners get a stable, explainable estimate.
 * Mapping is linear between anchor points and rounded to the nearest 5,
 * which mirrors the official 5-point increment scale.
 */

// [correctOutOf100, score]
const ANCHORS = [
  [0, 5],
  [10, 50],
  [20, 100],
  [30, 150],
  [40, 195],
  [50, 245],
  [60, 295],
  [70, 350],
  [80, 400],
  [90, 450],
  [100, 495],
];

function interpolate(equiv) {
  const clamped = Math.min(100, Math.max(0, equiv));
  for (let i = 1; i < ANCHORS.length; i++) {
    const [x1, y1] = ANCHORS[i - 1];
    const [x2, y2] = ANCHORS[i];
    if (clamped <= x2) {
      const ratio = (clamped - x1) / (x2 - x1);
      return y1 + ratio * (y2 - y1);
    }
  }
  return 495;
}

function roundTo5(n) {
  return Math.min(495, Math.max(5, Math.round(n / 5) * 5));
}

/**
 * Estimates a TOEIC Reading score from a raw correct count.
 * @param {number} correct - Number of correct answers.
 * @param {number} [total=100] - Total questions (scaled to /100 when different).
 * @returns {{ correct: number, total: number, percent: number, score: number, level: string }}
 */
export function scoreReading(correct, total = 100) {
  const safeTotal = Number.isFinite(total) && total > 0 ? Math.floor(total) : 100;
  const safeCorrect = Number.isFinite(correct)
    ? Math.min(safeTotal, Math.max(0, Math.floor(correct)))
    : 0;
  const percent = safeTotal === 0 ? 0 : Math.round((safeCorrect / safeTotal) * 1000) / 10;
  const equiv = (safeCorrect / safeTotal) * 100;
  const score = roundTo5(interpolate(equiv));
  return { correct: safeCorrect, total: safeTotal, percent, score, level: levelFor(score) };
}

/**
 * Estimates a score from an answers array.
 * @param {Array<{ selectedAnswer: number, correctAnswer: number }>} answers
 */
export function scoreAnswers(answers) {
  const list = Array.isArray(answers) ? answers : [];
  const correct = list.filter((a) => a && a.selectedAnswer === a.correctAnswer).length;
  return scoreReading(correct, list.length === 0 ? 100 : list.length);
}

export function levelFor(score) {
  if (score >= 405) return 'Advanced (405-495)';
  if (score >= 355) return 'Upper-Intermediate (355-400)';
  if (score >= 250) return 'Intermediate (250-350)';
  if (score >= 110) return 'Elementary (110-245)';
  return 'Beginner (5-105)';
}

export const READING_TEST_CONFIG = Object.freeze({
  totalQuestions: 100,
  timeLimitMinutes: 75,
  parts: [
    { part: 5, count: 30, numbers: '101-130', title: 'Incomplete Sentences' },
    { part: 6, count: 16, numbers: '131-146', title: 'Text Completion (4 passages x 4)' },
    { part: 7, count: 54, numbers: '147-200', title: 'Reading Comprehension' },
  ],
});
