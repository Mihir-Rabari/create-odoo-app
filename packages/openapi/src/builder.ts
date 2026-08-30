import { AppConfig } from '@packages/config';
import { ApiTags } from './tags.js';

export interface OpenApiConfigOptions {
  title?: string;
  description?: string;
  version?: string;
  hostUrl?: string;
}

export function getOpenApiSpecification(options?: OpenApiConfigOptions) {
  return {
    openapi: '3.0.3',
    info: {
      title: options?.title || AppConfig.name,
      description: options?.description || AppConfig.description,
      version: options?.version || AppConfig.version,
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: options?.hostUrl || '/',
        description: 'Current Environment Server',
      },
    ],
    tags: Object.values(ApiTags),
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http' as const,
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Standard Bearer JWT Token',
        },
      },
    },
  };
}
