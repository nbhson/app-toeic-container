import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';

const readingTestRoutes = (await import('../reading-test.routes.js')).default;

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/toeic/reading-test', readingTestRoutes);
  return app;
}

describe('reading-test.routes', () => {
  const app = createTestApp();

  it('GET /config exposes 100 questions / 75 minutes', async () => {
    const res = await request(app).get('/api/toeic/reading-test/config');
    expect(res.status).toBe(200);
    expect(res.body.totalQuestions).toBe(100);
    expect(res.body.timeLimitMinutes).toBe(75);
    expect(res.body.parts).toHaveLength(3);
  });

  it('POST /score scores raw counts', async () => {
    const res = await request(app)
      .post('/api/toeic/reading-test/score')
      .send({ correct: 100, total: 100 });
    expect(res.status).toBe(200);
    expect(res.body.score).toBe(495);
    expect(res.body.correct).toBe(100);
  });

  it('POST /score scores an answers array', async () => {
    const res = await request(app)
      .post('/api/toeic/reading-test/score')
      .send({ answers: [{ selectedAnswer: 0, correctAnswer: 0 }, { selectedAnswer: 1, correctAnswer: 2 }] });
    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(1);
    expect(res.body.total).toBe(2);
  });

  it('POST /score returns 400 without payload', async () => {
    const res = await request(app).post('/api/toeic/reading-test/score').send({});
    expect(res.status).toBe(400);
  });

  it('POST /score returns 400 for empty answers', async () => {
    const res = await request(app).post('/api/toeic/reading-test/score').send({ answers: [] });
    expect(res.status).toBe(400);
  });
});
