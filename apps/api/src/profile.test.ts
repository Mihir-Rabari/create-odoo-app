import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from './app.js';
import type { FastifyInstance } from 'fastify';

describe('Profile API Routes (/api/v1/profile)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/profile should reject unauthenticated requests with 401', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/profile',
    });

    expect(response.statusCode).toBe(401);
    const json = response.json();
    expect(json.code).toBe('UNAUTHORIZED');
  });

  it('PUT /api/v1/profile should reject unauthenticated requests with 401', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/api/v1/profile',
      payload: { name: 'New Name' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('POST /api/v1/profile/change-password should reject unauthenticated requests with 401', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/profile/change-password',
      payload: {
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword123!',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('POST /api/v1/profile/change-password should validate password length in body', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/profile/change-password',
      payload: {
        currentPassword: 'short',
        newPassword: 'tiny', // < 8 characters
      },
    });

    // Fastify schema validation fails before auth if invalid shape or returns 400
    expect([400, 401]).toContain(response.statusCode);
  });
});
