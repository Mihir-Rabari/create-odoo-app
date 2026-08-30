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
- **OpenAPI & Structured Logging Hardening (Phase 5.1)**:
  - Universal structured logger in `@packages/shared` with automatic defensive sensitive data redaction (`password`, `token`, `secret`, `apiKey`, `cookie`, `authorization`, `databaseUrl`, `SESSION_SECRET`).
  - Fastify request correlation ID propagation (`x-request-id` header sanitization and onSend response tracing).
  - Correlated error payloads (`HttpErrorResponse`) containing matching `requestId` for client diagnostics without stack trace leakage.
  - Accurate OpenAPI 3.0 `CookieAuth` security scheme (`app_session` cookie) and standard reusable error schemas.
  - Operational event logging across Auth (`auth.signup.success`, `auth.login.failure`, `auth.logout`, `auth.session.revoked`) and IAM (`iam.user.status_updated`, `iam.role.assigned`).
- **Real Agent Skills Standard & Skill Discovery Architecture (Phase 6)**:
  - Agent Skills open-standard compliant skill bundles with matching directory names and YAML frontmatter (`name`, `description`).
  - Machine-readable skill registry (`skills/index.yaml`) cataloging all 13 canonical skills.
  - Automated skill validation tooling (`scripts/check-skills.ts` / `pnpm skills:check`).
  - Localized subtree `AGENTS.md` context files (`apps/api/AGENTS.md`, `apps/web/AGENTS.md`, `packages/auth/AGENTS.md`, `packages/iam/AGENTS.md`, `packages/db/AGENTS.md`).
  - Propagation of skills registry and localized context manuals into generated projects.
- **Agent Skills Runtime Compatibility, Packaging & Discovery Hardening (Phase 6.1)**:
  - Deterministic skill bundle packer (`scripts/pack-skills.ts` / `pnpm skills:pack`) outputting clean directory bundles and standard zero-dependency ZIP archives in `dist/skills/` compatible with OpenAI Skills API and portable Agent Skills platform consumption.
  - Skill CLI utilities: `pnpm skills:list`, `pnpm skills:show <name>`, `pnpm skills:lint`, and `pnpm skills:export`.
  - Deterministic context discovery & skill packaging automated test suite (`src/skills.test.ts`).
  - Skill composition matrix and clean separation of repository guidance (`AGENTS.md`) from portable skill bundles (`skills/*/`).
- **Developer Configuration Surface (`packages/config`)**:
  - `app-config.ts`: Application constants, metadata, pagination limits.
  - `auth-config.ts`: Authentication settings (`registrationEnabled`, `defaultIdentity`, `sessionTtlSeconds`, `cookieName`, `minPasswordLength`).
  - `iam-config.ts`: Declarative domain roles, groups, default policies, and baseline role-policy assignments.
  - `feature-config.ts`: Optional feature toggles (`enableSwagger`, `enableMetrics`, `enableStorage`, `enableRedis`, `enableEmail`).
- **Comprehensive Quality Gates & Testing Architecture**:
  - Multi-tier testing pyramid: unit tests, Fastify `app.inject()` integration tests, adversarial security tests, generator smoke tests, and packed tarball release verification (`pnpm verify:release`).
  - Coverage analysis with `@vitest/coverage-v8`.
  - GitHub Actions CI/CD workflows (`ci.yml` and `release.yml`).
