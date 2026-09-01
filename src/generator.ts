import fs from 'node:fs';
import path from 'node:path';
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
  skipInfra?: boolean;
}

export interface GeneratorResult {
  success: boolean;
  projectName: string;
  humanTitle: string;
  targetDir: string;
  error?: string;
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
  if (fs.existsSync(targetDir) && rawName !== '.') {
    const existingFiles = await fs.promises.readdir(targetDir);
    if (existingFiles.length > 0) {
      return {
        success: false,
        projectName: packageName,
        humanTitle,
        targetDir,
        error: `Target directory "${targetDir}" already exists and is not empty.`,
      };
    }
  } else if (!fs.existsSync(targetDir)) {
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
  if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
    await fs.promises.copyFile(envExamplePath, envPath);
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
      execSync('pnpm install', { cwd: targetDir, stdio: 'inherit' });
      logger.success('Dependencies installed successfully.');
    } catch {
      logger.warn('pnpm install failed or pnpm not installed. Please run "pnpm install" manually.');
    }
  } else {
    logger.info('Skipping dependency installation (--skip-install).');
  }

  logger.step(6, 6, 'Finalizing application structure...');
  logger.success(`Project ${humanTitle} is ready!`);

  return {
    success: true,
    projectName: packageName,
    humanTitle,
    targetDir,
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
    // Remove generator-specific binary & publish entries from generated project
    delete pkg.bin;
    delete pkg.files;
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
* **Node.js**: \`v20.x\` or \`v22.x\` / \`v24.x\`
* **pnpm**: \`v10.x\` or \`v11.x\`
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
