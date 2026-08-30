import { describe, it, expect } from 'vitest';
import { getOpenApiSpecification, ApiTags } from './index.js';

describe('OpenAPI Specification Builder', () => {
  it('should generate valid OpenAPI 3.0 configuration', () => {
    const doc = getOpenApiSpecification({
      title: 'Custom Test API',
      version: '2.0.0',
      description: 'API description for testing',
    });

    expect(doc.openapi).toBe('3.0.3');
    expect(doc.info.title).toBe('Custom Test API');
    expect(doc.info.version).toBe('2.0.0');
    expect(doc.info.description).toBe('API description for testing');
    expect(doc.tags?.length).toBeGreaterThan(0);
  });

  it('should include core system tags in taxonomy', () => {
    const tagNames = Object.values(ApiTags).map((t) => t.name);
    expect(tagNames).toContain('System');
    expect(tagNames).toContain('Health');
    expect(tagNames).toContain('Metrics');
  });
});
