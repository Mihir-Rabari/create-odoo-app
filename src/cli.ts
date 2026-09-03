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

import { runInteractivePrompts } from './prompts.js';

function printHelp(): void {
  console.log(`
\x1b[1mcreate-odoo-app\x1b[0m v${getPackageVersion()}

Usage:
  npx create-odoo-app@latest [project-name] [options]
  npx create-odoo-app@latest . [options]

Options:
  -y, --yes         Skip interactive prompts and use defaults
  --theme <name>    UI Theme palette (neutral, zinc, violet, rose)
  --skip-install    Skip installing dependencies with pnpm
  --skip-git        Skip initializing a new Git repository
  --with-infra      Run "docker compose up -d" after install
  -h, --help        Display this help message
  -v, --version     Display package version

Examples:
  npx create-odoo-app
  npx create-odoo-app my-app
  npx create-odoo-app my-app --yes
  npx create-odoo-app my-app --skip-install
  npx create-odoo-app .
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('-v') || args.includes('--version')) {
    console.log(`v${getPackageVersion()}`);
    process.exit(0);
  }

  // Parse positional and flag arguments
  let positionalName = '';
  const nonInteractive = args.includes('-y') || args.includes('--yes');
  const hasSkipInstall = args.includes('--skip-install');
  const hasSkipGit = args.includes('--skip-git');
  const hasWithInfra = args.includes('--with-infra');

  const validThemes = ['neutral', 'zinc', 'violet', 'rose'] as const;
  type Theme = (typeof validThemes)[number];
  let themeFlag: Theme | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--theme') {
      const value = args[i + 1];
      if (!value || !(validThemes as readonly string[]).includes(value)) {
        logger.error(
          `Invalid --theme value "${value ?? ''}". Expected one of: ${validThemes.join(', ')}.`
        );
        process.exit(1);
      }
      themeFlag = value as Theme;
      i++; // consume the value so it isn't mistaken for the positional project name
      continue;
    }
    if (!arg.startsWith('-') && !positionalName) {
      positionalName = arg;
    }
  }

  const isInteractive = Boolean(process.stdout.isTTY) && !nonInteractive;

  let projectName = positionalName;
  let skipInstall = hasSkipInstall;
  let skipGit = hasSkipGit;
  let withInfra = hasWithInfra;
  let theme: Theme = themeFlag ?? 'neutral';

  if (isInteractive && (!positionalName || !nonInteractive)) {
    const promptResult = await runInteractivePrompts(positionalName || undefined, {
      skipInstall: hasSkipInstall ? true : undefined,
      skipGit: hasSkipGit ? true : undefined,
      withInfra: hasWithInfra ? true : undefined,
    });

    if (!promptResult) {
      process.exit(0);
    }

    projectName = promptResult.projectName;
    theme = promptResult.theme;
    skipInstall = !promptResult.installDeps;
    skipGit = !promptResult.initGit;
    withInfra = promptResult.startInfra;
  }

  if (!projectName) {
    projectName = 'my-odoo-app';
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
      theme,
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
