---
name: frontend
description: Next.js App Router, shadcn/ui components, Tailwind CSS, TanStack Query, AuthContext, and permission-aware UI.
---

# Frontend Skill — Next.js 15, shadcn/ui & Tailwind CSS

## 1. When to Use
Use this skill when building or editing Next.js UI pages, React client/server components, shadcn/ui styled primitives, Tailwind styling, TanStack Query hooks, or AuthContext integrations.

## 2. Application Layering & Architecture
- **Location**: `apps/web/src/`.
- **App Router Hierarchy**: `app/layout.tsx`, `app/page.tsx`, `app/dashboard/page.tsx`, `app/profile/page.tsx`, `app/admin/layout.tsx`.
- **Client Components**: Declare `'use client'` at the very top of interactive components.
- **Data Fetching**: Use `@/lib/api-client` backed by TanStack Query hooks in `hooks/` with staleTime and refetch controls.
- **Session State**: Managed via `useAuth()` (`contexts/auth-context.tsx`) leveraging server-side HTTP-only session cookies (`credentials: 'include'`).

## 3. shadcn/ui Component Suite & Radix Primitives
`apps/web/src/components/ui/` contains standard, composable, unstyled-primitive-backed UI components:
- **Button**: Powered by Radix `Slot` (`asChild`), `class-variance-authority` (`cva`), and responsive variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `success`).
- **Dialog / Modal**: Radix Dialog with backdrop overlay, animated transition, header, description, content, and close triggers.
- **DropdownMenu**: Radix DropdownMenu with trigger, submenus, radio groups, checkboxes, and keyboard shortcuts.
- **Form Controls**: Styled `Input`, Radix `Label`, Radix `Select`, Radix `Switch`.
- **Feedback & State**: `Toaster` (`sonner`), `Badge` (`cva`), `Skeleton` (shimmer), `Alert`, and `Tooltip`.
- **Theming**: Dark/Light/System theme switching powered by `next-themes` and CSS variable color tokens.

## 4. Dynamic Permission-Aware UI
- Use `hasPermission(action)` from `useAuth()` to conditionally display admin navigation and action buttons.
- **Zero-Trust Invariant**: UI element hiding is an aesthetic convenience. All privileged backend API routes must strictly enforce server-side `requirePermission(...)`.
- `api-client.ts` uses `credentials: 'include'` on all `fetch` requests so HTTP-only session cookies are transmitted automatically.

## 5. Mandatory Testing Expectations
- Test client API interactions with unit tests for `@/lib/api-client`.
- Prioritize behavioral testing (auth state changes, error handling, session expiration recovery) over brittle full-page DOM snapshots.
- Ensure Next.js builds cleanly (`pnpm build`) with zero static generation errors across all routes.
