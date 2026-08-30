# create-odoo-app

A production-grade npm project generator that scaffolds full-stack monorepo applications built with **Next.js (App Router)**, **Fastify**, **PostgreSQL (Drizzle ORM)**, **Redis**, **S3-compatible Object Storage (MinIO)**, **Prometheus/Grafana Observability**, and a complete **Identity, Authentication & IAM Authorization System**.

---

## 1. Quick Start

Create a new application with a single command:

```bash
npx create-odoo-app@latest my-awesome-app
```

Then navigate into your project and initialize your local environment:

```bash
cd my-awesome-app
pnpm setup
pnpm dev
```

---

## 2. CLI Usage & Options

```text
npx create-odoo-app@latest <project-name> [options]
npx create-odoo-app@latest . [options]
```

### Options

| Flag | Description |
| :--- | :--- |
| `--skip-install` | Skip automatic dependency installation with `pnpm` |
| `--skip-git` | Skip initializing a new Git repository |
| `--skip-infra` | Skip starting Docker infrastructure during setup |
| `-h, --help` | Display CLI help message |
| `-v, --version` | Display generator package version |

---

## 3. Architecture & Monorepo Structure

```text
my-awesome-app/
├── apps/
│   ├── web/               # Next.js (App Router) + Tailwind CSS + shadcn/ui + TanStack Query + Auth/IAM UI
│   └── api/               # Fastify + Zod validation + OpenAPI / Swagger + Prometheus metrics + Auth/IAM Gateway
│
├── packages/
│   ├── auth/              # Password hashing (scrypt), session management (PostgreSQL + Redis), cookie helpers
│   ├── iam/               # Permission catalog, policy evaluation engine (Explicit Deny, :self ownership), route guards
│   ├── config/            # Developer configuration surface (app-config, auth-config, iam-config, feature-config)
│   ├── db/                # PostgreSQL client, Drizzle ORM schemas (System, Auth, IAM), migrations, seeds
│   ├── openapi/           # OpenAPI 3.0 specification metadata, tag taxonomy, and schema utilities
│   ├── shared/            # Reusable Redis (ioredis) & S3/MinIO (@aws-sdk/client-s3) clients
│   └── validation/        # Runtime validation schemas (Auth, IAM, pagination, UUID, HTTP error models)
│
├── skills/                # Agent-native reference skills (architecture, security, validation, database, etc.)
│
├── infrastructure/
│   └── docker/
│       ├── prometheus/    # Prometheus scrape configurations
│       └── grafana/       # Grafana datasource and dashboard provisioning
│
├── scripts/               # Cross-platform setup, smoke test, and health check scripts
├── docker-compose.yml     # Local infrastructure (PostgreSQL, Redis, MinIO, Prometheus, Grafana)
├── AGENTS.md              # Coding Agent & Developer Operating Manual
├── CHANGELOG.md           # Release history and Keep a Changelog documentation
├── .env.example           # Environment template with local defaults
└── package.json           # Monorepo root configuration
```

---

## 4. Developer Configuration Surface (`packages/config`)

The generated project exposes a configuration layer in `packages/config/src/`:

* **`app-config.ts`**: Application constants, metadata, pagination limits.
* **`auth-config.ts`**: Authentication behavior (`registrationEnabled`, `sessionTtlSeconds`, `cookieName`, `minPasswordLength`).
* **`iam-config.ts`**: Declarative domain roles, groups, default policies, and baseline role-policy assignments so developers do not need to edit raw database records or authorization engine internals.
* **`feature-config.ts`**: Optional infrastructure feature toggles (`enableSwagger`, `enableMetrics`, `enableStorage`, `enableRedis`, `enableEmail`).

---

## 5. Agent Skills Architecture & Discovery (`skills/*`)

The project provides 13 reusable Agent Skills aligned with the **Agent Skills open standard**, cataloged in the machine-readable registry [`skills/index.yaml`](skills/index.yaml):

* [`skills/architecture/SKILL.md`](skills/architecture/SKILL.md): Monorepo structure, package boundaries, layering rules.
* [`skills/authentication/SKILL.md`](skills/authentication/SKILL.md): Session lifecycle, scrypt hashing, cookies, auth events.
* [`skills/authorization/SKILL.md`](skills/authorization/SKILL.md): Policy evaluation, explicit deny precedence, `:self` ownership.
* [`skills/database/SKILL.md`](skills/database/SKILL.md): Drizzle schemas, migrations, relations, deterministic seeds.
* [`skills/api/SKILL.md`](skills/api/SKILL.md): Fastify route conventions, Zod validation, error responses.
* [`skills/frontend/SKILL.md`](skills/frontend/SKILL.md): Next.js App Router, TanStack Query, AuthContext.
* [`skills/security/SKILL.md`](skills/security/SKILL.md): Inviolable security rules (never trust client input, server guards).
* [`skills/validation/SKILL.md`](skills/validation/SKILL.md): Input validation rules, bounds, dates, pagination.
* [`skills/testing/SKILL.md`](skills/testing/SKILL.md): Testing doctrine, testing pyramid, AAA standard, adversarial tests.
* [`skills/storage/SKILL.md`](skills/storage/SKILL.md): MinIO/S3 `StorageService` abstractions.
* [`skills/email/SKILL.md`](skills/email/SKILL.md): Transactional email provider integration.
* [`skills/realtime/SKILL.md`](skills/realtime/SKILL.md): Redis Pub/Sub notification events.
* [`skills/observability/SKILL.md`](skills/observability/SKILL.md): Prometheus metrics, Grafana dashboards, health probes.

Validate skill registry and YAML frontmatter integrity at any time with:
```bash
pnpm skills:check
```

---

## 6. Local Service Endpoints

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:3000](http://localhost:3000) | Next.js App Router UI |
| **IAM Admin Console** | [http://localhost:3000/admin](http://localhost:3000/admin) | IAM Control Center |
| **Backend API Gateway** | [http://localhost:3001](http://localhost:3001) | Fastify HTTP Gateway |
| **OpenAPI Documentation** | [http://localhost:3001/api/docs](http://localhost:3001/api/docs) | Interactive Swagger UI |
| **OpenAPI Raw Spec** | [http://localhost:3001/api/openapi.json](http://localhost:3001/api/openapi.json) | OpenAPI 3.0 JSON Specification |
| **Prometheus Metrics** | [http://localhost:3001/metrics](http://localhost:3001/metrics) | Prometheus metrics endpoint |
| **Grafana Dashboards** | [http://localhost:3002](http://localhost:3002) | `admin` / `admin` (or anonymous viewer) |
| **MinIO S3 Console** | [http://localhost:9001](http://localhost:9001) | `minioadmin` / `minioadmin` |

---

## 7. Monorepo & Quality Commands

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Run Next.js (`apps/web`) and Fastify (`apps/api`) concurrently |
| `pnpm dev:api` | Run Fastify API in watch mode (`apps/api`) |
| `pnpm dev:web` | Run Next.js in development mode (`apps/web`) |
| `pnpm build` | Compile all workspace packages, applications, and CLI binary |
| `pnpm test` | Run complete Vitest test suite across all packages |
| `pnpm test:security` | Run dedicated IAM & authentication security tests |
| `pnpm test:coverage` | Run Vitest test suite with v8 code coverage analysis |
| `pnpm test:smoke` | Run generator smoke test in a temporary directory |
| `pnpm verify` | Run full local quality gate (lint + typecheck + test + smoke + build) |
| `pnpm verify:release` | Execute pre-release packaging, package audit, and unpacked generator test |
| `pnpm release:check` | Canonical pre-release verification checklist command |
| `pnpm typecheck` | Run strict TypeScript verification across all packages + CLI |
| `pnpm lint` | Run code quality linters across all packages |
| `pnpm setup` | Cross-platform idempotent setup and database seeding |
| `pnpm db:migrate` | Apply pending Drizzle PostgreSQL migrations |
| `pnpm db:seed` | Seed database (bootstraps ROOT admin and baseline IAM) |
| `pnpm db:studio` | Launch Drizzle Studio database GUI |
| `pnpm infra:up` | Start Docker Compose infrastructure |
| `pnpm infra:down` | Stop Docker Compose infrastructure |
| `pnpm infra:reset` | Stop infrastructure and purge all Docker volume data |
| `pnpm health` | Execute end-to-end infrastructure health check script |

---

## 8. Release Engineering, CI/CD & Publishing

### Automated CI/CD Pipeline
- **Continuous Integration (`.github/workflows/ci.yml`)**: Runs on pull requests and pushes to `main`. Tests on Ubuntu and Windows across Node.js 20.x and 22.x with dependency caching and full quality gates (`pnpm verify`).
- **Release Automation (`.github/workflows/release.yml`)**: Automatically triggers on Git tags (`v*.*.*`) or manual trigger. Builds, audits package contents for leaks, publishes to npm with `--access public --provenance`, and generates a GitHub Release.

### Semantic Versioning Policy
- **`patch` (e.g. 1.0.1)**: Bug fixes, security patches, documentation updates.
- **`minor` (e.g. 1.1.0)**: Backward-compatible additions to the generator, CLI options, or template packages.
- **`major` (e.g. 2.0.0)**: Breaking CLI argument changes, major architectural changes to generated templates.

### Pre-Release Verification
Before publishing or tagging a release, run:
```bash
pnpm release:check
```
This builds all packages, packages the `.tgz` artifact via `npm pack`, scans the tarball contents to guarantee zero leaked secrets or local machine paths, unpacks into a clean temporary directory, and runs the generator from the unpacked distribution to verify the generated application.
