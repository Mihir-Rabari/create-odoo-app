---
name: authorization-iam
description: Policy evaluation rules, permission catalog, role inheritance, and route guards
---

# IAM & Authorization Skill

## 1. Deterministic Evaluation Rules
1. **Superuser ROOT Authority**: If `identity.identityType === 'ROOT'`, access is unconditionally granted across all actions.
2. **Explicit Deny Precedence**: If any statement (direct, role, or group) contains `effect: 'deny'` matching the requested action, access is immediately blocked.
3. **Allow Statements & Ownership**: If an allow statement matches:
   - For `:self` actions (e.g. `profile:update:self`), verify `context.resourceOwnerId === identity.id`.
4. **Implicit Deny**: If no matching statement is found, access is denied by default.

## 2. Permission Catalog Convention
- Format: `namespace:action` (e.g. `users:read`, `roles:create`, `projects:delete`).
- Dynamic Registration: New modules register permissions via `registerPermissions({ namespace, permissions })`.

## 3. Fastify Route Guards
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
