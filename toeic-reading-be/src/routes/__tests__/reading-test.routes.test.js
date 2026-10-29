import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import readingTestRoutes from '../reading-test.routes.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/toeic/reading-test', readingTestRoutes);
  return app;
}

describe('reading-test.routes', () => {
  let app;
  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /config', () => {
    it('returns the official test structure (100 questions / 75 minutes)', async () => {
      const res = await request(app).get('/api/toeic/reading-test/config');
      expect(res.status).toBe(200);
      expect(res.body.totalQuestions).toBe(100);
      expect(res.body.timeLimitMinutes).toBe(75);
      expect(res.body.parts).toHaveLength(3);
    });
  });

  describe('POST /score with { correct, total }', () => {
    it('scores raw counts (80/100 → 400, Upper-Intermediate)', async () => {
      const res = await request(app).post('/api/toeic/reading-test/score').send({ correct: 80, total: 100 });
      expect(res.status).toBe(200);
      expect(res.body.correct).toBe(80);
      expect(res.body.score).toBe(400);
      expect(res.body.level).toBe('Upper-Intermediate (355-400)');
    });

    it('scores a perfect test at the 495 cap', async () => {
      const res = await request(app).post('/api/toeic/reading-test/score').send({ correct: 100, total: 100 });
      expect(res.status).toBe(200);
      expect(res.body.score).toBe(495);
      expect(res.body.correct).toBe(100);
    });

    it('returns 400 when correct is missing', async () => {
      const res = await request(app).post('/api/toeic/reading-test/score').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /score with answers array', () => {
    it('scores a valid answers array', async () => {
      const res = await request(app)
        .post('/api/toeic/reading-test/score')
        .send({ answers: [{ selectedAnswer: 1, correctAnswer: 1 }, { selectedAnswer: 2, correctAnswer: 1 }] });
      expect(res.status).toBe(200);
      expect(res.body.correct).toBe(1);
      expect(res.body.total).toBe(2);
    });

    it('returns 400 for empty answers array', async () => {
      const res = await request(app).post('/api/toeic/reading-test/score').send({ answers: [] });
      expect(res.status).toBe(400);
    });

    it('returns 400 when an item is not an object', async () => {
      const res = await request(app)
        .post('/api/toeic/reading-test/score')
        .send({ answers: [{ selectedAnswer: 1, correctAnswer: 1 }, 'nope'] });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('answers[1]');
    });

    it('returns 400 when selectedAnswer is not an integer', async () => {
      const res = await request(app)
        .post('/api/toeic/reading-test/score')
        .send({ answers: [{ selectedAnswer: '1', correctAnswer: 1 }] });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('integer');
    });

    it('returns 400 when correctAnswer is missing', async () => {
      const res = await request(app)
        .post('/api/toeic/reading-test/score')
        .send({ answers: [{ selectedAnswer: 1 }] });
      expect(res.status).toBe(400);
    });
  });

  describe('history endpoints', () => {
    const USER = 'user-hist-route-test';
    const validResult = {
      takenAt: 1730000000000,
      score: 350,
      correct: 70,
      total: 100,
      percent: 70,
      level: 'Intermediate',
    };

    beforeEach(async () => {
      // The routes use the default (repo data dir) store — start each test clean.
      await request(app).delete(`/api/toeic/reading-test/history/${USER}`);
    });

    it('POST records a result and GET returns it', async () => {
      const post = await request(app)
        .post(`/api/toeic/reading-test/history/${USER}`)
        .send(validResult);
      expect(post.status).toBe(200);
      expect(post.body.success).toBe(true);
      expect(post.body.results).toHaveLength(1);

      const get = await request(app).get(`/api/toeic/reading-test/history/${USER}`);
      expect(get.status).toBe(200);
      expect(get.body.results).toHaveLength(1);
      expect(get.body.results[0].score).toBe(350);
    });

    it('POST returns 400 for malformed entries', async () => {
      const res = await request(app)
        .post(`/api/toeic/reading-test/history/${USER}`)
        .send({ takenAt: 1, score: 100, correct: 10, total: 5 });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid history entry');
    });

    it('POST returns 400 for non-object body', async () => {
      const res = await request(app).post(`/api/toeic/reading-test/history/${USER}`).send('nope');
      expect(res.status).toBe(400);
    });

    it('DELETE clears history', async () => {
      await request(app)
        .post(`/api/toeic/reading-test/history/${USER}`)
        .send({ takenAt: 1, score: 100, correct: 10, total: 100 });
      const del = await request(app).delete(`/api/toeic/reading-test/history/${USER}`);
      expect(del.status).toBe(200);
      const get = await request(app).get(`/api/toeic/reading-test/history/${USER}`);
      expect(get.body.results).toEqual([]);
    });
  });
});
