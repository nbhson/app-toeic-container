import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createRateLimiter, resetRateLimiter, clientIp } from '../rate-limit.js';

function createTestApp(limiter) {
  const app = express();
  // Mirror server.js: honor X-Forwarded-For so per-IP buckets work behind a proxy.
  app.set('trust proxy', true);
  app.post('/limited', limiter, (_req, res) => res.json({ ok: true }));
  return app;
}

describe('rate-limit middleware', () => {
  beforeEach(() => {
    resetRateLimiter();
  });

  it('allows requests below the limit and blocks above it', async () => {
    const app = createTestApp(createRateLimiter({ windowMs: 60000, max: 3 }));
    for (let i = 0; i < 3; i++) {
      const res = await request(app).post('/limited');
      expect(res.status).toBe(200);
    }
    const blocked = await request(app).post('/limited');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toContain('Too many requests');
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('tracks clients separately (different IPs have separate buckets)', async () => {
    const app = createTestApp(createRateLimiter({ windowMs: 60000, max: 1 }));
    const res1 = await request(app).post('/limited').set('X-Forwarded-For', '1.1.1.1');
    const res2 = await request(app).post('/limited').set('X-Forwarded-For', '2.2.2.2');
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const blocked = await request(app).post('/limited').set('X-Forwarded-For', '2.2.2.2');
    expect(blocked.status).toBe(429);
  });

  it('resets the window after it expires', async () => {
    const app = createTestApp(createRateLimiter({ windowMs: 20, max: 1 }));
    expect((await request(app).post('/limited')).status).toBe(200);
    expect((await request(app).post('/limited')).status).toBe(429);
    await new Promise((r) => setTimeout(r, 40));
    const res = await request(app).post('/limited');
    expect(res.status).toBe(200);
  });

  it('clientIp prefers req.ip then X-Forwarded-For then socket', () => {
    expect(clientIp({ ip: '10.0.0.1', headers: {}, socket: {} })).toBe('10.0.0.1');
    expect(clientIp({ headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }, socket: { remoteAddress: '9.9.9.9' } })).toBe('1.2.3.4');
    expect(clientIp({ headers: {}, socket: { remoteAddress: '::1' } })).toBe('::1');
    expect(clientIp({ headers: {} })).toBe('unknown');
  });
});
