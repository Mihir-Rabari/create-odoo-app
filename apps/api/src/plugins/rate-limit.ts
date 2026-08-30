import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';

async function rateLimitPlugin(fastify: FastifyInstance) {
  const config = fastify.appConfig;

  await fastify.register(rateLimit, {
    max: config.security.rateLimitMax,
    timeWindow: config.security.rateLimitTimeWindow,
    allowList: ['127.0.0.1', 'localhost'],
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.after}`,
      code: 'RATE_LIMIT_EXCEEDED',
    }),
  });
}

export default fp(rateLimitPlugin, {
  name: 'app-rate-limit',
  dependencies: ['app-config'],
});
