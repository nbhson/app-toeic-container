/**
 * Startup-time security checks. Kept in a pure function (env in, error out)
 * so they are unit-testable without booting the server.
 */

/**
 * Refuses to boot in production when /api/toeic/keys would be left open.
 * The keys routes can read (masked) and WRITE provider API keys, so an
 * unprotected instance must never face the public internet.
 * Dev (NODE_ENV unset/other) keeps the current warn-free open behavior.
 *
 * @param {object} env - environment-like object (defaults to process.env)
 * @throws {Error} when NODE_ENV=production and ADMIN_API_KEY is missing/empty
 */
export function assertProductionSecurity(env = process.env) {
  const isProduction = (env.NODE_ENV || '').trim() === 'production';
  if (!isProduction) return;
  const adminKey = (env.ADMIN_API_KEY || '').trim();
  if (!adminKey) {
    throw new Error(
      'FATAL: ADMIN_API_KEY is not set but NODE_ENV=production. ' +
        'The /api/toeic/keys routes can read and write provider API keys ' +
        'and refuse to run unprotected in production. ' +
        'Set ADMIN_API_KEY in the environment (.env) to a strong secret.',
    );
  }
}
