import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      // Silence the API's request logger by default. Every `app.inject()` otherwise
      // writes raw pino JSON to stdout, burying the reporter's output and making a real
      // failure hard to find. Set LOG_LEVEL on the command line to get it back:
      //   LOG_LEVEL=debug pnpm test
      // (`.env` also sets LOG_LEVEL, which is why this cannot be keyed off its absence.)
      LOG_LEVEL: process.env.LOG_LEVEL ?? 'silent',
    },
    include: ['**/*.test.ts', '**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/scripts/**',
        '**/infrastructure/**',
        'apps/web/**',
      ],
      // Without thresholds, `test:coverage` reported numbers that nothing acted on and
      // the CI step could never fail.
      //
      // The global floor is set to what holds with no infrastructure running, which is
      // the CI quality-gate's situation and a contributor's default. Database-backed
      // paths (most of iam-service) push the real figure higher when Postgres is up;
      // pinning to that number would make the suite fail depending on whether Docker
      // happened to be running.
      thresholds: {
        statements: 58,
        branches: 75,
        functions: 55,
        lines: 58,

        // Tighter floors on the security-critical pure logic. These modules decide who
        // may do what, contain no I/O, and so have no excuse for gaps.
        'packages/iam/src/policy/**': {
          statements: 95,
          branches: 90,
          functions: 95,
          lines: 95,
        },
        'packages/shared/src/crypto/**': {
          statements: 85,
          branches: 85,
          functions: 95,
          lines: 85,
        },
      },
    },
  },
});
