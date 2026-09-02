/**
 * Application Constants and Compile-Time Configuration
 *
 * Non-sensitive application configuration that is baked into the code
 * and separated strictly from runtime secrets/environment variables.
 */
export declare const AppConfig: {
    readonly name: "Production Starter Monorepo";
    readonly slug: "production-starter-monorepo";
    readonly description: "Production-ready full-stack starter with Fastify, Next.js, PostgreSQL, Redis, and MinIO";
    readonly version: "1.0.0";
    readonly apiVersion: "v1";
    readonly apiPrefix: "/api";
    readonly pagination: {
        readonly defaultLimit: 20;
        readonly maxLimit: 100;
        readonly defaultPage: 1;
    };
    readonly security: {
        readonly maxRequestBodySize: number;
        readonly rateLimitMax: 100;
        readonly rateLimitTimeWindow: number;
    };
    readonly features: {
        readonly enableSwagger: true;
        readonly enableMetrics: true;
        readonly enableCors: true;
        readonly enableRateLimiting: true;
        readonly enableStorage: true;
        readonly enableRedis: true;
        readonly enableEmail: false;
    };
    readonly auth: {
        readonly registrationEnabled: true;
        readonly defaultIdentity: "EXTERNAL_USER";
        readonly sessionTtlSeconds: number;
        readonly cookieName: "app_session";
        readonly minPasswordLength: 8;
    };
    readonly iam: {
        readonly rootEnabled: true;
        readonly defaultExternalUserPolicy: "ExternalUserPolicy";
        readonly administratorPolicy: "AdministratorPolicy";
        readonly adminRoleName: "ADMIN";
    };
};
export type AppConfigType = typeof AppConfig;
//# sourceMappingURL=app-config.d.ts.map