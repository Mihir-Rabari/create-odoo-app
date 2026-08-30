import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from './app.js';
import type { FastifyInstance } from 'fastify';

describe('IAM & Profile Permission Route Guards (/api/v1/iam, /api/v1/profile)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Unauthenticated Access Control (401)', () => {
    it('GET /api/v1/iam/users should reject unauthenticated requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/iam/users',
      });

      expect(response.statusCode).toBe(401);
      const json = response.json();
      expect(json.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/iam/roles should reject unauthenticated requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/iam/roles',
      });

      expect(response.statusCode).toBe(401);
      const json = response.json();
      expect(json.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/iam/groups should reject unauthenticated requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/iam/groups',
      });

      expect(response.statusCode).toBe(401);
      const json = response.json();
      expect(json.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/iam/policies should reject unauthenticated requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/iam/policies',
      });

      expect(response.statusCode).toBe(401);
      const json = response.json();
      expect(json.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/iam/permissions should reject unauthenticated requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/iam/permissions',
      });

      expect(response.statusCode).toBe(401);
      const json = response.json();
      expect(json.code).toBe('UNAUTHORIZED');
    });

    it('GET /api/v1/profile should reject unauthenticated requests', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/profile',
      });

      expect(response.statusCode).toBe(401);
      const json = response.json();
      expect(json.code).toBe('UNAUTHORIZED');
    });
  });
});
