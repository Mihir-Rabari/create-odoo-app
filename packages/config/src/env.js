import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
// Automatically load .env file if present
function loadEnvFile() {
    const rootEnv = path.resolve(process.cwd(), '.env');
    const parentEnv = path.resolve(process.cwd(), '../../.env');
    if (fs.existsSync(rootEnv)) {
        dotenv.config({ path: rootEnv });
    }
    else if (fs.existsSync(parentEnv)) {
        dotenv.config({ path: parentEnv });
    }
    else {
        dotenv.config();
    }
}
loadEnvFile();
/**
 * Zod Schema for Environment Variables
 */
export const envSchema = z.object({
    // Application
    APP_NAME: z.string().default('production-starter'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    // Service URLs
    WEB_URL: z.string().url().default('http://localhost:3000'),
    API_URL: z.string().url().default('http://localhost:3001'),
    PORT: z.coerce.number().int().positive().default(3001),
    HOST: z.string().default('0.0.0.0'),
    // PostgreSQL Database
    DATABASE_URL: z.string().min(1).default('postgres://postgres:postgres@localhost:5432/app_db'),
    DATABASE_HOST: z.string().default('localhost'),
    DATABASE_PORT: z.coerce.number().int().positive().default(5432),
    DATABASE_USER: z.string().default('postgres'),
    DATABASE_PASSWORD: z.string().default('postgres'),
    DATABASE_NAME: z.string().default('app_db'),
    DATABASE_SSL: z
        .enum(['true', 'false'])
        .or(z.boolean())
        .transform((val) => val === true || val === 'true')
        .default(false),
    // Redis
    REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().int().positive().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    // MinIO / S3 Object Storage
    S3_ENDPOINT: z.string().default('http://localhost:9000'),
    S3_PORT: z.coerce.number().int().positive().default(9000),
    S3_REGION: z.string().default('us-east-1'),
    S3_ACCESS_KEY: z.string().default('minioadmin'),
    S3_SECRET_KEY: z.string().default('minioadmin'),
    S3_BUCKET: z.string().default('app-uploads'),
    S3_USE_SSL: z
        .enum(['true', 'false'])
        .or(z.boolean())
        .transform((val) => val === true || val === 'true')
        .default(false),
    S3_FORCE_PATH_STYLE: z
        .enum(['true', 'false'])
        .or(z.boolean())
        .transform((val) => val === true || val === 'true')
        .default(true),
    // Optional Providers
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM: z.string().email().optional().default('noreply@example.com'),
    // Authentication & Sessions (Phase 2)
    SESSION_SECRET: z.string().min(16).default('a_very_secret_32_character_string_for_session_cookies_change_in_prod'),
    SESSION_COOKIE_NAME: z.string().default('app_session'),
    SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604800), // 7 days
    // Root Account Initial Bootstrap (Phase 2)
    INITIAL_ROOT_EMAIL: z.string().email().default('root@example.com'),
    INITIAL_ROOT_PASSWORD: z.string().min(8).default('RootSecurePass123!'),
    // Observability
    PROMETHEUS_URL: z.string().default('http://localhost:9090'),
});
let cachedEnv = null;
/**
 * Validate and retrieve typed environment variables
 */
export function getEnv(overrideEnv) {
    if (cachedEnv && !overrideEnv) {
        return cachedEnv;
    }
    const raw = overrideEnv || process.env;
    const parsed = envSchema.safeParse(raw);
    if (!parsed.success) {
        const formatted = parsed.error.format();
        const errorDetails = Object.entries(formatted)
            .filter(([k]) => k !== '_errors')
            .map(([k, v]) => `  ${k}: ${v._errors.join(', ')}`)
            .join('\n');
        const errorMessage = `[Config] Environment validation failed:\n${errorDetails}`;
        // In test environment, throw descriptive error; in production/development, log and throw
        throw new Error(errorMessage);
    }
    if (!overrideEnv) {
        cachedEnv = parsed.data;
    }
    return parsed.data;
}
/**
 * Reset cached environment (useful in tests)
 */
export function resetEnvCache() {
    cachedEnv = null;
}
//# sourceMappingURL=env.js.map