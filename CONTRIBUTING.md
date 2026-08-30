# Contributing to create-odoo-app

Thank you for your interest in contributing to `create-odoo-app`! We welcome contributions from human engineers and automated coding agents alike.

Please review this guide before submitting issues or pull requests.

---

## Code of Conduct

By participating in this project, you agree to abide by the terms of our [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Development Prerequisites

- **Node.js**: `v22.13.0` or higher (Active LTS)
- **Package Manager**: `pnpm` `v11.1.0` or higher (enabled via `corepack enable`)
- **Docker & Docker Compose**: For local PostgreSQL, Redis, MinIO, and Prometheus infrastructure

---

## Local Setup

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/<your-username>/create-odoo-app.git
   cd create-odoo-app
   ```

2. **Enable Corepack & Install Dependencies**:
   ```bash
   corepack enable
   pnpm install
   ```

3. **Initialize Local Infrastructure & Database**:
   ```bash
   pnpm setup
   ```

4. **Launch Development Servers**:
   ```bash
   pnpm dev
   ```
   - Frontend UI: [http://localhost:3000](http://localhost:3000)
   - Backend API: [http://localhost:3001](http://localhost:3001)
   - OpenAPI Docs: [http://localhost:3001/api/docs](http://localhost:3001/api/docs)
   - Grafana: [http://localhost:3002](http://localhost:3002)

---

## Architectural Principles & Rules

Contributors must respect monorepo boundaries and inviolable rules:

1. **Backend Owns Security**: All database persistence, authentication, and authorization logic reside in backend packages (`packages/auth`, `packages/iam`, `apps/api`). The frontend (`apps/web`) must never access infrastructure credentials.
2. **Zero-Trust Validation**: Every HTTP route must validate inputs at API boundaries using Zod schemas.
3. **Structured Logging**: Use `createLogger` from `@packages/shared`. Never use `console.log` in backend code. Secrets and tokens are automatically redacted.
4. **Agent Skills Standard**: Any new or modified skill in `skills/` must follow the Agent Skills open standard and pass `pnpm skills:check` and `pnpm skills:lint`.
5. **Deterministic Testing**: Every bug fix requires a permanent regression test. Security changes require adversarial tests (`pnpm test:security`).

---

## Verification & Quality Gates

Before opening a pull request, verify that all local quality gates pass:

```bash
# Skills standard verification & linting
pnpm skills:check
pnpm skills:lint
pnpm skills:pack --all

# Linters & TypeScript verification
pnpm lint
pnpm typecheck

# Full testing pyramid
pnpm test
pnpm test:security
pnpm test:smoke
pnpm test:dogfood

# Complete verification gate
pnpm verify
pnpm release:check
```

---

## Submitting Pull Requests

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-bugfix-name
   ```
2. **Commit Conventions**:
   Use Conventional Commits syntax (`feat: ...`, `fix: ...`, `docs: ...`, `test: ...`, `refactor: ...`).
3. **Open a Pull Request**:
   - Ensure the PR title clearly describes the change.
   - Complete the PR template checklist.
   - CI will automatically verify your branch across Ubuntu and Windows runners.
