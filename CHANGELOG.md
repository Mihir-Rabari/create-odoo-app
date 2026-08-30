# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-08-30

### Added
- **Project Generator (`create-odoo-app`)**:
  - Executable CLI (`npx create-odoo-app@latest <project-name>`) supporting project scaffolding, argument parsing, help (`-h`), version (`-v`), and skip flags (`--skip-install`, `--skip-git`, `--skip-infra`).
  - Deterministic project metadata and branding transformations (`package.json`, `app-config.ts`, Next.js `<title>`, navbar branding, OpenAPI title, tailored `README.md`, `AGENTS.md`).
  - Template isolation filter preventing leakage of `.git`, `node_modules`, `dist`, `.next`, `brain/`, and local credentials.
- **Identity, Authentication & IAM System**:
  - Password hashing with Node native `scrypt` and timing-safe comparison (`crypto.timingSafeEqual`).
  - Server-side session management (`SessionManager`) with SHA-256 token hashing in PostgreSQL and Redis caching.
  - HTTP-only session cookies (`SameSite=Lax`, `Path=/`, `Secure` in production).
  - IAM Policy Evaluation Engine enforcing **Explicit Deny Precedence**, **ROOT superuser authority**, wildcard pattern matching (`users:*`), and resource ownership checks (`:self`).
  - Declarative Fastify route guards (`requireAuthentication`, `requirePermission`, `requireAnyPermission`).
  - Next.js Admin IAM Control Center (`/admin`, `/admin/iam/users`, `/admin/iam/roles`, `/admin/iam/groups`, `/admin/iam/policies`, `/admin/iam/permissions`) with live Effective Permissions Calculation view.
- **Developer Configuration Surface (`packages/config`)**:
  - `app-config.ts`: Application constants, metadata, pagination limits.
  - `auth-config.ts`: Authentication settings (`registrationEnabled`, `defaultIdentity`, `sessionTtlSeconds`, `cookieName`, `minPasswordLength`).
  - `iam-config.ts`: Declarative domain roles, groups, default policies, and baseline role-policy assignments.
  - `feature-config.ts`: Optional feature toggles (`enableSwagger`, `enableMetrics`, `enableStorage`, `enableRedis`, `enableEmail`).
- **Agent-Native Skills Architecture (`skills/*`)**:
  - 13 domain reference guides (`architecture`, `authentication`, `authorization`, `database`, `api`, `frontend`, `security`, `validation`, `testing`, `storage`, `email`, `realtime`, `observability`).
- **Comprehensive Quality Gates & Testing Architecture**:
  - Multi-tier testing pyramid: unit tests, Fastify `app.inject()` integration tests, adversarial security tests, generator smoke tests, and packed tarball release verification (`pnpm verify:release`).
  - Coverage analysis with `@vitest/coverage-v8`.
  - GitHub Actions CI/CD workflows (`ci.yml` and `release.yml`).
