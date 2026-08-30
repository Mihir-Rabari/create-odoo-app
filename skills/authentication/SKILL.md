---
name: authentication-system
description: Authentication lifecycle, password hashing, session tokens, identity management, operational event logging, and auth testing expectations
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

## 3. Operational Event Logging
Log structured auth events without credentials:
- `auth.signup.success` (with `userId`, `identityType`)
- `auth.signup.failure` (with reason code, never passwords)
- `auth.login.success` (with `userId`, `identityType`)
- `auth.login.failure` (with reason code, never passwords)
- `auth.logout` (with `userId`)
- `auth.session.revoked` (with `userId`, `reason`)

## 4. Mandatory Testing Expectations
Every authentication change requires:
1. **Happy Path**: Successful signup, login, session validation, logout.
2. **Input Validation**: Rejection of weak passwords, malformed emails, empty inputs.
3. **Security Invariants**: Verification that `passwordHash` is never exposed in user responses or session payloads.
4. **Session Invalidation**: Testing that suspended or disabled accounts have active sessions rejected.
5. **Cookie Security**: Testing that cookies have `httpOnly: true` and `secure: true` in production mode.
