---
name: testing-doctrine
description: Central testing philosophy, testing pyramid, AAA pattern, adversarial testing, and quality gates
---

# Repository Testing Doctrine & Quality Standard

## 1. Core Principle
> **Behavior must be verified at the narrowest appropriate level, and security-sensitive behavior must also be verified at an integration boundary.**

## 2. Testing Pyramid & Categories
```text
                 E2E / Smoke (Generator, Distributable Tarball)
              ───────────────────────────────────────────────────
                        API & Adversarial Security
              ───────────────────────────────────────────────────
                        Integration (Fastify app.inject, DB)
              ───────────────────────────────────────────────────
                        Unit Tests (Crypto, Policy, Validation)
              ───────────────────────────────────────────────────
                        Static Quality (Typecheck, Lint, Build)
```

### Taxonomy
- **`unit`**: Fast, isolated tests for pure functions, cryptographic utilities, Zod validation schemas, policy evaluation logic.
- **`integration`**: Tests for component interactions using Fastify `app.inject()` and database clients.
- **`security` / `adversarial`**: Explicit negative tests demonstrating that unauthorized access, privilege escalation, and parameter tampering are blocked.
- **`generator` / `smoke`**: Verifying project scaffolding, metadata transformations, and distributable `.tgz` tarball unpacking.

## 3. The Arrange / Act / Assert (AAA) Pattern
Every test must be independently understandable and follow the AAA pattern:
```typescript
it('rejects login for suspended users with 403 Forbidden', async () => {
  // Arrange
  const suspendedUser = await createTestUser({ status: 'SUSPENDED' });
  const credentials = { email: suspendedUser.email, password: 'ValidPassword123!' };

  // Act
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: credentials,
  });

  // Assert
  expect(response.statusCode).toBe(403);
  const json = response.json();
  expect(json.code).toBe('ACCOUNT_SUSPENDED');
  expect(json.requestId).toBeDefined();
});
```

## 4. Deterministic Testing Rules
- **No Uncontrolled Time**: Use fixed timestamps or controllable clocks.
- **No Arbitrary Network**: Never call live third-party cloud services in normal test suites.
- **Isolation**: Each test must create its own isolated state or clean up after execution. Tests must pass regardless of execution order or concurrency.
- **Explicit Assertions**: Never use `expect(true).toBe(true)` or snapshot tests as a substitute for behavioral assertions.

## 5. Security & Adversarial Testing Requirements
- **Privilege Escalation**: Verify that client-supplied `role: 'ADMIN'` or `identityType: 'ROOT'` in public endpoints is discarded.
- **Explicit Deny Precedence**: Verify that explicit `DENY` statements override `ALLOW` statements.
- **Self-Resource Ownership**: Verify that `:self` actions strictly require `context.resourceOwnerId === identity.id`.
- **Zero Leakage**: Verify that passwords, session secrets, SQL internals, and stack traces are never returned in responses or logs.

## 6. Anti-Patterns to Avoid
1. **Testing Implementation Details**: Test observable behavior and outcomes, not internal variable names or private methods.
2. **Over-Mocking**: Do not mock the exact function being tested.
3. **Massive Snapshots**: Avoid multi-page HTML snapshots that break on every minor styling adjustment.
4. **Order Dependencies**: Never assume test B runs after test A.
