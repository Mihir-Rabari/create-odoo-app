---
name: frontend-architecture
description: Next.js App Router patterns, Tailwind CSS, TanStack Query, AuthContext integration, and frontend testing expectations
---

# Frontend Architecture Skill

## 1. Application Layering
- Located in `apps/web/src/`.
- App Router layout hierarchy (`app/layout.tsx`, `app/page.tsx`, `app/dashboard/page.tsx`, `app/admin/layout.tsx`).
- Client components declare `'use client'` at the very top.
- Data fetching uses `@/lib/api-client` with TanStack Query hooks in `hooks/`.
- Session state is managed via `useAuth()` (`contexts/auth-context.tsx`).

## 2. Dynamic Permission-Aware UI
- Use `hasPermission(action)` from `useAuth()` to conditionally display admin navigation and action buttons.
- Note: UI hiding is an aesthetic convenience, not the actual security boundary. All privileged backend API routes must enforce server-side `requirePermission(...)`.
- `api-client.ts` uses `credentials: 'include'` on all `fetch` requests so HTTP-only session cookies are transmitted automatically.

## 3. Mandatory Testing Expectations
- Test client API interactions with unit tests for `@/lib/api-client`.
- Prioritize behavioral testing (auth state changes, error handling, session expiration recovery) over brittle full-page DOM snapshots.
- Ensure Next.js builds cleanly (`pnpm build`) with zero static generation errors across all routes.
