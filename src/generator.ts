import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { copyDirectory, replaceInFile } from './utils/fs.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface GeneratorOptions {
  projectName: string;
  targetDir?: string;
  templateDir?: string;
  skipInstall?: boolean;
  skipGit?: boolean;
  withInfra?: boolean;
}

export interface GeneratorResult {
  success: boolean;
  projectName: string;
  humanTitle: string;
  targetDir: string;
  error?: string;
  /** Per-project secrets written into `.env`, keyed by variable name. */
  generatedSecrets?: Record<string, string>;
  /** True when `docker compose up -d` was run and succeeded (only possible with --with-infra). */
  infraStarted?: boolean;
}

const RESERVED_NAMES = new Set([
  'node_modules',
  'favicon.ico',
  'package.json',
  'dist',
  'build',
  'src',
  'app',
  'public',
  '.git',
]);

export const DEFAULT_GITIGNORE_CONTENT = `# Dependencies
node_modules/
.pnpm-store/

# Environment Variables & Secrets
.env
.env.*
.env.local
.env.development.local
.env.test.local
.env.production.local
!.env.example

# Build Outputs & Bundles
dist/
build/
.next/
out/
*.tsbuildinfo

# Coverage & Testing
coverage/
.nyc_output/
*.lcov

# Logs & Diagnostics
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# IDE & Editors
.idea/
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# OS & File System Artifacts
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Docker Persistent Volumes
postgres-data/
minio-data/
redis-data/
prometheus-data/
grafana-data/
.docker/
docker-data/

# Temporary / Scratch Files
tmp/
temp/
*.tmp
*.tgz
`;

/**
 * Environment variables that must be unique per generated project.
 *
 * `.env.example` carries public placeholder values so a clone boots against Docker
 * Compose immediately. Copying those verbatim into a real `.env` would give every
 * project on npm the same session secret and root password, so each one is replaced
 * with freshly generated randomness at scaffold time.
 */
const GENERATED_SECRETS: Record<string, () => string> = {
  SESSION_SECRET: () => crypto.randomBytes(48).toString('base64url'),
  INITIAL_ROOT_PASSWORD: () => `${crypto.randomBytes(18).toString('base64url')}Aa1!`,
};

/**
 * Rewrites the secret-bearing lines of an `.env` file with per-project values.
 * Returns the new contents plus the generated values, so the CLI can show the
 * root password once — it is not recoverable from the hash afterwards.
 */
export function applyGeneratedSecrets(envContents: string): {
  contents: string;
  generated: Record<string, string>;
} {
  const generated: Record<string, string> = {};
  let contents = envContents;

  for (const [key, generate] of Object.entries(GENERATED_SECRETS)) {
    const value = generate();
    const pattern = new RegExp(`^${key}=.*$`, 'm');

    if (pattern.test(contents)) {
      contents = contents.replace(pattern, `${key}=${value}`);
    } else {
      contents = `${contents.replace(/\s*$/, '')}\n${key}=${value}\n`;
    }

    generated[key] = value;
  }

  return { contents, generated };
}

/**
 * Validates the requested project name against npm naming rules and path security.
 */
export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name cannot be empty.' };
  }

  const trimmed = name.trim();

  // Allow '.' for current directory
  if (trimmed === '.') {
    return { valid: true };
  }

  // Reject path traversal attempts
  if (trimmed.includes('..') || trimmed.includes('/') || trimmed.includes('\\')) {
    return { valid: false, error: 'Project name cannot contain path separators or "..".' };
  }

  // Check npm naming rules
  if (!/^[a-z0-9-_]+$/i.test(trimmed)) {
    return {
      valid: false,
      error: 'Project name may only contain alphanumeric characters, hyphens, and underscores.',
    };
  }

  if (RESERVED_NAMES.has(trimmed.toLowerCase())) {
    return { valid: false, error: `"${trimmed}" is a reserved project name. Please choose another.` };
  }

  return { valid: true };
}

/**
 * Converts a slug/package name into a clean, human-readable title.
 * e.g. "campus-connect" -> "Campus Connect", "my_app" -> "My App"
 */
export function toHumanTitle(slug: string): string {
  if (slug === '.') {
    return 'My Application';
  }

  return slug
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Normalizes project slug to lowercase package name
 */
export function toPackageName(name: string): string {
  if (name === '.') {
    const currentDirName = path.basename(process.cwd());
    return currentDirName.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  }
  return name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
}

/**
 * Core project generation engine.
 */
export async function generateProject(options: GeneratorOptions): Promise<GeneratorResult> {
  const {
    projectName: rawName,
    skipInstall = false,
    skipGit = false,
    withInfra = false,
  } = options;

  // 1. Validate Project Name
  const validation = validateProjectName(rawName);
  if (!validation.valid) {
    return {
      success: false,
      projectName: rawName,
      humanTitle: '',
      targetDir: '',
      error: validation.error,
    };
  }

  const packageName = toPackageName(rawName);
  const humanTitle = toHumanTitle(rawName === '.' ? packageName : rawName);

  // 2. Resolve Target and Template Directories
  const targetDir = options.targetDir
    ? path.resolve(options.targetDir)
    : rawName === '.'
    ? process.cwd()
    : path.resolve(process.cwd(), rawName);

  const templateDir = options.templateDir
    ? path.resolve(options.templateDir)
    : path.resolve(__dirname, '..');

  logger.info(`Creating a new full-stack application in ${targetDir}...`);

  // 3. Prepare Target Directory
  //
  // The emptiness check applies to `.` as well. Previously it was skipped for the
  // current-directory case, so running the generator in a directory that already held
  // work would overwrite files in place with no warning and nothing to undo it.
  if (fs.existsSync(targetDir)) {
    const existingFiles = (await fs.promises.readdir(targetDir)).filter(
      // A bare `git init`ed directory is a reasonable starting point.
      (entry) => entry !== '.git'
    );

    if (existingFiles.length > 0) {
      return {
        success: false,
        projectName: packageName,
        humanTitle,
        targetDir,
        error:
          rawName === '.'
            ? `The current directory "${targetDir}" is not empty. Scaffolding here would overwrite existing files.`
            : `Target directory "${targetDir}" already exists and is not empty.`,
      };
    }
  } else {
    await fs.promises.mkdir(targetDir, { recursive: true });
  }

  // 4. Copy Template Files
  logger.step(1, 6, 'Scaffolding repository structure...');
  await copyDirectory(templateDir, targetDir);
  logger.success('Repository scaffolded.');

  // 5. Transform Project Metadata
  logger.step(2, 6, 'Configuring project metadata and configuration...');
  await transformProjectMetadata(targetDir, packageName, humanTitle);
  logger.success('Project metadata transformed.');

  // 6. Setup Environment & Ignore Files
  logger.step(3, 6, 'Creating local environment template & .gitignore...');
  const envExamplePath = path.join(targetDir, '.env.example');
  const envPath = path.join(targetDir, '.env');
  let generatedSecrets: Record<string, string> = {};
  if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
    const template = await fs.promises.readFile(envExamplePath, 'utf-8');
    const { contents, generated } = applyGeneratedSecrets(template);
    generatedSecrets = generated;
    await fs.promises.writeFile(envPath, contents, 'utf-8');
  }

  // Ensure preconfigured .gitignore is always present in generated application
  const gitignorePath = path.join(targetDir, '.gitignore');
  await fs.promises.writeFile(gitignorePath, DEFAULT_GITIGNORE_CONTENT, 'utf-8');

  // Remove any stray .npmignore from generated project
  const npmignorePath = path.join(targetDir, '.npmignore');
  if (fs.existsSync(npmignorePath)) {
    await fs.promises.unlink(npmignorePath);
  }


  logger.success('Environment & .gitignore configured (.env.example, .env, .gitignore).');

  // 7. Initialize Git (optional)
  if (!skipGit) {
    logger.step(4, 6, 'Initializing Git repository...');
    try {
      execSync('git init', { cwd: targetDir, stdio: 'ignore' });
      logger.success('Git repository initialized.');
    } catch {
      logger.warn('Could not initialize Git repository (git command not found or failed).');
    }
  } else {
    logger.info('Skipping Git initialization (--skip-git).');
  }

  // 8. Install Dependencies (optional)
  if (!skipInstall) {
    logger.step(5, 6, 'Installing dependencies with pnpm...');
    try {
      // No --ignore-scripts: pnpm blocks postinstall scripts by default and runs them
      // only for the packages listed under `onlyBuiltDependencies` in
      // pnpm-workspace.yaml. Skipping them outright would leave the Next.js SWC binary
      // and esbuild unbuilt, so `pnpm dev` would fail immediately after scaffolding.
      execSync('pnpm install', { cwd: targetDir, stdio: 'inherit' });
      logger.success('Dependencies installed successfully.');
    } catch {
      logger.warn('pnpm install failed or pnpm not installed. Please run "pnpm install" manually.');
    }
  } else {
    logger.info('Skipping dependency installation (--skip-install).');
  }

  // 9. Start Docker Compose infrastructure (optional, opt-in)
  //
  // Only attempted when dependencies were actually installed: without them, the
  // docker-compose.yml env wiring / dependent tooling may not be ready. Failures here
  // are never fatal — a working scaffold with a warning is strictly better than
  // reporting failure for a project that was otherwise generated successfully.
  let infraStarted = false;
  if (withInfra && !skipInstall) {
    logger.info('Starting local infrastructure with Docker Compose (--with-infra)...');
    try {
      execSync('docker compose up -d', { cwd: targetDir, stdio: 'inherit' });
      logger.success('Docker Compose infrastructure started.');
      infraStarted = true;
    } catch {
      logger.warn(
        'Could not start Docker Compose infrastructure (Docker not installed, daemon not running, or command failed). Run "pnpm infra:up" manually once Docker is available.'
      );
    }
  } else if (withInfra && skipInstall) {
    logger.info('Skipping Docker Compose startup because dependencies were not installed (--skip-install).');
  }

  logger.step(6, 6, 'Finalizing application structure...');
  logger.success(`Project ${humanTitle} is ready!`);

  return {
    success: true,
    projectName: packageName,
    humanTitle,
    targetDir,
    generatedSecrets,
    infraStarted,
  };
}

/**
 * Transforms all project-specific metadata in the generated target directory.
 */
export async function transformProjectMetadata(
  targetDir: string,
  packageName: string,
  humanTitle: string
): Promise<void> {
  // A. Root package.json
  const rootPkgPath = path.join(targetDir, 'package.json');
  if (fs.existsSync(rootPkgPath)) {
    const pkgContent = await fs.promises.readFile(rootPkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);

    pkg.name = packageName;
    pkg.description = `${humanTitle} - Full-Stack Monorepo Application`;
    pkg.version = '0.1.0';
    pkg.private = true;

    // Remove generator-specific binary & publish entries from generated project
    delete pkg.bin;
    delete pkg.files;

    // Strip the generator's own identity. Left in place, every scaffolded application
    // would point its issue tracker, homepage and authorship at this repository.
    delete pkg.repository;
    delete pkg.bugs;
    delete pkg.homepage;
    delete pkg.author;
    delete pkg.license;
    delete pkg.scripts['build:cli'];
    delete pkg.scripts['verify:release'];
    delete pkg.scripts['release:check'];
    delete pkg.scripts['release:pack'];
    delete pkg.scripts['test:smoke'];
    delete pkg.scripts['test:dogfood'];
    delete pkg.scripts['audit:security'];

    // Tailor scripts for generated monorepo application
    pkg.scripts = {
      ...pkg.scripts,
      build: 'pnpm --filter "@packages/*" build && pnpm --filter "@app/*" build',
      typecheck: 'pnpm --filter "@packages/*" build && pnpm --recursive typecheck',
      verify: 'pnpm skills:check && pnpm skills:lint && pnpm lint && pnpm typecheck && pnpm test && pnpm build',
      setup: 'tsx scripts/setup.ts',
    };

    await fs.promises.writeFile(rootPkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
  }

  // B. packages/config/src/app-config.ts
  const appConfigPath = path.join(targetDir, 'packages/config/src/app-config.ts');
  if (fs.existsSync(appConfigPath)) {
    await replaceInFile(
      appConfigPath,
      /name:\s*'[^']*'/,
      `name: '${humanTitle}'`
    );
    await replaceInFile(
      appConfigPath,
      /slug:\s*'[^']*'/,
      `slug: '${packageName}'`
    );
  }

  // C. apps/web/src/app/layout.tsx
  const webLayoutPath = path.join(targetDir, 'apps/web/src/app/layout.tsx');
  if (fs.existsSync(webLayoutPath)) {
    await replaceInFile(
      webLayoutPath,
      /title:\s*'[^']*'/,
      `title: '${humanTitle}'`
    );
  }

  // D. apps/web/src/components/navbar.tsx
  const navbarPath = path.join(targetDir, 'apps/web/src/components/navbar.tsx');
  if (fs.existsSync(navbarPath)) {
    await replaceInFile(
      navbarPath,
      /<span>Production Starter<\/span>/,
      `<span>${humanTitle}</span>`
    );
  }

  // E. packages/openapi/src/builder.ts
  const openapiBuilderPath = path.join(targetDir, 'packages/openapi/src/builder.ts');
  if (fs.existsSync(openapiBuilderPath)) {
    await replaceInFile(
      openapiBuilderPath,
      /title:\s*'[^']*'/,
      `title: '${humanTitle} API'`
    );
  }

  // F. Tailored README.md
  const readmePath = path.join(targetDir, 'README.md');
  const readmeContent = `# ${humanTitle}

A full-stack application built with Next.js (App Router), Fastify, PostgreSQL (Drizzle ORM), Redis, S3-compatible storage, and a complete Identity & IAM Authorization System.

---

## 1. Quick Start

### Prerequisites
* **Node.js**: \`>=22.13.0\` (matches the \`engines\` field in package.json)
* **pnpm**: \`>=11.1.0\`
* **Docker & Docker Compose**: v2.x+ running on host

### Getting Started

\`\`\`bash
# 1. Install dependencies
pnpm install

# 2. Start local infrastructure (PostgreSQL, Redis, MinIO, Prometheus, Grafana)
pnpm infra:up

# 3. Apply database migrations & seed baseline IAM
pnpm db:migrate
pnpm db:seed

# 4. Start development servers
pnpm dev
\`\`\`

Your root account credentials were generated during scaffolding and written to
\`.env\` as \`INITIAL_ROOT_EMAIL\` / \`INITIAL_ROOT_PASSWORD\`. \`pnpm db:seed\` uses them to
bootstrap the ROOT identity.

---

## 1a. Before Deploying

\`.env\` is generated with a unique \`SESSION_SECRET\` and root password, but the
infrastructure credentials are still development defaults. The API refuses to start with
\`NODE_ENV=production\` while any of them remain, and will list exactly what to change.

* Replace \`DATABASE_PASSWORD\`, \`S3_ACCESS_KEY\`, \`S3_SECRET_KEY\` and set \`REDIS_PASSWORD\`.
* Set \`TRUST_PROXY\` if the API runs behind nginx, a load balancer, or Docker ingress.
  Leaving it unset makes every request appear to come from the proxy, which disables
  per-IP rate limiting.
* Set \`NEXT_PUBLIC_API_URL\` to the API origin the browser can reach.
* \`BIND_ADDRESS\` defaults to \`127.0.0.1\` so Docker services are not exposed to the
  network. Change it only deliberately.

---

## 2. Local Service Endpoints

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web** | [http://localhost:3000](http://localhost:3000) | Next.js UI |
| **Backend API** | [http://localhost:3001](http://localhost:3001) | Fastify HTTP Gateway |
| **OpenAPI Docs** | [http://localhost:3001/api/docs](http://localhost:3001/api/docs) | Interactive Swagger UI |
| **Grafana** | [http://localhost:3002](http://localhost:3002) | Observability Dashboards |
| **MinIO Console** | [http://localhost:9001](http://localhost:9001) | S3 Object Storage Browser |

---

## 3. Configuration System (\`packages/config\`)

Configure application behavior in \`packages/config/src/\`:
* \`app-config.ts\`: Application constants and metadata.
* \`auth-config.ts\`: Authentication settings (registration enabled, session TTL, cookie name).
* \`iam-config.ts\`: Declarative roles, groups, default policies, and baseline role-policy assignments.
* \`feature-config.ts\`: Feature toggles (email, realtime, storage, observability).

---

## 4. Development Scripts

| Command | Description |
| :--- | :--- |
| \`pnpm dev\` | Run web and API concurrently |
| \`pnpm dev:api\` | Run Fastify API in watch mode |
| \`pnpm dev:web\` | Run Next.js in development mode |
| \`pnpm build\` | Compile all packages and applications |
| \`pnpm typecheck\` | Run TypeScript verification across all packages |
| \`pnpm test\` | Run Vitest test suite |
| \`pnpm lint\` | Run linters across all packages |
| \`pnpm db:migrate\` | Apply pending Drizzle migrations |
| \`pnpm db:seed\` | Seed initial database records and bootstrap ROOT account |
| \`pnpm infra:up\` | Start Docker Compose infrastructure |
| \`pnpm infra:down\` | Stop Docker Compose infrastructure |
| \`pnpm health\` | Run infrastructure health check |
`;
  await fs.promises.writeFile(readmePath, readmeContent, 'utf-8');
}
