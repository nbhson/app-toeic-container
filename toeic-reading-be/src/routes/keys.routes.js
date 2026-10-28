import { Router } from 'express';
import { setKey, listKeys } from '../db/key-store.js';

const router = Router();

// Chỉ những key này được dùng bởi app (toeic.routes.js đọc `omniroute`).
// Trước đây PUT nhận name BẤT KỲ → key object tùy ý được inject vào keys.json.
const ALLOWED_KEY_NAMES = new Set(['omniroute']);

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
    res.status(500).json({ error: 'Internal server error.' });
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
    if (!ALLOWED_KEY_NAMES.has(name)) {
      return res.status(400).json({ error: `name must be one of: ${[...ALLOWED_KEY_NAMES].join(', ')}.` });
    }
    if (value !== undefined && typeof value !== 'string') {
      return res.status(400).json({ error: 'value must be a string.' });
    }

    setKey(name, value || '');
    res.json({ success: true, name, hasValue: !!(value && value.trim()) });
  } catch (error) {
    console.error('Error setting key:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

/**
 * DELETE /api/toeic/keys/:name
 * Removes a stored API key.
 */
router.delete('/:name', (req, res) => {
  try {
    const { name } = req.params;
    if (!ALLOWED_KEY_NAMES.has(name)) {
      return res.status(400).json({ error: `name must be one of: ${[...ALLOWED_KEY_NAMES].join(', ')}.` });
    }
    setKey(name, '');
    res.json({ success: true, name, hasValue: false });
  } catch (error) {
    console.error('Error deleting key:', error.message);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;