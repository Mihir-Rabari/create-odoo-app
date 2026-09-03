import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function scanDirectoryForMachinePaths(dir: string): Promise<string[]> {
  const violations: string[] = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  const winUserPrefix = ['C:', '\\', 'Users', '\\'].join('');
  const devProjectPrefix = ['K:', '\\', 'Projects', '\\', 'create-odoo-app'].join('');
  const posixUserPrefix = ['/Users', '/', 'mihir', '/'].join('');

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const subViolations = await scanDirectoryForMachinePaths(fullPath);
      violations.push(...subViolations);
    } else if (
      entry.isFile() &&
      !entry.name.endsWith('.png') &&
      !entry.name.endsWith('.ico') &&
      !entry.name.endsWith('.tgz') &&
      !entry.name.endsWith('.lock') &&
      !entry.name.endsWith('.yaml') &&
      !entry.name.endsWith('.map') &&
      entry.name !== 'verify-release.ts' // Skip self
    ) {
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      if (
        content.includes(winUserPrefix) ||
        content.includes(devProjectPrefix) ||
        content.includes(posixUserPrefix)
      ) {
        violations.push(fullPath);
      }
    }
  }

  return violations;
}

async function verifyRelease(): Promise<void> {
  console.log('\x1b[35m=== Running Full Pre-Release Quality Gate & Distributable Verification ===\x1b[0m\n');

  const tempDir = path.join(os.tmpdir(), `create-odoo-app-release-${Date.now()}`);

  try {
    // 1. Version Invariants Check
    console.log('[Release Gate] 🏷️  Step 1: Checking package metadata and version consistency...');
    const rootPkg = JSON.parse(await fs.promises.readFile(path.join(rootDir, 'package.json'), 'utf-8'));
    if (rootPkg.name !== 'create-odoo-app') {
      throw new Error(`Invalid package name in package.json: ${rootPkg.name}`);
    }
    console.log(`[Release Gate] ✔ Package version verified: ${rootPkg.name}@${rootPkg.version}`);

    // 2. Validate Skills Standard, Packaging & Security Audit
    console.log('\n[Release Gate] 📋 Step 2: Validating Agent Skills standard, security audit & packaging...');
    execSync('pnpm audit:security', { cwd: rootDir, stdio: 'inherit' });
    execSync('pnpm skills:check', { cwd: rootDir, stdio: 'inherit' });
    execSync('pnpm skills:lint', { cwd: rootDir, stdio: 'inherit' });
    execSync('pnpm skills:pack --all', { cwd: rootDir, stdio: 'inherit' });

    // 3. Build Monorepo & CLI
    console.log('\n[Release Gate] 🔨 Step 3: Compiling all packages and generator CLI...');
    execSync('pnpm build', { cwd: rootDir, stdio: 'inherit' });

    // 4. Package Tarball via npm pack
    console.log('\n[Release Gate] 📦 Step 4: Packaging distributable tarball with npm pack...');
    const packOutput = execSync('npm pack', { cwd: rootDir, encoding: 'utf-8' }).trim();
    const tarballName = packOutput.split('\n').pop()?.trim() || `create-odoo-app-${rootPkg.version}.tgz`;
    const tarballPath = path.join(rootDir, tarballName);

    if (!fs.existsSync(tarballPath)) {
      throw new Error(`Expected tarball not found: ${tarballPath}`);
    }

    console.log(`[Release Gate] ✔ Packaged tarball: ${tarballName}`);

    // 5. Prepare clean verification directory
    await fs.promises.mkdir(tempDir, { recursive: true });

    // 6. Extract tarball into temp directory
    console.log(`[Release Gate] 📂 Step 5: Unpacking tarball in ${tempDir}...`);
    // The archive is passed as a bare filename with cwd set to its directory, rather
    // than as an absolute path. GNU tar (which is what ships with Git for Windows)
    // treats an argument containing a colon as a remote `host:path` specification, so an
    // absolute Windows path fails with "Cannot connect to \K: resolve failed" for anyone
    // whose checkout is not on C:. Only the archive argument is parsed that way, so -C
    // can stay absolute.
    execSync(`tar -xzf "${tarballName}" -C "${tempDir}"`, {
      cwd: path.dirname(tarballPath),
      stdio: 'ignore',
    });

    const packageRoot = path.join(tempDir, 'package');
    if (!fs.existsSync(packageRoot)) {
      throw new Error(`Expected unpacked 'package' directory in ${tempDir}`);
    }

    // 7. Audit unpacked package contents for private files
    console.log('[Release Gate] 🔍 Step 6: Auditing unpacked package contents for leaked files...');
    const forbiddenLeaked = [
      path.join(packageRoot, '.git'),
      path.join(packageRoot, 'brain'),
      path.join(packageRoot, 'implementation_plan.md'),
      path.join(packageRoot, 'walkthrough.md'),
      path.join(packageRoot, '.env'),
    ];

    for (const forbidden of forbiddenLeaked) {
      if (fs.existsSync(forbidden)) {
        throw new Error(`SECURITY LEAK: Found forbidden file in packed artifact: ${forbidden}`);
      }
    }

    // 8. Audit for hardcoded local machine paths in packaged text files
    console.log('[Release Gate] 🔍 Step 7: Scanning package files for hardcoded developer paths...');
    const pathViolations = await scanDirectoryForMachinePaths(packageRoot);
    if (pathViolations.length > 0) {
      throw new Error(`LEAK DETECTED: Hardcoded developer paths found in files:\n${pathViolations.join('\n')}`);
    }
    console.log('[Release Gate] ✔ Zero hardcoded machine paths found in packaged files.');

    // 9. Execute Generator from Unpacked Artifact
    console.log('[Release Gate] 🚀 Step 8: Executing create-odoo-app from unpacked distribution...');
    const targetAppDir = path.join(tempDir, 'enterprise-portal');
    const cliPath = path.join(packageRoot, 'dist', 'cli.js');

    execSync(`node "${cliPath}" enterprise-portal --skip-install --skip-git`, {
      cwd: tempDir,
      stdio: 'inherit',
    });

    // 10. Validate Generated Application
    console.log('[Release Gate] 🔍 Step 9: Validating generated enterprise-portal project structure...');
    const requiredFiles = [
      'package.json',
      'pnpm-workspace.yaml',
      '.env.example',
      '.env',
      '.gitignore',
      'apps/web/package.json',
      'apps/web/next.config.mjs',
      'apps/web/postcss.config.mjs',
      'apps/web/AGENTS.md',
      'apps/api/package.json',
      'apps/api/AGENTS.md',
      'packages/auth/package.json',
      'packages/auth/AGENTS.md',
      'packages/iam/package.json',
      'packages/iam/AGENTS.md',
      'packages/config/package.json',
      'packages/config/src/app-config.ts',
      'packages/config/src/auth-config.ts',
      'packages/config/src/iam-config.ts',
      'packages/config/src/feature-config.ts',
      'packages/db/package.json',
      'packages/db/AGENTS.md',
      'skills/index.yaml',
      'skills/architecture/SKILL.md',
      'skills/security/SKILL.md',
      'skills/testing/SKILL.md',
      'skills/dependencies/SKILL.md',
      'README.md',
      'CHANGELOG.md',
      'AGENTS.md',
    ];

    for (const req of requiredFiles) {
      const full = path.join(targetAppDir, req);
      if (!fs.existsSync(full)) {
        throw new Error(`Missing expected file in generated project: ${req}`);
      }
    }

    // Validate transformed package.json in generated app
    const generatedPkg = JSON.parse(
      await fs.promises.readFile(path.join(targetAppDir, 'package.json'), 'utf-8')
    );
    if (generatedPkg.name !== 'enterprise-portal') {
      throw new Error(`Expected package.json name to be "enterprise-portal", received "${generatedPkg.name}"`);
    }

    // Validate transformed README
    const readme = await fs.promises.readFile(path.join(targetAppDir, 'README.md'), 'utf-8');
    if (!readme.includes('# Enterprise Portal')) {
      throw new Error('Expected README.md to contain "# Enterprise Portal"');
    }

    // 11. Clean up root tarball
    if (fs.existsSync(tarballPath)) {
      await fs.promises.unlink(tarballPath);
    }

    console.log('\n\x1b[32m✔ Pre-release verification passed successfully! All quality gates satisfied.\x1b[0m\n');
  } finally {
    if (fs.existsSync(tempDir)) {
      console.log(`[Release Gate] 🧹 Cleaning up temporary directory ${tempDir}...`);
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  }
}

verifyRelease().catch((err) => {
  console.error('\n\x1b[31m✖ Pre-release verification failed:\x1b[0m', err);
  process.exit(1);
});
