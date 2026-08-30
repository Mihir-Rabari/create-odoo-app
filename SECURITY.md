# Security Policy

The `create-odoo-app` project takes security and responsible disclosure seriously. We appreciate the efforts of security researchers and developers in identifying and reporting vulnerabilities.

---

## Supported Versions

Only the latest release branch of `create-odoo-app` receives active security updates and patches:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

> [!IMPORTANT]
> **Please do NOT report security vulnerabilities through public GitHub issues, discussions, or social media.**

To report a vulnerability:

1. **GitHub Private Vulnerability Reporting (Recommended)**:
   Navigate to the [Security Advisories page](https://github.com/Mihir-Rabari/create-odoo-app/security/advisories/new) and submit a private draft advisory.
2. **Direct Maintainer Contact**:
   If the GitHub advisory system is unavailable, reach out directly to the maintainer via GitHub profile [@Mihir-Rabari](https://github.com/Mihir-Rabari).

### What to Include in Your Report

To help us investigate and reproduce the issue quickly, please provide:

- A clear description of the vulnerability and its potential impact.
- Step-by-step instructions or a minimal reproducible example (code snippet, curl request, or payload).
- The affected component (e.g., `packages/auth`, `packages/iam`, `apps/api`, generator CLI).
- Any proposed remediation, mitigation, or patch.

---

## Response & Disclosure Process

- **Acknowledgment**: We aim to acknowledge receipt of your report within **48 hours**.
- **Assessment & Triage**: We will investigate and assess the vulnerability within **5 business days**.
- **Fix & Patch**: A fix will be developed, tested against the security test suite, and prepared for release.
- **Public Disclosure**: We will publish a CVE/Security Advisory and release a patched version simultaneously. We will credit you in the release notes if desired.

---

## Security Best Practices for Generated Applications

Applications generated with `create-odoo-app` include foundational security controls:
- **Server-Side Authorization**: IAM policy evaluation with explicit-deny precedence and `:self` ownership checks.
- **Defensive Password Hashing**: Node-native `scrypt` with random salts and timing-safe comparison (`crypto.timingSafeEqual`).
- **Session Security**: Cryptographically strong SHA-256 session token hashing in PostgreSQL and Redis.
- **Strict Input Validation**: Zod runtime schema boundaries on all Fastify routes.
- **Data Redaction**: Structured logging automatically sanitizes secrets, tokens, passwords, and connection strings.

When deploying generated applications to production:
1. Ensure all environment secrets (`SESSION_SECRET`, `DATABASE_PASSWORD`, `S3_SECRET_KEY`) use strong, randomly generated entropy.
2. Serve all traffic over HTTPS with TLS 1.3.
3. Configure appropriate CORS origins and HTTP-only, Secure cookie attributes.
