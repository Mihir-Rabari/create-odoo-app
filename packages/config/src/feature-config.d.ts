/**
 * Optional Feature & Infrastructure Integration Toggles
 *
 * Developers can enable/disable capabilities here without breaking runtime stability.
 */
export declare const FeatureConfig: {
    /**
     * Swagger / OpenAPI Interactive Documentation (/api/docs)
     */
    readonly enableSwagger: true;
    /**
     * Prometheus Metrics Exporter (/metrics)
     */
    readonly enableMetrics: true;
    /**
     * CORS header processing
     */
    readonly enableCors: true;
    /**
     * Fastify rate-limiting middleware
     */
    readonly enableRateLimiting: true;
    /**
     * S3 / MinIO Object Storage integration
     */
    readonly enableStorage: true;
    /**
     * Redis session caching & pub/sub foundation
     */
    readonly enableRedis: true;
    /**
     * Transactional email provider integration (e.g. Resend)
     */
    readonly enableEmail: false;
};
export type FeatureConfigType = typeof FeatureConfig;
//# sourceMappingURL=feature-config.d.ts.map