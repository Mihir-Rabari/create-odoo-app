---
name: authorization
description: Identity and Access Management, policy evaluation engine, declarative route guards, and permissions.
---

# Authorization & IAM Skill

## 1. When to Use
Use this skill when defining permissions, roles, groups, IAM policies, policy evaluation statements, route guards, or resource ownership checks.

## 2. Policy Evaluation Invariants
1. **Superuser ROOT Authority**: If `identity.identityType === 'ROOT'`, access is unconditionally granted across all actions.
2. **Explicit Deny Precedence**: If any statement (direct, role, or group) contains `effect: 'deny'` matching the requested action, access is immediately blocked.
3. **Allow Statements & Ownership**: If an allow statement matches:
   - For `:self` actions (e.g. `profile:update:self`), verify `context.resourceOwnerId === identity.id`.
4. **Implicit Deny**: If no matching statement is found, access is denied by default.

## 3. Operational Logging vs Audit Trail
- **Operational Logs**: Diagnostic logs for developer visibility (e.g. `iam.permission.evaluated`, `iam.user.status_updated`).
- **Audit Logs**: Durable database records for security compliance (`iam_audit_logs` table tracking administrative mutations).

## 4. Route Guards Convention
```typescript
import { requirePermission, requireAuthentication } from '@packages/iam';

// Require login
fastify.get('/profile', { preHandler: [requireAuthentication()] }, handler);

// Require specific permission
fastify.get('/users', { preHandler: [requirePermission('users:read')] }, handler);

// Require self-resource ownership
fastify.put('/users/:id', {
  preHandler: [
    requirePermission('users:update', (req) => ({ resourceOwnerId: req.params.id })),
  ],
}, handler);
```

## 5. Mandatory Testing Expectations
Every authorization change requires:
1. **Allow Cases**: Legitimate permissions allow operation.
2. **Deny Precedence**: Explicit `DENY` statement strictly overrides any matching `ALLOW`.
3. **Ownership Verification**: Resource-level ownership tests (`owner -> allowed`, `other user -> 403`, `unauthenticated -> 401`).
4. **Privilege Escalation Defense**: Negative tests proving normal external users cannot grant themselves permissions or access admin routes.
