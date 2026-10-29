import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import notebookRoutes from '../notebook.routes.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/toeic/notebook', notebookRoutes);
  return app;
}

describe('notebook.routes', () => {
  let app;
  beforeEach(() => {
    app = createTestApp();
  });

  describe(':userId param validation', () => {
    it('rejects an empty userId', async () => {
      const res = await request(app).get('/api/toeic/notebook/%20');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('userId is required');
    });
  });

  describe('GET /:userId', () => {
    it('starts with an empty reviewedIds list', async () => {
      const res = await request(app).get('/api/toeic/notebook/user-nb-route-test');
      expect(res.status).toBe(200);
      expect(res.body.reviewedIds).toEqual([]);
      expect(res.body.maxIds).toBeGreaterThan(0);
    });
  });

  describe('PUT /:userId', () => {
    const USER = 'user-nb-route-test';

    afterEach(async () => {
      await request(app).delete(`/api/toeic/notebook/${USER}`);
    });

    it('stores the reviewed ids and GET returns them', async () => {
      const put = await request(app)
        .put(`/api/toeic/notebook/${USER}`)
        .send({ reviewedIds: ['q1', 'q2'] });
      expect(put.status).toBe(200);
      expect(put.body.success).toBe(true);
      expect(put.body.reviewedIds).toEqual(['q1', 'q2']);

      const get = await request(app).get(`/api/toeic/notebook/${USER}`);
      expect(get.status).toBe(200);
      expect(get.body.reviewedIds).toEqual(['q1', 'q2']);
    });

    it('deduplicates ids', async () => {
      const put = await request(app)
        .put(`/api/toeic/notebook/${USER}`)
        .send({ reviewedIds: ['q1', 'q1', 'q2'] });
      expect(put.body.reviewedIds).toEqual(['q1', 'q2']);
    });

    it('returns 400 when reviewedIds is missing or not an array', async () => {
      const noBody = await request(app).put(`/api/toeic/notebook/${USER}`).send({});
      expect(noBody.status).toBe(400);
      expect(noBody.body.error).toContain('reviewedIds');

      const wrong = await request(app)
        .put(`/api/toeic/notebook/${USER}`)
        .send({ reviewedIds: 'q1' });
      expect(wrong.status).toBe(400);
    });

    it('returns 400 when an item is not a non-empty string', async () => {
      const res = await request(app)
        .put(`/api/toeic/notebook/${USER}`)
        .send({ reviewedIds: ['q1', ''] });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('reviewedIds[1]');
    });

    it('returns 400 for an oversized id list', async () => {
      const tooMany = Array.from({ length: 501 }, (_, i) => `q${i}`);
      const put = await request(app).put(`/api/toeic/notebook/${USER}`).send({ reviewedIds: tooMany });
      expect(put.status).toBe(400);
    });
  });

  describe('DELETE /:userId', () => {
    it('clears the stored reviewed ids and tolerates a missing user', async () => {
      const USER = 'user-nb-del-test';
      await request(app).put(`/api/toeic/notebook/${USER}`).send({ reviewedIds: ['q1'] });
      const del = await request(app).delete(`/api/toeic/notebook/${USER}`);
      expect(del.status).toBe(200);
      expect(del.body.deleted).toBe(true);

      const again = await request(app).delete(`/api/toeic/notebook/${USER}`);
      expect(del.body.success).toBe(true);
      expect(again.body.deleted).toBe(false);
    });
  });
});
