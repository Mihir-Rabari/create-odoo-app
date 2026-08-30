# Frontend Web Application (`apps/web`) — Subtree Operating Manual

> **Scope**: Next.js App Router, React client/server components, Tailwind CSS styling, TanStack Query hooks, AuthContext integration, and permission-aware UI.

---

## 1. Subtree Architecture & Conventions

1. **Package Boundaries**:
   - **Must never** import `@packages/db` or connect directly to PostgreSQL, Redis, or MinIO/S3.
   - All backend communication must pass through `@/lib/api-client` (which uses `credentials: 'include'`).

2. **Component Conventions**:
   - Client components must declare `'use client'` at the very top of the file.
   - Separate presentational components from data fetching hooks (`hooks/use-*.ts`).

3. **Authentication & Authorization State**:
   - Session state is managed via `useAuth()` (`contexts/auth-context.tsx`).
   - Use `hasPermission('namespace:action')` for conditional rendering of navigation items and action buttons.
   - *Note*: Client-side hiding is for UX only; backend route guards enforce actual authorization.

4. **Testing Expectations**:
   - Test client API interactions with unit tests for `@/lib/api-client`.
   - Ensure Next.js builds cleanly (`pnpm build`) with zero static generation errors.
