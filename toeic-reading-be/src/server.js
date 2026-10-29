import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createHmac, timingSafeEqual } from 'node:crypto';
import toeicRoutes from './routes/toeic.routes.js';
import keysRoutes from './routes/keys.routes.js';
import statsRoutes from './routes/stats.routes.js';
import bankRoutes from './routes/bank.routes.js';
import readingTestRoutes from './routes/reading-test.routes.js';
import notebookRoutes from './routes/notebook.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Behind the container's nginx proxy: honor X-Forwarded-For so req.ip (used by
// the rate limiter) is the real client address instead of the proxy IP.
app.set('trust proxy', 1);

// CORS: restrict to known frontends. Set FRONTEND_ORIGIN="*" to allow all
// (local dev default) or a comma-separated allowlist in production, e.g.
// FRONTEND_ORIGIN="https://toeic.example.com".
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || '*').trim();
app.use(
  FRONTEND_ORIGIN === '*'
    ? cors()
    : cors({
        origin: FRONTEND_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
        credentials: false,
      }),
);
// Bound JSON body size (generation payloads are small; stats PUTs stay tiny
// because history is capped server-side at MAX_HISTORY_SIZE).
app.use(express.json({ limit: '1mb' }));

// Minimal hardening headers (no extra dependency).
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

// API key protection for key-management routes (/api/toeic/keys).
// Set ADMIN_API_KEY env to require `X-API-Key: <ADMIN_API_KEY>` on these
// routes. Unset = open (local dev only) — /keys can read masked values and
// WRITE provider keys, so it must be protected in any shared deployment.
function requireAdminKey(req, res, next) {
  const expected = (process.env.ADMIN_API_KEY || '').trim();
  if (!expected) return next(); // auth disabled in local dev
  const presented = (req.headers['x-api-key'] || '').toString().trim();
  // Constant-time compare (HMAC wrapper cho khác độ dài) — tránh timing leak.
  const mac = (s) => createHmac('sha256', 'admin-key').update(s).digest();
  if (!presented || !timingSafeEqual(mac(presented), mac(expected))) {
    return res.status(401).json({ error: 'Unauthorized: missing or invalid X-API-Key.' });
  }
  next();
}

// Routes
// NOTE: never log or echo req.body.apiKey — API keys must not leak into logs.
app.use('/api/toeic/bank', bankRoutes);
app.use('/api/toeic/reading-test', readingTestRoutes);
app.use('/api/toeic', toeicRoutes);
app.use('/api/toeic/keys', requireAdminKey, keysRoutes);
app.use('/api/toeic/notebook', notebookRoutes);
app.use('/api/toeic/stats', statsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 catch-all (route lạ trước đây rơi vào default handler HTML).
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found.' });
});

// JSON error handler cuối cùng: body-parse lỗi → 400; còn lại generic 500
// (chi tiết lỗi chỉ vào log, KHÔNG trả client).
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err?.type === 'entity.parse.failed' || err?.status === 400) {
    return res.status(400).json({ error: 'Invalid request body.' });
  }
  console.error('Unhandled error:', err instanceof Error ? err.stack : err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`TOEIC Reading BE server is running on http://localhost:${PORT}`);
});