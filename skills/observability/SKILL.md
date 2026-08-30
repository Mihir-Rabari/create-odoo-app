---
name: observability-metrics
description: Structured logging, request correlation, Prometheus metrics, health probes, sensitive data redaction, and diagnostics
---

# Observability & Structured Logging Skill

## 1. Structured Logging Philosophy
- **Universal Canonical Logger**: Always use `logger` or `createLogger` from `@packages/shared`.
- **No `console.log`**: Never use `console.log`, `console.error`, or `console.warn` in backend application code.
- **Environment-Aware Formatting**:
  - **Development**: Pretty-formatted human-readable logs with timestamps and colorization (`pino-pretty`).
  - **Production**: High-performance structured newline-delimited JSON with ISO timestamps.

## 2. Request Correlation
- Every HTTP request receives an `x-request-id` header.
- Safe header sanitization: Incoming `x-request-id` headers are validated against `^[a-zA-Z0-9_-]{1,64}$` to prevent log injection.
- Correlated Errors: Client error responses include `requestId` matching server diagnostic logs.

```typescript
// Correlated log in route/service
request.log.info({
  userId: user.id,
  action: 'project.create',
  projectId: project.id,
}, 'Project created successfully');
```

## 3. Inviolable Redaction Rules
The logger automatically redacts sensitive fields on top-level and nested objects:
- `*.password`, `*.passwordHash`
- `*.token`, `*.sessionToken`, `*.tokenHash`
- `*.secret`, `*.sessionSecret`
- `*.accessKey`, `*.secretKey`, `*.apiKey`
- `*.authorization`, `req.headers.authorization`
- `*.cookie`, `req.headers.cookie`, `res.headers['set-cookie']`
- `*.databaseUrl`, `*.DATABASE_URL`, `*.SESSION_SECRET`, `*.RESEND_API_KEY`

## 4. Operational vs Audit Logging
- **Application Logs**: Ephemeral operational and diagnostic information.
- **Audit Logs**: Durable database records for security and business compliance (IAM user status changes, role assignments).

## 5. Metrics & Probes
- **`/health`**: Fast summary probe.
- **`/health/live`**: Liveness probe.
- **`/health/ready`**: Deep readiness probe verifying PostgreSQL, Redis, and Object Storage connections.
- **`/metrics`**: Prometheus scrape endpoint. Never use high-cardinality request IDs or user IDs as Prometheus labels.

## 6. Examples

### Good Log:
```json
{
  "level": 30,
  "time": 1725000000000,
  "reqId": "req_1725000000000_abc1234",
  "userId": "usr_987",
  "action": "auth.login.success",
  "msg": "User logged in successfully"
}
```

### Bad Log (PROHIBITED):
```typescript
// NEVER LOG SECRETS, TOKENS, OR RAW HEADERS
logger.info({ password: req.body.password, headers: req.headers });
```
