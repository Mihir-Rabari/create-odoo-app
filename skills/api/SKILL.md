---
name: api-development
description: Fastify route development, Zod type providers, OpenAPI documentation, error handling, and API testing expectations
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

## 3. Mandatory Testing Expectations
Every new API route requires:
1. **Schema Validation Test**: Verifying invalid parameters or payload shapes return 400 with structured validation details.
2. **Authentication Guard Test**: Verifying unauthenticated requests return 401.
3. **Authorization Guard Test**: Verifying unauthorized roles/users return 403.
4. **Success Test**: Verifying valid requests return expected status codes and matching response schema.
5. **OpenAPI Sync**: Verifying the route appears in `/api/openapi.json`.
