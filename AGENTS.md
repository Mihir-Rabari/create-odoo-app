# AGENTS.md — Repository Operating Manual

> **Scope**: Operating instructions, architectural rules, testing doctrine, and package conventions for automated coding agents and software engineers contributing to this repository or using the `create-odoo-app` generator.

---

## 1. Monorepo Architecture & Package Boundaries

This repository is a **pnpm workspaces monorepo** and generator for production-ready full-stack applications. Strict layering and boundary enforcement prevent architectural degradation:

```text
               ┌───────────────────────┐
               │    apps/web (Next)    │
               └───────────┬───────────┘
                           │ (HTTP / JSON / Cookies)
                           ▼
               ┌───────────────────────┐
               │   apps/api (Fastify)  │
               └───────────┬───────────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌───────────────┐
│ packages/auth│   │ packages/iam │   │packages/config│
└──────┬───────┘   └──────┬───────┘   └───────────────┘
       │                   │                   ▲
       ▼                   ▼                   │
┌──────────────┐   ┌──────────────┐            │
│ packages/db  │   │packages/shared           │
└──────┬───────┘   └──────┬───────┘            │
       │                   │                   │
       ▼                   ▼                   │
┌──────────────┐   ┌───────┴──────┐            │
│  PostgreSQL  │   │ Redis / S3   │            │
└──────────────┘   └──────────────┘            │
                           │                   │
                           ▼                   │
                   ┌───────────────────────────┴───┐
                   │     packages/validation       │
                   └───────────────────────────────┘
```

### Package Responsibilities

1. **`apps/web` (Frontend)**:
   - Next.js App Router application.
   - Responsible for rendering user interfaces, client components, and server components.
   - **Must never** import `@packages/db` or connect directly to PostgreSQL, Redis, or MinIO/S3.
   - Interacts with backend via `@/lib/api-client` (with `credentials: 'include'`), AuthContext, and TanStack Query hooks.

2. **`apps/api` (Backend Gateway)**:
   - Fastify application with Zod type-provider and structured error handling.
   - Exposes REST endpoints, OpenAPI docs (`/api/docs`), and Prometheus metrics (`/metrics`).
   - Owns authentication, authorization route guards (`requireAuthentication`, `requirePermission`), rate limiting, and business services.

3. **`packages/auth` (Authentication & Sessions)**:
   - Password hashing with `scrypt` and timing-safe comparison (`crypto.timingSafeEqual`).
   - Server-side session management (`SessionManager`) with SHA-256 token hashing in PostgreSQL and Redis caching.
   - Session cookie helpers (`getSessionCookieOptions`).
   - Authentication error classes (`InvalidCredentialsError`, `SessionExpiredError`, `AccountSuspendedError`, `AccountDisabledError`).

4. **`packages/iam` (Identity & Access Management)**:
   - Permission catalog registry (`PermissionCatalog`, `registerPermissions`).
   - Centralized policy evaluation engine (`PolicyEngine.evaluate`) enforcing **Explicit Deny Precedence**, **ROOT superuser authority**, wildcard matching, and resource ownership (`:self`).
   - Database IAM service (`IamService`) for Users, Roles, Groups, Policies, PolicyStatements, and Effective Permissions calculation.
   - Fastify route pre-handlers (`requireAuthentication`, `requirePermission`, `requireAnyPermission`).

5. **`packages/config` (Developer Configuration Surface)**:
   - `app-config.ts`: Application constants, metadata, branding, and pagination defaults.
   - `auth-config.ts`: Authentication settings (registration toggle, session TTL, cookie name).
   - `iam-config.ts`: Declarative domain roles, groups, default policies, and baseline role-policy assignments.
   - `feature-config.ts`: Feature toggles (email, realtime, storage, observability).
   - `env.ts`: Runtime environment parser validated with Zod (`getEnv()`).

6. **`packages/validation`**:
   - Reusable runtime validation schemas (auth, IAM, pagination, UUID, IDs, query strings).
   - Standardized HTTP error response schemas (`HttpErrorResponseSchema`).

7. **`packages/shared`**:
   - Decoupled client abstractions for Redis (`ioredis`) and Object Storage (`@aws-sdk/client-s3`).
   - Shared TypeScript types, API response formats, and health probe models.

8. **`packages/db`**:
   - Drizzle ORM schema definitions (`system.ts`, `auth.ts`, `iam.ts`), PostgreSQL connection pooling, migrations, and seeds.
   - Provides typed query access and database health checks.

9. **`packages/openapi`**:
   - OpenAPI 3.0 specification metadata, tag taxonomy, and schema utilities.

---

## 2. Inviolable Security & Architectural Rules

1. **Rule 1**: Frontend must never access PostgreSQL, Redis, or MinIO credentials directly.
2. **Rule 2**: Backend owns security-sensitive operations, data persistence, and authorization.
3. **Rule 3**: Packages in `packages/*` must not depend on `apps/*`.
4. **Rule 4**: Infrastructure configuration (ports, hosts, credentials) must be read from `packages/config` / `.env`, never hardcoded.
5. **Rule 5**: No circular dependencies between workspace packages.
6. **Rule 6**: Prefer small composable abstractions over giant catch-all utilities.
7. **Rule 7**: Do not duplicate environment parsing logic; always import `getEnv()` from `@packages/config`.
8. **Rule 8**: Validate all external inputs at API boundaries using Zod schemas.
9. **Rule 9**: Do not couple application logic to MinIO-specific endpoints; use the `StorageService` abstraction.
10. **Rule 10 (Authorization)**:
    - `ROOT` identity has unconditional administrative authority.
    - Explicit `DENY` statements strictly override `ALLOW` statements.
    - Self-resource permissions (`:self`) strictly enforce that `context.resourceOwnerId === identity.id`.
    - Suspended and disabled accounts are denied all authenticated operations.

---

## 3. Agent-Enforced Testing Doctrine & Quality Rules

All automated coding agents and software engineers must strictly adhere to these testing laws:

1. **Rule T1 (Verification Requirement)**: Every new behavior must have automated tests proving its correctness.
2. **Rule T2 (Regression Defense)**: Every bug fix must include a permanent regression test capturing the discovered failure condition.
3. **Rule T3 (Security Adversarial Testing)**: Security-sensitive changes require explicit adversarial negative tests (privilege escalation, unauthorized access, expired sessions, mismatched resource ownership).
4. **Rule T4 (API Contracts)**: Every API route must be tested with Fastify `app.inject()` verifying validation (400), authentication (401), authorization (403), and success shapes.
5. **Rule T5 (Database Integrity)**: Database schema modifications require migration verification and seed idempotency tests.
6. **Rule T6 (Generator Smoke Coverage)**: Generator changes must pass full distributable smoke testing (`pnpm test:smoke`, `pnpm verify:release`).
7. **Rule T7 (Quality Gates)**: Do not reduce coverage thresholds or delete tests to make a build pass.
8. **Rule T8 (Pre-Completion Verification)**: Always run the full verification gate (`pnpm verify`) before declaring any task complete.

---

## 4. Standard Development & Quality Verification Commands

All commands should be executed from the repository root:

```bash
# Development
pnpm dev              # Launch web and api concurrently
pnpm dev:api          # Launch Fastify API in watch mode
pnpm dev:web          # Launch Next.js web application

# Quality Verification & Testing
pnpm test             # Run Vitest test suite across all packages
pnpm test:coverage    # Run Vitest test suite with v8 coverage analysis
pnpm test:smoke       # Run generator smoke test in temporary directory
pnpm test:security    # Run dedicated security & adversarial test suites
pnpm typecheck        # Run TypeScript type check across all packages + CLI
pnpm lint             # Run linting across all packages
pnpm build            # Build all packages, apps, and CLI executable
pnpm verify           # Complete local quality gate (lint + typecheck + test + smoke + build)
pnpm verify:release   # Pre-release gate (build + pack + unpacked tarball generator test)

# Database & Migrations
pnpm setup            # Cross-platform idempotent setup and database seeding
pnpm db:migrate       # Apply pending Drizzle PostgreSQL migrations
pnpm db:seed          # Execute deterministic seed runner (bootstraps ROOT & baseline IAM)
pnpm db:studio        # Open Drizzle database GUI

# Infrastructure (Docker Compose)
pnpm infra:up         # Start PostgreSQL, Redis, MinIO, Prometheus, Grafana
pnpm infra:down       # Stop all infrastructure containers
pnpm infra:reset      # Destroy containers and remove persistent volumes
pnpm health           # Run end-to-end infrastructure health check
```

---

## 5. Skills Taxonomy (`skills/*`)

The repository includes 13 structured reference skills with embedded domain testing expectations:

| Skill | Path | Description |
| :--- | :--- | :--- |
| **Architecture** | [`skills/architecture/SKILL.md`](skills/architecture/SKILL.md) | Package boundaries and layering rules |
| **Authentication** | [`skills/authentication/SKILL.md`](skills/authentication/SKILL.md) | Password hashing, sessions, cookie security |
| **Authorization** | [`skills/authorization/SKILL.md`](skills/authorization/SKILL.md) | Policy evaluation engine and route guards |
| **Database** | [`skills/database/SKILL.md`](skills/database/SKILL.md) | Drizzle schemas, migrations, deterministic seeds |
| **API** | [`skills/api/SKILL.md`](skills/api/SKILL.md) | Fastify route conventions and error handling |
| **Frontend** | [`skills/frontend/SKILL.md`](skills/frontend/SKILL.md) | Next.js App Router, TanStack Query, AuthContext |
| **Security** | [`skills/security/SKILL.md`](skills/security/SKILL.md) | Zero-trust input rules and server-side authorization |
| **Validation** | [`skills/validation/SKILL.md`](skills/validation/SKILL.md) | Universal runtime validation and business bounds |
| **Testing** | [`skills/testing/SKILL.md`](skills/testing/SKILL.md) | Central testing doctrine, pyramid, AAA pattern |
| **Storage** | [`skills/storage/SKILL.md`](skills/storage/SKILL.md) | S3/MinIO StorageService abstractions |
| **Email** | [`skills/email/SKILL.md`](skills/email/SKILL.md) | Transactional email provider integration |
| **Realtime** | [`skills/realtime/SKILL.md`](skills/realtime/SKILL.md) | Redis Pub/Sub notification events |
| **Observability** | [`skills/observability/SKILL.md`](skills/observability/SKILL.md) | Prometheus metrics, Grafana, health probes |
