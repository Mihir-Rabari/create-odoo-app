---
name: transactional-email
description: Email provider configuration, template patterns, and delivery rules
---

# Transactional Email Skill

## 1. Overview & Configuration
- Configured in `packages/config/src/feature-config.ts` (`enableEmail`).
- Provider credentials in `.env` (`RESEND_API_KEY`, `RESEND_FROM`).
- Lazy initialization: If email is disabled in configuration, provider connections are not opened at startup.

## 2. Best Practices
- Always sanitize recipient addresses using email validation schemas (`EmailSchema`).
- Do not block critical HTTP requests waiting for email delivery; handle async or gracefully log errors.
- Never include raw authorization tokens or passwords in email content without expiration.
