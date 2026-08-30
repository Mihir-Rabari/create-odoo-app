import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import {
  SignupRequestSchema,
  LoginRequestSchema,
  SessionResponseSchema,
  HttpErrorResponseSchema,
} from '@packages/validation';
import { users, policies, userPolicies } from '@packages/db';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword, getSessionCookieOptions } from '@packages/auth';
import { requireAuthentication } from '@packages/iam';
import { z } from 'zod';

export const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const env = fastify.env;
  const isProd = env.NODE_ENV === 'production';
  const cookieOptions = getSessionCookieOptions(
    isProd,
    env.SESSION_TTL_SECONDS,
    env.SESSION_COOKIE_NAME
  );

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/signup - Public Visitor Registration
  // ---------------------------------------------------------------------------
  fastify.post(
    '/auth/signup',
    {
      schema: {
        description: 'Register a new external user account',
        tags: ['Authentication'],
        body: SignupRequestSchema,
        response: {
          201: SessionResponseSchema,
          400: HttpErrorResponseSchema,
          409: HttpErrorResponseSchema,
          500: HttpErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email: rawEmail, password, name } = request.body;
      const email = rawEmail.toLowerCase().trim();

      // 1. Check if user with email already exists
      const [existingUser] = await fastify.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'An account with this email address already exists',
          code: 'USER_ALREADY_EXISTS',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
      }

      // 2. Hash password
      const passwordHash = await hashPassword(password);

      // 3. Create EXTERNAL_USER (client cannot spoof role or identityType)
      const [newUser] = await fastify.db
        .insert(users)
        .values({
          email,
          name: name.trim(),
          passwordHash,
          status: 'ACTIVE',
          identityType: 'EXTERNAL_USER',
        })
        .returning();

      // 4. Attach baseline ExternalUserPolicy to new user
      const defaultPolicyName = fastify.appConfig.iam.defaultExternalUserPolicy;
      const [externalPolicy] = await fastify.db
        .select({ id: policies.id })
        .from(policies)
        .where(eq(policies.name, defaultPolicyName))
        .limit(1);

      if (externalPolicy) {
        await fastify.db
          .insert(userPolicies)
          .values({
            userId: newUser.id,
            policyId: externalPolicy.id,
          })
          .onConflictDoNothing();
      }

      // 5. Create server-side session
      const { sessionToken, session, user } = await fastify.sessionManager.createSession({
        userId: newUser.id,
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
        ttlSeconds: env.SESSION_TTL_SECONDS,
      });

      // 6. Set HTTP-only session cookie
      reply.setCookie(cookieOptions.name, sessionToken, {
        path: cookieOptions.path,
        maxAge: cookieOptions.maxAge,
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
      });

      // 7. Log audit events
      await fastify.iamService.logAuditEvent({
        action: 'USER_CREATED',
        actor: newUser.id,
        target: newUser.id,
        details: { email: newUser.email, identityType: newUser.identityType },
      });

      await fastify.iamService.logAuditEvent({
        action: 'LOGIN_SUCCESS',
        actor: newUser.id,
        target: newUser.id,
        details: { method: 'signup', ip: request.ip },
      });

      // 8. Calculate effective permissions
      const effectivePerms = await fastify.iamService.getEffectivePermissions(newUser.id);

      return reply.status(201).send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status,
          identityType: user.identityType,
          lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt.toISOString(),
          createdAt: session.createdAt.toISOString(),
        },
        effectivePermissions: effectivePerms.effectivePermissions,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/login - Credential Verification & Session Creation
  // ---------------------------------------------------------------------------
  fastify.post(
    '/auth/login',
    {
      schema: {
        description: 'Authenticate with email and password to create an active session',
        tags: ['Authentication'],
        body: LoginRequestSchema,
        response: {
          200: SessionResponseSchema,
          400: HttpErrorResponseSchema,
          401: HttpErrorResponseSchema,
          403: HttpErrorResponseSchema,
          500: HttpErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { email: rawEmail, password } = request.body;
      const email = rawEmail.toLowerCase().trim();

      // 1. Fetch user by email
      const [userRecord] = await fastify.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!userRecord) {
        await fastify.iamService.logAuditEvent({
          action: 'LOGIN_FAILURE',
          actor: 'anonymous',
          details: { email, reason: 'User not found', ip: request.ip },
          status: 'failure',
        });

        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
      }

      // 2. Check account status
      if (userRecord.status === 'SUSPENDED') {
        await fastify.iamService.logAuditEvent({
          action: 'LOGIN_FAILURE',
          actor: userRecord.id,
          details: { email, reason: 'Account suspended', ip: request.ip },
          status: 'failure',
        });

        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'Your account has been temporarily suspended. Please contact support.',
          code: 'ACCOUNT_SUSPENDED',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
      }

      if (userRecord.status === 'DISABLED') {
        await fastify.iamService.logAuditEvent({
          action: 'LOGIN_FAILURE',
          actor: userRecord.id,
          details: { email, reason: 'Account disabled', ip: request.ip },
          status: 'failure',
        });

        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'This account has been disabled.',
          code: 'ACCOUNT_DISABLED',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
      }

      // 3. Verify password hash
      const isValidPassword = await verifyPassword(password, userRecord.passwordHash);
      if (!isValidPassword) {
        await fastify.iamService.logAuditEvent({
          action: 'LOGIN_FAILURE',
          actor: userRecord.id,
          details: { email, reason: 'Password mismatch', ip: request.ip },
          status: 'failure',
        });

        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          requestId: request.id,
          timestamp: new Date().toISOString(),
        });
      }

      // 4. Create Session
      const { sessionToken, session, user } = await fastify.sessionManager.createSession({
        userId: userRecord.id,
        userAgent: request.headers['user-agent'],
        ipAddress: request.ip,
        ttlSeconds: env.SESSION_TTL_SECONDS,
      });

      // 5. Set session cookie
      reply.setCookie(cookieOptions.name, sessionToken, {
        path: cookieOptions.path,
        maxAge: cookieOptions.maxAge,
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
      });

      // 6. Log audit event
      await fastify.iamService.logAuditEvent({
        action: 'LOGIN_SUCCESS',
        actor: user.id,
        target: user.id,
        details: { email: user.email, identityType: user.identityType, ip: request.ip },
      });

      // 7. Calculate effective permissions
      const effectivePerms = await fastify.iamService.getEffectivePermissions(user.id);

      return reply.status(200).send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status,
          identityType: user.identityType,
          lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt.toISOString(),
          createdAt: session.createdAt.toISOString(),
        },
        effectivePermissions: effectivePerms.effectivePermissions,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/v1/auth/logout - Session Revocation
  // ---------------------------------------------------------------------------
  fastify.post(
    '/auth/logout',
    {
      schema: {
        description: 'Revoke active session and clear authentication cookie',
        tags: ['Authentication'],
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const sessionToken = request.cookies[cookieOptions.name];

      if (sessionToken) {
        await fastify.sessionManager.revokeSession(sessionToken);

        if (request.user) {
          await fastify.iamService.logAuditEvent({
            action: 'LOGOUT',
            actor: request.user.id,
            target: request.user.id,
          });
        }
      }

      // Clear cookie
      reply.clearCookie(cookieOptions.name, {
        path: cookieOptions.path,
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
      });

      return reply.status(200).send({
        success: true,
        message: 'Logged out successfully',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/v1/auth/session - Current Session & Identity Verification
  // ---------------------------------------------------------------------------
  fastify.get(
    '/auth/session',
    {
      preHandler: [requireAuthentication()],
      schema: {
        description: 'Get current authenticated identity, session metadata, and effective permissions',
        tags: ['Authentication'],
        response: {
          200: SessionResponseSchema,
          401: HttpErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const user = request.user!;
      const session = request.session!;

      const effectivePerms = await fastify.iamService.getEffectivePermissions(user.id);

      return reply.status(200).send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          status: user.status,
          identityType: user.identityType,
          lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString(),
        },
        session: {
          id: session.id,
          expiresAt: session.expiresAt.toISOString(),
          createdAt: session.createdAt.toISOString(),
        },
        effectivePermissions: effectivePerms.effectivePermissions,
      });
    }
  );
};
