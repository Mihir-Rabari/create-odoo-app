import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function verifyRelease(): Promise<void> {
  console.log('\x1b[35m=== Running Full Pre-Release Quality Gate & Distributable Verification ===\x1b[0m\n');

  const tempDir = path.join(os.tmpdir(), `create-odoo-app-release-${Date.now()}`);

  try {
    // 1. Build Monorepo & CLI
    console.log('[Release Gate] 🔨 Step 1: Compiling all packages and generator CLI...');
    execSync('pnpm build', { cwd: rootDir, stdio: 'inherit' });

    // 2. Package Tarball via npm pack
    console.log('\n[Release Gate] 📦 Step 2: Packaging distributable tarball with npm pack...');
    const packOutput = execSync('npm pack', { cwd: rootDir, encoding: 'utf-8' }).trim();
    const tarballName = packOutput.split('\n').pop()?.trim() || 'create-odoo-app-1.0.0.tgz';
    const tarballPath = path.join(rootDir, tarballName);

    if (!fs.existsSync(tarballPath)) {
      throw new Error(`Expected tarball not found: ${tarballPath}`);
    }

    console.log(`[Release Gate] ✔ Packaged tarball: ${tarballName}`);

    // 3. Prepare clean verification directory
    await fs.promises.mkdir(tempDir, { recursive: true });

    // 4. Extract tarball into temp directory
    console.log(`[Release Gate] 📂 Step 3: Unpacking tarball in ${tempDir}...`);
    execSync(`tar -xzf "${tarballPath}" -C "${tempDir}"`, { stdio: 'ignore' });

    const packageRoot = path.join(tempDir, 'package');
    if (!fs.existsSync(packageRoot)) {
      throw new Error(`Expected unpacked 'package' directory in ${tempDir}`);
    }

    // 5. Audit unpacked package contents
    console.log('[Release Gate] 🔍 Step 4: Auditing unpacked package contents for leakage...');
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

    // 6. Execute Generator from Unpacked Artifact
    console.log('[Release Gate] 🚀 Step 5: Executing create-odoo-app from unpacked distribution...');
    const targetAppDir = path.join(tempDir, 'enterprise-portal');
    const cliPath = path.join(packageRoot, 'dist', 'cli.js');

    execSync(`node "${cliPath}" enterprise-portal --skip-install --skip-git`, {
      cwd: tempDir,
      stdio: 'inherit',
    });

    // 7. Validate Generated Application
    console.log('[Release Gate] 🔍 Step 6: Validating generated enterprise-portal project structure...');
    const requiredFiles = [
      'package.json',
      'pnpm-workspace.yaml',
      '.env.example',
      '.env',
      'apps/web/package.json',
      'apps/api/package.json',
      'packages/auth/package.json',
      'packages/iam/package.json',
      'packages/config/package.json',
      'packages/config/src/app-config.ts',
      'packages/config/src/auth-config.ts',
      'packages/config/src/iam-config.ts',
      'packages/config/src/feature-config.ts',
      'packages/db/package.json',
      'skills/security/SKILL.md',
      'README.md',
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

    // 8. Clean up root tarball
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
