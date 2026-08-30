---
name: input-validation
description: Runtime schema validation rules, business constraint enforcement, and pagination limits
---

# Input Validation Skill

## 1. Universal Runtime Validation
All external input must be validated using Zod schemas at API boundaries before reaching services or database layers.

## 2. Business Constraint Rules
- **Identifiers**: Validate UUID format using `z.string().uuid()` (`UuidSchema`).
- **Emails**: Validate and normalize lowercase: `z.string().trim().email().toLowerCase()`.
- **Strings**: Reject empty or whitespace-only strings with `z.string().trim().min(1)`.
- **Passwords**: Enforce minimum length of 8 characters.
- **Dates**:
  - Birth dates cannot be in the future.
  - End dates must be greater than or equal to start dates.
  - Expiration dates must follow creation dates.
- **Pagination**:
  - Always enforce bounded limits (default: 20, max: 100).
  - Page numbers must be positive integers (`z.coerce.number().int().positive()`).
- **File Uploads**: Enforce strict file size limits and MIME type allowlists before storage processing.
