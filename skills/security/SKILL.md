---
name: security-rules
description: Inviolable security constraints, credential protection, server-side authorization, and adversarial security testing
---

# Inviolable Security Rules Skill

## 1. Zero Trust of Client Input
1. **Never trust client-supplied roles**: When a user registers or submits data, client payload fields such as `role`, `identityType`, or `permissions` must be discarded.
2. **Never trust client-supplied ownership**: Always check `context.resourceOwnerId === identity.id` on the server before allowing access to `:self` operations.
3. **Never trust hidden frontend controls**: Hiding a button or route in Next.js does not secure an endpoint. All privileged operations require server-side Fastify route guards (`requirePermission`).
4. **Never return password hashes**: Password hashes must never appear in API responses, user list views, or serialization models.
5. **Never log sensitive data**: Passwords, session tokens, and secrets must never be written to stdout or application logs.
6. **Protect against timing attacks**: Use constant-time comparison (`crypto.timingSafeEqual`) when verifying hashes or signatures.
7. **Session invalidation**: Suspending or disabling an account must immediately revoke all associated active sessions in PostgreSQL and Redis.

## 2. Mandatory Security Testing Doctrine
Every security control must be backed by an adversarial test:
- **Privilege Escalation**: Explicitly send requests with elevated roles/identities and verify rejection or sanitization.
- **Data Redaction**: Verify that API error responses and logs never leak credentials, secrets, or internal database connection strings.
- **Constant-Time Verification**: Ensure password verification functions handle malformed or empty hashes safely without timing discrepancies.
