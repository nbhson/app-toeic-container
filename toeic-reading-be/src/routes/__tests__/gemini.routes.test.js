import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock the key-store module to avoid file system side effects
const mockKeys = {};
vi.mock('../../db/key-store.js', () => ({
  getKey: vi.fn((name) => mockKeys[name] || null),
  setKey: vi.fn(),
  listKeys: vi.fn(() => ({})),
}));

// Import after mock setup
const geminiRoutes = (await import('../gemini.routes.js')).default;

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/toeic/gemini', geminiRoutes);
  return app;
}

describe('gemini.routes — POST /api/toeic/gemini/generate', () => {
  let app;
  const originalEnv = { ...process.env };
  const fetchMock = vi.fn();

  beforeEach(() => {
    for (const key of Object.keys(mockKeys)) delete mockKeys[key];
    delete process.env.GEMINI_API_KEY;
    vi.stubGlobal('fetch', fetchMock);
    app = createTestApp();
  });

  afterEach(() => {
    process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY;
    if (originalEnv.GEMINI_API_KEY === undefined) delete process.env.GEMINI_API_KEY;
    vi.unstubAllGlobals();
    fetchMock.mockReset();
  });

  it('returns 400 when contents is missing', async () => {
    const res = await request(app).post('/api/toeic/gemini/generate').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('contents');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 400 when no key is configured anywhere', async () => {
    const res = await request(app)
      .post('/api/toeic/gemini/generate')
      .send({ contents: [{ parts: [{ text: 'hi' }] }] });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Gemini API key');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards to Gemini using GEMINI_API_KEY env and never echoes the key', async () => {
    process.env.GEMINI_API_KEY = 'env-secret-key';
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ candidates: [] }), { status: 200 }),
    );

    const res = await request(app)
      .post('/api/toeic/gemini/generate')
      .send({ contents: [{ parts: [{ text: 'prompt' }] }] });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ candidates: [] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('generativelanguage.googleapis.com');
    expect(url).toContain(':generateContent');
    // Key must travel via header, not the URL or the forwarded body.
    expect(url).not.toContain('env-secret-key');
    expect(init.headers['x-goog-api-key']).toBe('env-secret-key');
    expect(JSON.parse(init.body)).not.toHaveProperty('apiKey');
  });

  it('prefers the body apiKey (UI override) over env', async () => {
    process.env.GEMINI_API_KEY = 'env-secret-key';
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ candidates: [] }), { status: 200 }),
    );

    const res = await request(app)
      .post('/api/toeic/gemini/generate')
      .send({ contents: [{ parts: [{ text: 'prompt' }] }], apiKey: 'body-key' });

    expect(res.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['x-goog-api-key']).toBe('body-key');
  });

  it('uses the stored key store value when no body/env key', async () => {
    mockKeys['gemini'] = 'stored-key';
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ candidates: [] }), { status: 200 }),
    );

    const res = await request(app)
      .post('/api/toeic/gemini/generate')
      .send({ contents: [{ parts: [{ text: 'prompt' }] }] });

    expect(res.status).toBe(200);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers['x-goog-api-key']).toBe('stored-key');
  });

  it('maps upstream errors to 500 with a message', async () => {
    process.env.GEMINI_API_KEY = 'env-secret-key';
    fetchMock.mockResolvedValue(new Response('upstream down', { status: 503 }));

    const res = await request(app)
      .post('/api/toeic/gemini/generate')
      .send({ contents: [{ parts: [{ text: 'prompt' }] }] });

    expect(res.status).toBe(500);
    expect(res.body.error).toContain('503');
  });
});
