#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { generateProject, validateProjectName } from './generator.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPackageVersion(): string {
  try {
    const pkgPath = path.resolve(__dirname, '../package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return pkg.version || '1.0.0';
    }
  } catch {
    // fallback
  }
  return '1.0.0';
}

function printHelp(): void {
  console.log(`
\x1b[1mcreate-odoo-app\x1b[0m v${getPackageVersion()}

Usage:
  npx create-odoo-app@latest <project-name> [options]
  npx create-odoo-app@latest . [options]

Options:
  --skip-install    Skip installing dependencies with pnpm
  --skip-git        Skip initializing a new Git repository
  --with-infra      Run "docker compose up -d" after install (opt-in; skipped
                     automatically with --skip-install)
  -h, --help        Display this help message
  -v, --version     Display package version

Examples:
  npx create-odoo-app my-app
  npx create-odoo-app my-app --skip-install
  npx create-odoo-app my-app --with-infra
  npx create-odoo-app .
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }

  if (args.includes('-v') || args.includes('--version')) {
    console.log(`v${getPackageVersion()}`);
    process.exit(0);
  }

  // Parse positional and flag arguments
  let projectName = '';
  const skipInstall = args.includes('--skip-install');
  const skipGit = args.includes('--skip-git');
  const withInfra = args.includes('--with-infra');

  for (const arg of args) {
    if (!arg.startsWith('-') && !projectName) {
      projectName = arg;
    }
  }

  if (!projectName) {
    logger.error('Please specify a project directory name.');
    console.log('  npx create-odoo-app <project-name>\n');
    process.exit(1);
  }

  const validation = validateProjectName(projectName);
  if (!validation.valid) {
    logger.error(validation.error || 'Invalid project name.');
    process.exit(1);
  }

  logger.header('create-odoo-app');

  try {
    const result = await generateProject({
      projectName,
      skipInstall,
      skipGit,
      withInfra,
      templateDir: path.resolve(__dirname, '..'),
    });

    if (!result.success) {
      logger.error(result.error || 'Project generation failed.');
      process.exit(1);
    }

    // When scaffolding into the current directory there is nothing to cd into.
    const cdStep = projectName === '.' ? '' : `  \x1b[36mcd ${result.projectName}\x1b[0m\n`;

    console.log(`
\x1b[32m✔ Project created successfully!\x1b[0m

Next steps:

${cdStep}${skipInstall ? '  \x1b[36mpnpm install\x1b[0m\n' : ''}${result.infraStarted ? '' : '  \x1b[36mpnpm infra:up\x1b[0m\n'}  \x1b[36mpnpm db:migrate\x1b[0m
  \x1b[36mpnpm db:seed\x1b[0m
  \x1b[36mpnpm dev\x1b[0m
`);

    const rootPassword = result.generatedSecrets?.INITIAL_ROOT_PASSWORD;
    if (rootPassword) {
      console.log(`\x1b[33m⚠ Save these now — they are written to .env and shown only once:\x1b[0m

  Root account:  \x1b[1m${process.env.INITIAL_ROOT_EMAIL || 'root@example.com'}\x1b[0m
  Root password: \x1b[1m${rootPassword}\x1b[0m

  A unique SESSION_SECRET was generated for this project as well.
  .env is git-ignored; keep it out of version control.
`);
    }
  } catch (err: unknown) {
    logger.error(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

main().catch((err) => {
  logger.error(`Unexpected error: ${err.message || String(err)}`);
  process.exit(1);
});
