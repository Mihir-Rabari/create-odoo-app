import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

interface SecurityViolation {
  file: string;
  category: string;
  description: string;
}

/**
 * Compiled output committed beside its TypeScript source shadows the source
 * at module-resolution time: both Vite and Node prefer a sibling `./x.js`
 * (or the `.d.ts` / `.js.map` / `.d.ts.map` that ships alongside it) over
 * the real `./x.ts`. This previously caused a confusing test failure where
 * a stale compiled `.js` was silently imported instead of the current
 * `.ts`. Detect any such tracked files under packages/*\/src so they can
 * never be re-introduced (e.g. via `git add -f`, which bypasses .gitignore).
 */
export const COMPILED_OUTPUT_BESIDE_SOURCE_PATTERN = /^packages\/[^/]+\/src\/.*\.(js|d\.ts|js\.map|d\.ts\.map)$/;

export function findCompiledOutputShadowingSource(trackedFiles: string[]): string[] {
  return trackedFiles.filter((f) => COMPILED_OUTPUT_BESIDE_SOURCE_PATTERN.test(f.replace(/\\/g, '/')));
}

/**
 * The root package.json's `files` array controls what actually ships to
 * npm. If it explicitly lists compiled artifacts under packages/*\/src
 * (rather than the .ts source itself, or the directory as a whole), those
 * artifacts would be published even though they should never exist there
 * in the first place.
 */
export function findCompiledOutputInPackageFilesArray(files: string[]): string[] {
  return files.filter((f) => COMPILED_OUTPUT_BESIDE_SOURCE_PATTERN.test(f.replace(/\\/g, '/')));
}

const SECRET_PATTERNS: { category: string; regex: RegExp; description: string }[] = [
  { category: 'OpenAI Secret Key', regex: /\bsk-[a-zA-Z0-9]{20,}\b/, description: 'Detected potential OpenAI API key' },
  { category: 'GitHub Token', regex: /\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{50,})\b/, description: 'Detected GitHub personal access token' },
  { category: 'npm Token', regex: /\bnpm_[a-zA-Z0-9]{36}\b/, description: 'Detected npm publish token' },
  { category: 'AWS Access Key', regex: /\bAKIA[0-9A-Z]{16}\b/, description: 'Detected AWS access key ID' },
  { category: 'Private Key', regex: /-----BEGIN\s+([A-Z\s]+)?PRIVATE KEY-----/, description: 'Detected private cryptographic key header' },
];

const FORBIDDEN_MACHINE_PATHS = [
  /file:\/\/\/[A-Z]:\//i,
  /[A-Z]:\\Projects\\/i,
  /[A-Z]:\\Users\\[a-zA-Z0-9_]+\\/i,
];

export async function runSecurityAudit(): Promise<void> {
  console.log('\x1b[35m=== Running Public Repository Security & Secrets Audit ===\x1b[0m\n');

  const violations: SecurityViolation[] = [];

  // 1. Audit Git Tracked Files
  let trackedFiles: string[] = [];
  try {
    const gitOutput = execSync('git ls-files', { cwd: rootDir, encoding: 'utf-8' });
    trackedFiles = gitOutput.split('\n').map((f) => f.trim()).filter(Boolean);
  } catch (err) {
    throw new Error('Failed to list git tracked files: ' + (err as Error).message);
  }

  for (const relPath of trackedFiles) {
    const fullPath = path.join(rootDir, relPath);

    // Forbidden tracked files
    if (relPath === '.env' || relPath.endsWith('.key') || relPath.endsWith('.tgz') || relPath.startsWith('brain/')) {
      violations.push({
        file: relPath,
        category: 'Forbidden Tracked File',
        description: 'Sensitive or temporary file should never be tracked by git',
      });
      continue;
    }

    if (!fs.existsSync(fullPath)) continue;

    const ext = path.extname(relPath).toLowerCase();
    const isTextFile = ['.ts', '.tsx', '.js', '.mjs', '.json', '.md', '.yml', '.yaml', '.sql', '.sh', '.ps1', '.cmd', '.env.example'].includes(ext);

    if (isTextFile) {
      const content = await fs.promises.readFile(fullPath, 'utf-8');

      // Check secret patterns
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(content)) {
          violations.push({
            file: relPath,
            category: pattern.category,
            description: pattern.description,
          });
        }
      }

      // Check hardcoded developer paths (excluding the audit script itself)
      if (relPath !== 'scripts/security-audit.ts' && relPath !== 'scripts\\security-audit.ts') {
        for (const pathRegex of FORBIDDEN_MACHINE_PATHS) {
          if (pathRegex.test(content)) {
            violations.push({
              file: relPath,
              category: 'Hardcoded Machine Path',
              description: 'Hardcoded local developer machine path found in tracked file',
            });
            break;
          }
        }
      }
    }
  }

  // 2. Audit .env.example
  const envExamplePath = path.join(rootDir, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    const envContent = await fs.promises.readFile(envExamplePath, 'utf-8');
    if (envContent.includes('sk-') || envContent.includes('ghp_') || envContent.includes('npm_')) {
      violations.push({
        file: '.env.example',
        category: 'Secret in Environment Template',
        description: '.env.example contains live credential pattern',
      });
    }
  } else {
    violations.push({
      file: '.env.example',
      category: 'Missing File',
      description: '.env.example template is required for public repositories',
    });
  }

  // 3. Audit .gitignore rules
  const gitignorePath = path.join(rootDir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignore = await fs.promises.readFile(gitignorePath, 'utf-8');
    const requiredIgnores = ['.env', 'node_modules', 'dist', '.next', 'coverage'];
    for (const req of requiredIgnores) {
      if (!gitignore.includes(req)) {
        violations.push({
          file: '.gitignore',
          category: 'Incomplete .gitignore',
          description: `Missing required ignore pattern: ${req}`,
        });
      }
    }
  }

  // 4. Audit for compiled output committed beside TypeScript source
  const shadowedFiles = findCompiledOutputShadowingSource(trackedFiles);
  for (const relPath of shadowedFiles) {
    violations.push({
      file: relPath,
      category: 'Compiled Output Shadows Source',
      description:
        'Compiled output committed beside its .ts source shadows the TypeScript at module-resolution time ' +
        '(both Vite and Node prefer a sibling ./x.js over ./x.ts). Delete this file; it must only be produced ' +
        'by the build step and never committed.',
    });
  }

  // 5. Audit root package.json's `files` array for the same compiled artifacts,
  // since anything listed there ships to npm.
  const rootPackageJsonPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(rootPackageJsonPath)) {
    const rootPackageJson = JSON.parse(await fs.promises.readFile(rootPackageJsonPath, 'utf-8'));
    const filesArray: string[] = Array.isArray(rootPackageJson.files) ? rootPackageJson.files : [];
    const shadowedInFilesArray = findCompiledOutputInPackageFilesArray(filesArray);
    for (const entry of shadowedInFilesArray) {
      violations.push({
        file: 'package.json',
        category: 'Compiled Output In Published Files Array',
        description:
          `The "files" array lists "${entry}", which would ship compiled output alongside the .ts source ` +
          'to npm consumers. Remove it; only the .ts source (or the whole src directory) should be listed.',
      });
    }
  }

  if (violations.length > 0) {
    console.error('\x1b[31m✖ Security Audit Violations Detected:\x1b[0m');
    for (const v of violations) {
      console.error(`  - [${v.category}] in ${v.file}: ${v.description}`);
    }
    throw new Error(`Security audit failed with ${violations.length} violation(s).`);
  }

  console.log(`\x1b[32m✔ Security audit passed successfully! Audited ${trackedFiles.length} tracked files. Zero leaked credentials, secrets, or machine paths found.\x1b[0m\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runSecurityAudit().catch((err) => {
    console.error('\n\x1b[31m✖ Security Audit Failed:\x1b[0m', err.message || err);
    process.exit(1);
  });
}
