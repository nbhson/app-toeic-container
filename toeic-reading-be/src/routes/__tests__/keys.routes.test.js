import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock the key-store module to avoid file system side effects
const mockKeys = {};
const mockListKeys = vi.fn(() => {
  const result = {};
  for (const [name, value] of Object.entries(mockKeys)) {
    result[name] = {
      hasValue: !!value,
      masked: value ? `${value.substring(0, 4)}${'*'.repeat(Math.max(0, value.length - 4))}` : '',
    };
  }
  return result;
});

vi.mock('../../db/key-store.js', () => ({
  getKey: vi.fn((name) => mockKeys[name] || null),
  setKey: vi.fn((name, value) => {
    if (!value || !value.trim()) {
      delete mockKeys[name];
    } else {
      mockKeys[name] = value.trim();
    }
  }),
  listKeys: mockListKeys,
}));

// Import after mock setup
const keysRoutes = (await import('../keys.routes.js')).default;

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/toeic/keys', keysRoutes);
  return app;
}

describe('keys.routes', () => {
  let app;

  beforeEach(() => {
    // Clear all mock keys
    for (const key of Object.keys(mockKeys)) {
      delete mockKeys[key];
    }
    app = createTestApp();
  });

  describe('GET /api/toeic/keys', () => {
    it('returns empty keys when none are stored', async () => {
      const res = await request(app).get('/api/toeic/keys');
      expect(res.status).toBe(200);
      expect(res.body.keys).toEqual({});
    });

    it('returns stored keys with masked values', async () => {
      mockKeys['omniroute'] = 'sk-secret-key-123';
      const res = await request(app).get('/api/toeic/keys');
      expect(res.status).toBe(200);
      expect(res.body.keys.omniroute).toEqual({
        hasValue: true,
        masked: 'sk-s*************',
      });
    });
  });

  describe('PUT /api/toeic/keys', () => {
    it('stores a new key', async () => {
      const res = await request(app)
        .put('/api/toeic/keys')
        .send({ name: 'omniroute', value: 'new-api-key' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.name).toBe('omniroute');
      expect(res.body.hasValue).toBe(true);
      expect(mockKeys['omniroute']).toBe('new-api-key');
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .put('/api/toeic/keys')
        .send({ value: 'some-key' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('name is required');
    });

    it('returns 400 when name is not a string', async () => {
      const res = await request(app)
        .put('/api/toeic/keys')
        .send({ name: 123, value: 'some-key' });
      expect(res.status).toBe(400);
    });

    it('removes key when value is empty', async () => {
      mockKeys['omniroute'] = 'existing-key';
      const res = await request(app)
        .put('/api/toeic/keys')
        .send({ name: 'omniroute', value: '' });
      expect(res.status).toBe(200);
      expect(res.body.hasValue).toBe(false);
      expect(mockKeys['omniroute']).toBeUndefined();
    });
  });

  describe('DELETE /api/toeic/keys/:name', () => {
    it('removes a stored key', async () => {
      mockKeys['omniroute'] = 'key-to-delete';
      const res = await request(app).delete('/api/toeic/keys/omniroute');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.name).toBe('omniroute');
      expect(res.body.hasValue).toBe(false);
    });

    it('succeeds even if key does not exist', async () => {
      const res = await request(app).delete('/api/toeic/keys/nonexistent');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});