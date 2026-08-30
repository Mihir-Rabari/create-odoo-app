---
name: authentication-system
description: Authentication lifecycle, password hashing, session tokens, and identity management
---

# Authentication System Skill

## 1. Password Cryptography
- **Hashing**: Use `hashPassword(password)` from `@packages/auth` (scrypt with 16-byte random salt).
- **Verification**: Use `verifyPassword(password, hash)` with timing-safe comparison (`crypto.timingSafeEqual`).
- **Rules**: Never store or log plaintext passwords. Never return `passwordHash` in API responses or user models.

## 2. Server-Side Session Management
- **Token Format**: 32-byte cryptographic random token (`crypto.randomBytes(32).toString('hex')`).
- **Database Storage**: Tokens are hashed with SHA-256 before insertion into the `sessions` table (`tokenHash`).
- **Redis Fast Lookup**: Cached with TTL matching session lifetime (`session:<tokenHash>`).
- **Cookies**: Transmitted over secure HTTP-only cookies (`app_session`) with `SameSite=Lax`, `Path=/`, and `Secure` in production.

## 3. Account Status & Invalidation
- Statuses: `ACTIVE`, `SUSPENDED`, `DISABLED`.
- `SUSPENDED` / `DISABLED` accounts are rejected at login and during session validation.
- When an administrator suspends or disables an account, all active sessions are immediately revoked via `sessionManager.revokeAllUserSessions(userId)`.
