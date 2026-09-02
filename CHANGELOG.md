# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.8] - 2026-09-02

### Fixed
- Fixed unstyled frontend: packaged `apps/web/postcss.config.mjs`, `apps/web/next.config.mjs`, and `apps/web/components.json` in published npm bundle so Tailwind CSS generates all styles in scaffolded Next.js apps.
- Updated `pnpm-workspace.yaml` with `onlyBuiltDependencies: [esbuild]` to eliminate pnpm configuration deprecation warnings.

## [1.0.7] - 2026-09-02

### Fixed
- Direct TypeScript source exports for workspace packages: updated `packages/*/package.json` exports to point directly to `src/index.ts`, enabling instant hot-reloading, `pnpm db:migrate`, and `pnpm db:seed` without requiring pre-compilation of `dist`.
- Updated MinIO and MinIO Client image tags in `docker-compose.yml` to standard reliable tags.

## [1.0.6] - 2026-09-02

### Fixed
- Fixed `npm error code EUNSUPPORTEDPROTOCOL` on `npx create-odoo-app`: removed `workspace:*` dependencies from root `package.json` so `npm` and `npx` install and execute the generator cleanly on all platforms.
- Configured path aliases in root `tsconfig.json` so root scripts (`scripts/health-check.ts`, `scripts/setup.ts`) resolve internal packages directly.

## [1.0.5] - 2026-09-02

### Fixed
- Workspace package resolution in root scripts: configured root `dependencies` and `tsconfig.base.json` path mappings so root scripts (`pnpm health`, `pnpm setup`, `scripts/health-check.ts`) resolve `@packages/*` directly in both generator and generated monorepo apps.

## [1.0.4] - 2026-09-01

### Added
- Preconfigured `.gitignore` file automatically created in all scaffolded applications, ignoring `node_modules`, `.pnpm-store`, environment secrets (`.env`, `.env.*`), build outputs (`dist`, `.next`), coverage, temporary files, and Docker volume data directories.
- Filtered out `.npmignore` from generated projects.

## [1.0.3] - 2026-09-01

### Added
- Preconfigured `.gitignore` file guaranteed to be created in all scaffolded applications, ignoring `node_modules`, `.pnpm-store`, environment secrets (`.env`, `.env.*`), build outputs (`dist`, `.next`), coverage, temporary files, and Docker volume data directories.
- Filtered out `.npmignore` from generated projects.

## [1.0.2] - 2026-09-01

### Fixed
- Transformed root build/typecheck scripts in generated applications so `tsc -p tsconfig.cli.json` is not executed in generated projects.

## [1.0.1] - 2026-09-01

### Fixed
- Tailored scripts in generated user applications: removed generator-specific CLI build/release scripts (`build:cli`, `verify:release`, `release:check`, `release:pack`, `test:smoke`, `test:dogfood`) from generated `package.json`.
- Streamlined `pnpm typecheck`, `pnpm build`, and `pnpm verify` commands in generated projects.

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
- **Dependency Modernization, CI Bootstrap Repair & Dogfooding Verification (Phase 6.2)**:
  - Fixed GitHub Actions pnpm bootstrap failure across Ubuntu and Windows matrix using `actions/setup-node@v4` with native `corepack enable` and `corepack prepare pnpm@11.1.0 --activate`.
  - Added automated dependency baseline checking tool (`scripts/check-deps.ts` / `pnpm deps:check`).
  - Added 14th canonical skill: `skills/dependencies/SKILL.md` (Monorepo dependency inventory, safe upgrades, lockfile integrity).
  - Implemented end-to-end generator dogfooding test suite (`scripts/dogfood-test.ts` / `pnpm test:dogfood`) testing scaffolding, metadata transforms, skill verification, and clean unpacked distribution.
  - Formalized permanent dependency upgrade policy (Rule 11) in `AGENTS.md`.
- **Developer Configuration Surface (`packages/config`)**:
  - `app-config.ts`: Application constants, metadata, pagination limits.
  - `auth-config.ts`: Authentication settings (`registrationEnabled`, `defaultIdentity`, `sessionTtlSeconds`, `cookieName`, `minPasswordLength`).
  - `iam-config.ts`: Declarative domain roles, groups, default policies, and baseline role-policy assignments.
  - `feature-config.ts`: Optional feature toggles (`enableSwagger`, `enableMetrics`, `enableStorage`, `enableRedis`, `enableEmail`).
- **Comprehensive Quality Gates & Testing Architecture**:
  - Multi-tier testing pyramid: unit tests, Fastify `app.inject()` integration tests, adversarial security tests, generator smoke tests, and packed tarball release verification (`pnpm verify:release`).
  - Coverage analysis with `@vitest/coverage-v8`.
  - GitHub Actions CI/CD workflows (`ci.yml` and `release.yml`).
