import fs from 'node:fs';
import path from 'node:path';

/**
 * Patterns and file names to strictly ignore when copying templates.
 * Guarantees zero leakage of machine-specific, temporary, or private files.
 */
export const TEMPLATE_IGNORES = [
  // Version control & IDE
  '.git',
  '.github',
  '.idea',
  '.vscode',
  '.DS_Store',
  'Thumbs.db',
  '.npmignore',

  // Build and dependency outputs
  'node_modules',
  'dist',
  '.next',
  '.turbo',
  'coverage',
  '.drizzle',

  // Secrets & local environment files
  '.env',
  '.env.local',
  '.env.production',
  '.env.test',

  // Development logs and scratch files
  '*.log',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  'pnpm-debug.log*',
  'brain',
  'implementation_plan.md',
  'walkthrough.md',
  '.system_generated',

  // Scripts that develop and publish create-odoo-app itself, not a scaffolded app.
  // Their package.json script entries are already stripped in transformProjectMetadata,
  // but the files were still being copied — dead weight at best, and
  // security-audit.test.ts actively breaks `pnpm test` in every generated project: it
  // shells out to `git ls-files` expecting *this* repo's own git history, and asserts
  // against create-odoo-app's own tracked-file set and identity, neither of which mean
  // anything once renamed and re-scaffolded.
  'security-audit.ts',
  'security-audit.test.ts',
  'verify-release.ts',
  'smoke-test.ts',
  'dogfood-test.ts',
];

export function shouldIgnore(filePath: string, baseDir: string): boolean {
  const relative = path.relative(baseDir, filePath).replace(/\\/g, '/');
  const segments = relative.split('/');
  const fileName = segments[segments.length - 1];

  for (const pattern of TEMPLATE_IGNORES) {
    if (pattern.startsWith('*.')) {
      const ext = pattern.slice(1);
      if (fileName.endsWith(ext)) return true;
    } else if (segments.includes(pattern) || fileName === pattern) {
      return true;
    }
  }

  return false;
}

/**
 * Recursively copies a directory while applying the ignore filter.
 */
export async function copyDirectory(src: string, dest: string): Promise<void> {
  const entries = await fs.promises.readdir(src, { withFileTypes: true });

  await fs.promises.mkdir(dest, { recursive: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (shouldIgnore(srcPath, src)) {
      continue;
    }

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

/**
 * Safely replaces string patterns inside a text file.
 */
export async function replaceInFile(
  filePath: string,
  search: string | RegExp,
  replacement: string
): Promise<boolean> {
  if (!fs.existsSync(filePath)) return false;

  const content = await fs.promises.readFile(filePath, 'utf-8');
  const updated = content.replace(search, replacement);

  if (content !== updated) {
    await fs.promises.writeFile(filePath, updated, 'utf-8');
    return true;
  }

  return false;
}
