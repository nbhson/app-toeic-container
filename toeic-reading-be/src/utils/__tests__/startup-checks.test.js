import { describe, it, expect } from 'vitest';
import { assertProductionSecurity } from '../startup-checks.js';

describe('assertProductionSecurity', () => {
  it('does not throw in development (NODE_ENV unset)', () => {
    expect(() => assertProductionSecurity({})).not.toThrow();
  });

  it('does not throw in development (NODE_ENV=development) without ADMIN_API_KEY', () => {
    expect(() => assertProductionSecurity({ NODE_ENV: 'development' })).not.toThrow();
  });

  it('does not throw in production when ADMIN_API_KEY is set', () => {
    expect(() =>
      assertProductionSecurity({ NODE_ENV: 'production', ADMIN_API_KEY: 'secret' }),
    ).not.toThrow();
  });

  it('throws in production when ADMIN_API_KEY is missing', () => {
    expect(() => assertProductionSecurity({ NODE_ENV: 'production' })).toThrow(/ADMIN_API_KEY/);
  });

  it('throws in production when ADMIN_API_KEY is whitespace only', () => {
    expect(() =>
      assertProductionSecurity({ NODE_ENV: 'production', ADMIN_API_KEY: '   ' }),
    ).toThrow(/ADMIN_API_KEY/);
  });
});
