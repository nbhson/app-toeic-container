import { Router } from 'express';
import { bankStore, BANK_PARTS } from '../db/bank-store.js';

const router = Router();

/**
 * GET /api/toeic/bank
 * Returns item counts per part.
 */
router.get('/', (_req, res) => {
  try {
    res.json({ parts: BANK_PARTS, counts: bankStore.summary() });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * GET /api/toeic/bank/:part?limit=10
 * Returns up to `limit` random items from the bank (offline practice, no AI call).
 */
router.get('/:part', (req, res) => {
  try {
    const { part } = req.params;
    if (!BANK_PARTS.includes(part)) {
      return res.status(400).json({ error: `part must be one of: ${BANK_PARTS.join(', ')}` });
    }
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, rawLimit)) : 10;
    const items = bankStore.sample(part, limit);
    res.json({ part, requested: limit, returned: items.length, fromCache: items.length, items });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * DELETE /api/toeic/bank/:part
 * Clears cached items for a part.
 */
router.delete('/:part', (req, res) => {
  try {
    const { part } = req.params;
    if (!BANK_PARTS.includes(part)) {
      return res.status(400).json({ error: `part must be one of: ${BANK_PARTS.join(', ')}` });
    }
    const removed = bankStore.clear(part);
    res.json({ success: true, part, removed });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

export default router;
