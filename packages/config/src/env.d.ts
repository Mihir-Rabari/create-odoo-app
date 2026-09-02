import { z } from 'zod';
/**
 * Zod Schema for Environment Variables
 */
export declare const envSchema: z.ZodObject<{
    APP_NAME: z.ZodDefault<z.ZodString>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "test", "production"]>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["fatal", "error", "warn", "info", "debug", "trace", "silent"]>>;
    WEB_URL: z.ZodDefault<z.ZodString>;
    API_URL: z.ZodDefault<z.ZodString>;
    PORT: z.ZodDefault<z.ZodNumber>;
    HOST: z.ZodDefault<z.ZodString>;
    DATABASE_URL: z.ZodDefault<z.ZodString>;
    DATABASE_HOST: z.ZodDefault<z.ZodString>;
    DATABASE_PORT: z.ZodDefault<z.ZodNumber>;
    DATABASE_USER: z.ZodDefault<z.ZodString>;
    DATABASE_PASSWORD: z.ZodDefault<z.ZodString>;
    DATABASE_NAME: z.ZodDefault<z.ZodString>;
    DATABASE_SSL: z.ZodDefault<z.ZodEffects<z.ZodUnion<[z.ZodEnum<["true", "false"]>, z.ZodBoolean]>, boolean, boolean | "true" | "false">>;
    REDIS_URL: z.ZodDefault<z.ZodString>;
    REDIS_HOST: z.ZodDefault<z.ZodString>;
    REDIS_PORT: z.ZodDefault<z.ZodNumber>;
    REDIS_PASSWORD: z.ZodOptional<z.ZodString>;
    S3_ENDPOINT: z.ZodDefault<z.ZodString>;
    S3_PORT: z.ZodDefault<z.ZodNumber>;
    S3_REGION: z.ZodDefault<z.ZodString>;
    S3_ACCESS_KEY: z.ZodDefault<z.ZodString>;
    S3_SECRET_KEY: z.ZodDefault<z.ZodString>;
    S3_BUCKET: z.ZodDefault<z.ZodString>;
    S3_USE_SSL: z.ZodDefault<z.ZodEffects<z.ZodUnion<[z.ZodEnum<["true", "false"]>, z.ZodBoolean]>, boolean, boolean | "true" | "false">>;
    S3_FORCE_PATH_STYLE: z.ZodDefault<z.ZodEffects<z.ZodUnion<[z.ZodEnum<["true", "false"]>, z.ZodBoolean]>, boolean, boolean | "true" | "false">>;
    RESEND_API_KEY: z.ZodOptional<z.ZodString>;
    RESEND_FROM: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    SESSION_SECRET: z.ZodDefault<z.ZodString>;
    SESSION_COOKIE_NAME: z.ZodDefault<z.ZodString>;
    SESSION_TTL_SECONDS: z.ZodDefault<z.ZodNumber>;
    INITIAL_ROOT_EMAIL: z.ZodDefault<z.ZodString>;
    INITIAL_ROOT_PASSWORD: z.ZodDefault<z.ZodString>;
    PROMETHEUS_URL: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    APP_NAME: string;
    NODE_ENV: "development" | "test" | "production";
    LOG_LEVEL: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent";
    WEB_URL: string;
    API_URL: string;
    PORT: number;
    HOST: string;
    DATABASE_URL: string;
    DATABASE_HOST: string;
    DATABASE_PORT: number;
    DATABASE_USER: string;
    DATABASE_PASSWORD: string;
    DATABASE_NAME: string;
    DATABASE_SSL: boolean;
    REDIS_URL: string;
    REDIS_HOST: string;
    REDIS_PORT: number;
    S3_ENDPOINT: string;
    S3_PORT: number;
    S3_REGION: string;
    S3_ACCESS_KEY: string;
    S3_SECRET_KEY: string;
    S3_BUCKET: string;
    S3_USE_SSL: boolean;
    S3_FORCE_PATH_STYLE: boolean;
    RESEND_FROM: string;
    SESSION_SECRET: string;
    SESSION_COOKIE_NAME: string;
    SESSION_TTL_SECONDS: number;
    INITIAL_ROOT_EMAIL: string;
    INITIAL_ROOT_PASSWORD: string;
    PROMETHEUS_URL: string;
    REDIS_PASSWORD?: string | undefined;
    RESEND_API_KEY?: string | undefined;
}, {
    APP_NAME?: string | undefined;
    NODE_ENV?: "development" | "test" | "production" | undefined;
    LOG_LEVEL?: "fatal" | "error" | "warn" | "info" | "debug" | "trace" | "silent" | undefined;
    WEB_URL?: string | undefined;
    API_URL?: string | undefined;
    PORT?: number | undefined;
    HOST?: string | undefined;
    DATABASE_URL?: string | undefined;
    DATABASE_HOST?: string | undefined;
    DATABASE_PORT?: number | undefined;
    DATABASE_USER?: string | undefined;
    DATABASE_PASSWORD?: string | undefined;
    DATABASE_NAME?: string | undefined;
    DATABASE_SSL?: boolean | "true" | "false" | undefined;
    REDIS_URL?: string | undefined;
    REDIS_HOST?: string | undefined;
    REDIS_PORT?: number | undefined;
    REDIS_PASSWORD?: string | undefined;
    S3_ENDPOINT?: string | undefined;
    S3_PORT?: number | undefined;
    S3_REGION?: string | undefined;
    S3_ACCESS_KEY?: string | undefined;
    S3_SECRET_KEY?: string | undefined;
    S3_BUCKET?: string | undefined;
    S3_USE_SSL?: boolean | "true" | "false" | undefined;
    S3_FORCE_PATH_STYLE?: boolean | "true" | "false" | undefined;
    RESEND_API_KEY?: string | undefined;
    RESEND_FROM?: string | undefined;
    SESSION_SECRET?: string | undefined;
    SESSION_COOKIE_NAME?: string | undefined;
    SESSION_TTL_SECONDS?: number | undefined;
    INITIAL_ROOT_EMAIL?: string | undefined;
    INITIAL_ROOT_PASSWORD?: string | undefined;
    PROMETHEUS_URL?: string | undefined;
}>;
export type Env = z.infer<typeof envSchema>;
/**
 * Validate and retrieve typed environment variables
 */
export declare function getEnv(overrideEnv?: Record<string, unknown>): Env;
/**
 * Reset cached environment (useful in tests)
 */
export declare function resetEnvCache(): void;
//# sourceMappingURL=env.d.ts.map