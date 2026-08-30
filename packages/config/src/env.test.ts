import { describe, it, expect } from 'vitest';
import { envSchema, getEnv, resetEnvCache } from './env.js';

describe('Environment Configuration (@packages/config)', () => {
  it('should validate default environment values', () => {
    const valid = envSchema.parse({
      NODE_ENV: 'development',
      PORT: '3001',
    });

    expect(valid.PORT).toBe(3001);
    expect(valid.APP_NAME).toBe('production-starter');
    expect(valid.DATABASE_URL).toBe('postgres://postgres:postgres@localhost:5432/app_db');
    expect(valid.REDIS_URL).toBe('redis://localhost:6379');
  });

  it('should coerce boolean and number values correctly', () => {
    const valid = envSchema.parse({
      PORT: '8080',
      DATABASE_PORT: '5433',
      DATABASE_SSL: 'true',
      S3_USE_SSL: 'false',
    });

    expect(valid.PORT).toBe(8080);
    expect(valid.DATABASE_PORT).toBe(5433);
    expect(valid.DATABASE_SSL).toBe(true);
    expect(valid.S3_USE_SSL).toBe(false);
  });

  it('should throw descriptive validation errors on invalid environment variables', () => {
    expect(() => {
      resetEnvCache();
      getEnv({
        NODE_ENV: 'invalid_environment',
        PORT: 'not-a-number',
        DATABASE_PORT: '-10',
      });
    }).toThrow('[Config] Environment validation failed');
  });
});
