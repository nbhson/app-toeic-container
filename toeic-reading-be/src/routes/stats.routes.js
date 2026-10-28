import { Router } from 'express';
import { getStats, saveStats, deleteStats, analyzeStats } from '../db/stats-store.js';

const router = Router();

/**
 * GET /api/toeic/stats/:userId/analysis
 * Weak-point analysis: per-category accuracy, weakest categories (>=3 answered),
 * and 10 most recent wrong answers (for review / spaced repetition).
 * NOTE: registered before "/:userId" for clarity (Express matches single-segment
 * params only, but explicit ordering avoids surprises).
 */
router.get('/:userId/analysis', (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required and must be a string.' });
    }
    const stats = getStats(userId);
    res.json({ userId, ...analyzeStats(stats) });
  } catch (error) {
    console.error('Error analyzing stats:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * GET /api/toeic/stats/:userId
 * Returns the stats for a specific user.
 */
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required and must be a string.' });
    }

    const stats = getStats(userId);
    if (!stats) {
      // Return default stats for new users
      return res.json({
        userId,
        stats: {
          totalAnswered: 0,
          totalCorrect: 0,
          totalIncorrect: 0,
          categoryStats: {
            Grammar: { answered: 0, correct: 0 },
            Vocabulary: { answered: 0, correct: 0 },
            'Word Forms': { answered: 0, correct: 0 },
            'Sentence Insertion': { answered: 0, correct: 0 },
            'Single Passage': { answered: 0, correct: 0 },
            'Double Passage': { answered: 0, correct: 0 },
            'Triple Passage': { answered: 0, correct: 0 },
          },
          history: [],
        },
      });
    }

    res.json({ userId, stats });
  } catch (error) {
    console.error('Error getting stats:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * PUT /api/toeic/stats/:userId
 * Saves (full replacement) stats for a specific user.
 * Body: { stats: UserStats }
 */
router.put('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { stats } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required and must be a string.' });
    }

    if (!stats || typeof stats !== 'object') {
      return res.status(400).json({ error: 'stats is required and must be an object.' });
    }

    saveStats(userId, stats);
    res.json({ success: true, userId });
  } catch (error) {
    console.error('Error saving stats:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * DELETE /api/toeic/stats/:userId
 * Removes stats for a specific user.
 */
router.delete('/:userId', (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'userId is required and must be a string.' });
    }

    const deleted = deleteStats(userId);
    res.json({ success: true, userId, deleted });
  } catch (error) {
    console.error('Error deleting stats:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;