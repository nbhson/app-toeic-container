import { Router } from 'express';
import { scoreReading, scoreAnswers, READING_TEST_CONFIG } from '../utils/score-table.js';

const router = Router();

/**
 * GET /api/toeic/reading-test/config
 * Official structure of a full Reading test: 100 questions, 75 minutes.
 */
router.get('/config', (_req, res) => {
  res.json({ ...READING_TEST_CONFIG });
});

/**
 * POST /api/toeic/reading-test/score
 * Estimates a TOEIC Reading score (5-495, documented approximation).
 * Body (either form):
 *   { correct: number, total?: number }  — raw counts
 *   { answers: Array<{ selectedAnswer: number, correctAnswer: number }> }
 */
router.post('/score', (req, res) => {
  try {
    const { correct, total, answers } = req.body ?? {};
    let result;
    if (Array.isArray(answers)) {
      if (answers.length === 0 || answers.length > 200) {
        return res.status(400).json({ error: 'answers must be a non-empty array (max 200 items).' });
      }
      result = scoreAnswers(answers);
    } else {
      if (correct === undefined || !Number.isFinite(Number(correct))) {
        return res.status(400).json({ error: 'Provide either { correct, total? } or { answers: [...] }.' });
      }
      result = scoreReading(Number(correct), total === undefined ? 100 : Number(total));
    }
    res.json({ ...result, scale: 'TOEIC Reading 5-495 (approximation, varies per official form)' });
  } catch (error) {
    console.error('Error scoring reading test:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
