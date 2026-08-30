---
name: testing-patterns
description: Vitest test suite guidelines, unit testing, and Fastify injection testing
---

# Testing Patterns Skill

## 1. Test Organization
- Colocate unit and integration tests with code: `*.test.ts` or `*.spec.ts`.
- Run tests via `pnpm test`.
- Use Vitest (`describe`, `it`, `expect`, `beforeAll`, `afterAll`).

## 2. Fastify Route Testing
- Test routes using `app.inject()` without binding to live network ports:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from './app.js';
import type { FastifyInstance } from 'fastify';

describe('Route Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/resource should return 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/resource',
    });
    expect(res.statusCode).toBe(200);
  });
});
```
