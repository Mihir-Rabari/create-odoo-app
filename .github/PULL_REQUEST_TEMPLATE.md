## Summary of Changes

A clear and concise description of the changes made and the motivation behind them.

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Security hardening
- [ ] Documentation update

## Checklist

- [ ] I have read and followed [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md).
- [ ] My code follows the monorepo layering rules (no frontend direct DB/Redis/S3 access).
- [ ] I have added tests proving correctness for all new behavior or bug fixes.
- [ ] For security-relevant changes, I have added negative/adversarial tests.
- [ ] I have run `pnpm verify` locally and all quality gates pass:
  - `pnpm skills:check && pnpm skills:lint`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm test:security`
  - `pnpm test:smoke`
  - `pnpm test:dogfood`
  - `pnpm build`
- [ ] No secrets, tokens, or hardcoded machine paths exist in my changes.
