import { Router } from 'express';
import { scoreReading, scoreAnswers, READING_TEST_CONFIG } from '../utils/score-table.js';
import { testHistoryStore, MAX_TEST_HISTORY, ValidationError } from '../db/test-history-store.js';

const router = Router();

/**
 * Shared :userId validation for the history endpoints below.
 */
function validateUserIdParam(req, res, next) {
  const { userId } = req.params;
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return res.status(400).json({ error: 'userId is required and must be a string.' });
  }
  next();
}
router.param('userId', validateUserIdParam);

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
      // Each item must be a well-formed { selectedAnswer, correctAnswer } pair;
      // scoring on malformed input would silently produce garbage results.
      for (let i = 0; i < answers.length; i++) {
        const a = answers[i];
        if (
          !a ||
          typeof a !== 'object' ||
          Array.isArray(a) ||
          !Number.isInteger(a.selectedAnswer) ||
          !Number.isInteger(a.correctAnswer)
        ) {
          return res.status(400).json({
            error: `answers[${i}] must be an object with integer selectedAnswer and correctAnswer.`,
          });
        }
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

/**
 * GET /api/toeic/reading-test/history/:userId
 * Server-side history of completed full tests (newest last), used to draw
 * the score trend in the UI. Capped at MAX_TEST_HISTORY (default 100).
 */
router.get('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    res.json({ userId, results: testHistoryStore.getResults(userId), maxEntries: MAX_TEST_HISTORY });
  } catch (error) {
    console.error('Error reading test history:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * POST /api/toeic/reading-test/history/:userId
 * Records a completed test result.
 * Body: { takenAt: number, score: number, correct: number, total: number,
 *         percent?: number, level?: string, partScores?: {...} }
 */
router.post('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const results = testHistoryStore.addResult(userId, req.body ?? {});
    res.json({ success: true, userId, results });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: `Invalid history entry: ${error.message}` });
    }
    console.error('Error saving test history:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * DELETE /api/toeic/reading-test/history/:userId
 * Clears the stored test history for a user.
 */
router.delete('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const deleted = testHistoryStore.deleteHistory(userId);
    res.json({ success: true, userId, deleted });
  } catch (error) {
    console.error('Error deleting test history:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
