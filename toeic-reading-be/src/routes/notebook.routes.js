import { Router } from 'express';
import {
  notebookStore,
  MAX_NOTEBOOK_REVIEWED,
  NotebookValidationError,
} from '../db/notebook-store.js';

const router = Router();

/**
 * Shared :userId validation for the notebook endpoints below.
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
 * GET /api/toeic/notebook/:userId
 * Server-side list of wrong-answer notebook question ids marked "đã ôn".
 * The UI merges this with its localStorage cache (localStorage stays the
 * optimistic cache / offline fallback).
 */
router.get('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    res.json({
      userId,
      reviewedIds: notebookStore.getReviewedIds(userId),
      maxIds: MAX_NOTEBOOK_REVIEWED,
    });
  } catch (error) {
    console.error('Error reading notebook:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * PUT /api/toeic/notebook/:userId
 * Replaces the full reviewed-id list for a user.
 * Body: { reviewedIds: string[] }
 */
router.put('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const { reviewedIds } = req.body ?? {};
    const stored = notebookStore.setReviewedIds(userId, reviewedIds);
    res.json({ success: true, userId, reviewedIds: stored });
  } catch (error) {
    if (error instanceof NotebookValidationError) {
      return res.status(400).json({ error: `Invalid notebook payload: ${error.message}` });
    }
    console.error('Error saving notebook:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * DELETE /api/toeic/notebook/:userId
 * Clears the stored notebook reviewed flags for a user (local flags stay).
 */
router.delete('/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const deleted = notebookStore.deleteNotebook(userId);
    res.json({ success: true, userId, deleted });
  } catch (error) {
    console.error('Error deleting notebook:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
