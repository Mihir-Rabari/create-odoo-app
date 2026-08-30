---
name: database-management
description: Drizzle ORM schema patterns, migrations, relations, and deterministic seed rules
---

# Database Management Skill

## 1. Schema Conventions
- Define tables in modular files under `packages/db/src/schema/<module>.ts`.
- Re-export all tables in `packages/db/src/schema/index.ts`.
- Use UUID primary keys: `id: uuid('id').defaultRandom().primaryKey()`.
- Always include timestamps:
  ```typescript
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  ```
- Always define foreign keys with appropriate `onDelete` cascade or restrict behaviors.
- Index lookup columns (e.g. `email`, `status`, `userId`, `tokenHash`).

## 2. Migrations & Seeds
- Generate migrations: `pnpm db:generate`.
- Apply migrations: `pnpm db:migrate`.
- Seed data idempotently: `pnpm db:seed`.
- The seed runner must check for existing records (e.g. `ROOT` account, default policies) and never overwrite or reset user data on repeated runs.
