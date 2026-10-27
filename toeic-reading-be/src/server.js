import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import toeicRoutes from './routes/toeic.routes.js';
import keysRoutes from './routes/keys.routes.js';
import statsRoutes from './routes/stats.routes.js';
import bankRoutes from './routes/bank.routes.js';
import readingTestRoutes from './routes/reading-test.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

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
  if (presented !== expected) {
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
app.use('/api/toeic/stats', statsRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`TOEIC Reading BE server is running on http://localhost:${PORT}`);
});