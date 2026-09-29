import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

vi.mock('../../db/bank-store.js', () => ({
  bankStore: {
    summary: vi.fn(),
    sample: vi.fn(),
    clear: vi.fn(),
  },
  BANK_PARTS: ['part5', 'part6', 'part7-Single', 'part7-Double', 'part7-Triple'],
}));

const { bankStore } = await import('../../db/bank-store.js');
const bankRoutes = (await import('../bank.routes.js')).default;

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/toeic/bank', bankRoutes);
  return app;
}

describe('bank.routes', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  it('GET / returns counts per part', async () => {
    bankStore.summary.mockReturnValue({ part5: 12 });
    const res = await request(app).get('/api/toeic/bank');
    expect(res.status).toBe(200);
    expect(res.body.counts).toEqual({ part5: 12 });
    expect(res.body.parts).toContain('part5');
  });

  it('GET /:part returns sampled items with limit', async () => {
    bankStore.sample.mockReturnValue([{ id: 'q1' }]);
    const res = await request(app).get('/api/toeic/bank/part5?limit=5');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([{ id: 'q1' }]);
    expect(bankStore.sample).toHaveBeenCalledWith('part5', 5);
  });

  it('GET /:part clamps limit to 1-100', async () => {
    bankStore.sample.mockReturnValue([]);
    await request(app).get('/api/toeic/bank/part5?limit=9999');
    expect(bankStore.sample).toHaveBeenCalledWith('part5', 100);
  });

  it('GET /:part returns 400 for unknown part', async () => {
    const res = await request(app).get('/api/toeic/bank/part9');
    expect(res.status).toBe(400);
  });

  it('DELETE /:part clears and reports removed count', async () => {
    bankStore.clear.mockReturnValue(7);
    const res = await request(app).delete('/api/toeic/bank/part6');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, part: 'part6', removed: 7 });
  });
});
