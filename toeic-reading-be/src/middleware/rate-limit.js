/**
 * Minimal in-memory fixed-window rate limiter (no external dependency).
 * Protects the AI-generation endpoints from quota burn / generation farms.
 *
 * A fixed window per client IP is sufficient for this single-container app.
 * Behind nginx, `app.set('trust proxy', ...)` + the forwarded
 * X-Forwarded-For header make `req.ip` the real client address.
 *
 * Configuration (env vars):
 *   RATE_LIMIT_WINDOW_MS - window length in ms (default 60000 = 1 minute)
 *   RATE_LIMIT_MAX       - max requests per window      (default 20)
 */

const DEFAULT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10) || 60000;
const DEFAULT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '20', 10) || 20;

// ip -> { count, resetAt }
const hits = new Map();

/** Best-effort client IP (nginx sets X-Forwarded-For; see server.js trust proxy). */
export function clientIp(req) {
  const forwarded = (req.headers['x-forwarded-for'] || '').toString().split(',')[0].trim();
  return req.ip || forwarded || req.socket?.remoteAddress || 'unknown';
}

/** Drops expired entries; called when the map grows to bound memory. */
function pruneExpired(now) {
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
}

/**
 * Creates a rate-limit middleware instance.
 * @param {{ windowMs?: number, max?: number }} options
 */
export function createRateLimiter({ windowMs = DEFAULT_WINDOW_MS, max = DEFAULT_MAX } = {}) {
  return function rateLimit(req, res, next) {
    const key = clientIp(req);
    const now = Date.now();
    if (hits.size > 1000) pruneExpired(now);

    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;

    if (entry.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      console.warn(`[rate-limit] 429 for ${key} (${entry.count} requests in window)`);
      return res.status(429).json({
        error: `Too many requests. Limit is ${max} per ${Math.round(windowMs / 1000)}s — please retry later.`,
      });
    }
    next();
  };
}

/**
 * Limiter for AI-generation POST endpoints (part5/part6/part7/batch).
 * Reading/scoring endpoints stay unlimited: they are cheap and local.
 */
export const generationRateLimit = createRateLimiter();

export function resetRateLimiter() {
  hits.clear();
}

export const RATE_LIMIT_DEFAULT_MAX = DEFAULT_MAX;
