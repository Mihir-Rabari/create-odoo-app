import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { ZodError } from 'zod';
import type { HttpErrorResponse, ErrorDetail } from '@packages/validation';

async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) => {
    const requestId = (request.id as string) || request.headers['x-request-id']?.toString() || 'unknown';

    // Log the error with structured context
    request.log.error({
      err: error,
      requestId,
      method: request.method,
      url: request.url,
    }, error.message);

    // 1. Handle Zod validation errors
    if (error instanceof ZodError) {
      const details: ErrorDetail[] = error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        code: e.code,
      }));

      const response: HttpErrorResponse = {
        statusCode: 400,
        error: 'Bad Request',
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        details,
        timestamp: new Date().toISOString(),
      };

      return reply.status(400).send(response);
    }

    // 2. Handle Fastify schema validation errors
    if ((error as FastifyError).validation) {
      const fastifyErr = error as FastifyError;
      const details: ErrorDetail[] = (fastifyErr.validation || []).map((v) => ({
        field: v.instancePath || (v.params?.issue ? String(v.params.issue) : undefined),
        message: v.message || 'Invalid field',
        code: v.keyword,
      }));

      const response: HttpErrorResponse = {
        statusCode: 400,
        error: 'Bad Request',
        message: fastifyErr.message || 'Schema validation failed',
        code: 'VALIDATION_ERROR',
        requestId,
        details,
        timestamp: new Date().toISOString(),
      };

      return reply.status(400).send(response);
    }

    // 3. Handle HTTP status code errors (Sensible / custom error codes)
    const statusCode = typeof (error as FastifyError).statusCode === 'number' ? (error as FastifyError).statusCode! : 500;

    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorName = 'Internal Server Error';
    let message = 'An unexpected server error occurred';

    if (statusCode === 400) {
      errorCode = 'BAD_REQUEST';
      errorName = 'Bad Request';
      message = error.message;
    } else if (statusCode === 401) {
      errorCode = 'UNAUTHORIZED';
      errorName = 'Unauthorized';
      message = error.message || 'Authentication required';
    } else if (statusCode === 403) {
      errorCode = 'FORBIDDEN';
      errorName = 'Forbidden';
      message = error.message || 'Access denied';
    } else if (statusCode === 404) {
      errorCode = 'NOT_FOUND';
      errorName = 'Not Found';
      message = error.message || 'Requested resource not found';
    } else if (statusCode === 409) {
      errorCode = 'CONFLICT';
      errorName = 'Conflict';
      message = error.message || 'Resource conflict';
    } else if (statusCode === 429) {
      errorCode = 'RATE_LIMIT_EXCEEDED';
      errorName = 'Too Many Requests';
      message = error.message || 'Rate limit exceeded';
    } else if (statusCode >= 500) {
      // In development mode, provide error message; in production, keep generic
      const isDev = fastify.env?.NODE_ENV === 'development';
      message = isDev ? error.message : 'An internal server error occurred';
    }

    const response: HttpErrorResponse = {
      statusCode,
      error: errorName,
      message,
      code: errorCode,
      requestId,
      timestamp: new Date().toISOString(),
    };

    return reply.status(statusCode).send(response);
  });

  // Not Found (404) handler
  fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    const requestId = (request.id as string) || request.headers['x-request-id']?.toString() || 'unknown';
    const response: HttpErrorResponse = {
      statusCode: 404,
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`,
      code: 'ROUTE_NOT_FOUND',
      requestId,
      timestamp: new Date().toISOString(),
    };
    return reply.status(404).send(response);
  });
}

export default fp(errorHandlerPlugin, {
  name: 'app-error-handler',
});
