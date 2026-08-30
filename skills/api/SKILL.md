---
name: api-development
description: Fastify route development, Zod type providers, OpenAPI documentation, and error handling
---

# API Development Skill

## 1. Route Registration Convention
All routes must use `FastifyPluginAsyncZod` from `fastify-type-provider-zod`:
```typescript
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { requirePermission } from '@packages/iam';
import { HttpErrorResponseSchema } from '@packages/validation';

export const featureRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    '/feature/:id',
    {
      preHandler: [requirePermission('feature:read')],
      schema: {
        tags: ['Feature'],
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: z.object({ id: z.string(), name: z.string() }),
          401: HttpErrorResponseSchema,
          403: HttpErrorResponseSchema,
          404: HttpErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      // route implementation
    }
  );
};
```

## 2. Standard Error Responses
All error responses must conform to `HttpErrorResponseSchema`:
- `statusCode`: HTTP status code
- `error`: Short error title (e.g. `Bad Request`, `Forbidden`)
- `message`: Descriptive message
- `code`: Machine-readable error code (e.g. `VALIDATION_ERROR`, `FORBIDDEN`)
- `requestId`: Trace identifier for debugging
