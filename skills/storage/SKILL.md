---
name: object-storage
description: S3/MinIO StorageService abstraction, bucket management, and upload conventions
---

# Object Storage Skill

## 1. StorageService Abstraction
- All object storage operations must use `StorageService` from `@packages/shared`.
- S3 client uses `@aws-sdk/client-s3` and is configured via environment variables (`S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_FORCE_PATH_STYLE`).
- Never hardcode MinIO or AWS URLs into business logic.

## 2. Usage Patterns
```typescript
import { StorageService } from '@packages/shared';

const storage = new StorageService({
  endpoint: env.S3_ENDPOINT,
  region: env.S3_REGION,
  bucket: env.S3_BUCKET,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY,
    secretAccessKey: env.S3_SECRET_KEY,
  },
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
});

// Put object
await storage.putObject('uploads/document.pdf', buffer, 'application/pdf');

// Get object buffer
const data = await storage.getObject('uploads/document.pdf');
```
