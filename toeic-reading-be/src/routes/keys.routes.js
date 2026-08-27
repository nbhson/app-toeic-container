import { Router } from 'express';
import { getKey, setKey, listKeys } from '../db/key-store.js';

const router = Router();

/**
 * GET /api/toeic/keys
 * Returns the status of all stored keys (masked values for security).
 */
router.get('/', (_req, res) => {
  try {
    const keys = listKeys();
    res.json({ keys });
  } catch (error) {
    console.error('Error listing keys:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * PUT /api/toeic/keys
 * Stores or updates an API key.
 * Body: { name: string, value: string }
 */
router.put('/', (req, res) => {
  try {
    const { name, value } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required and must be a string.' });
    }

    setKey(name, value || '');
    res.json({ success: true, name, hasValue: !!(value && value.trim()) });
  } catch (error) {
    console.error('Error setting key:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

/**
 * DELETE /api/toeic/keys/:name
 * Removes a stored API key.
 */
router.delete('/:name', (req, res) => {
  try {
    const { name } = req.params;
    setKey(name, '');
    res.json({ success: true, name, hasValue: false });
  } catch (error) {
    console.error('Error deleting key:', error.message);
    res.status(500).json({ error: error.message || 'Internal server error.' });
  }
});

export default router;