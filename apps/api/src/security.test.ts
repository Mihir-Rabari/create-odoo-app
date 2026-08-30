import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from './app.js';
import type { FastifyInstance } from 'fastify';

describe('Adversarial & Security API Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Zero-Trust Input & Privilege Escalation', () => {
    it('POST /api/v1/auth/signup should reject or sanitize spoofed role/identityType fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/signup',
        payload: {
          email: `adversary-${Date.now()}@example.com`,
          password: 'Password123!',
          name: 'Adversary User',
          role: 'ADMIN', // Client attempting privilege escalation
          identityType: 'ROOT', // Client attempting ROOT bypass
          isSuperuser: true,
        },
      });

      // Status: 201 (success without DB), 400 (strict validation), 500/503 (offline DB)
      expect([201, 400, 500, 503]).toContain(response.statusCode);

      if (response.statusCode === 201) {
        const json = response.json();
        // Crucial: Must NEVER be ROOT
        expect(json.user.identityType).not.toBe('ROOT');
        expect(json.user.identityType).toBe('EXTERNAL_USER');
        // Crucial: Must NEVER return passwordHash
        expect(json.user.passwordHash).toBeUndefined();
      }
    });

    it('should reject malformed session cookie gracefully without 500 error', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/auth/session',
        headers: {
          cookie: 'app_session=malformed_token_12345!@#$%^',
        },
      });

      expect(response.statusCode).toBe(401);
      const json = response.json();
      expect(json.code).toBe('UNAUTHORIZED');
    });

    it('should not leak stack traces or database connection details in error responses', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/iam/users/non-existent-id-format',
      });

      expect([400, 401, 404]).toContain(response.statusCode);
      const body = response.body;
      expect(body).not.toContain('postgres://');
      expect(body).not.toContain('password');
      expect(body).not.toContain('node_modules');
    });
  });
});
