import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function runDogfoodTest(): Promise<void> {
  console.log('\x1b[35m=== Running End-to-End Generator Dogfooding Verification ===\x1b[0m\n');

  const tempDir = path.join(os.tmpdir(), `create-odoo-app-dogfood-${Date.now()}`);
  await fs.promises.mkdir(tempDir, { recursive: true });

  try {
    // 1. Build and Pack Tarball
    console.log('[Dogfood] 🔨 Step 1: Compiling and packaging create-odoo-app...');
    execSync('pnpm build', { cwd: rootDir, stdio: 'inherit' });

    const packOutput = execSync('npm pack', { cwd: rootDir, encoding: 'utf-8' }).trim();
    const tarballName = packOutput.split('\n').pop()?.trim() || 'create-odoo-app-1.0.0.tgz';
    const tarballPath = path.join(rootDir, tarballName);

    // 2. Extract into isolated temp directory
    console.log(`[Dogfood] 📂 Step 2: Unpacking ${tarballName} into ${tempDir}...`);
    // Passed as a bare filename with cwd set to its directory. GNU tar (what ships with
    // Git for Windows) reads an argument containing a colon as a remote `host:path`
    // spec, so an absolute Windows path fails for any checkout not on C:. Only the
    // archive argument is parsed that way, so -C can stay absolute.
    execSync(`tar -xzf "${tarballName}" -C "${tempDir}"`, {
      cwd: path.dirname(tarballPath),
      stdio: 'ignore',
    });

    const packageRoot = path.join(tempDir, 'package');
    const cliPath = path.join(packageRoot, 'dist', 'cli.js');

    // 3. Run generator
    console.log('[Dogfood] 🚀 Step 3: Scaffolding fresh project "platform-demo"...');
    const targetProjectDir = path.join(tempDir, 'platform-demo');
    execSync(`node "${cliPath}" platform-demo --skip-install --skip-git`, {
      cwd: tempDir,
      stdio: 'inherit',
    });

    // 4. Validate generated project files
    console.log('[Dogfood] 🔍 Step 4: Validating generated project files & structure...');
    const criticalPaths = [
      'package.json',
      'pnpm-workspace.yaml',
      '.env.example',
      '.env',
      'apps/web/package.json',
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
      'skills/authentication/SKILL.md',
      'skills/authorization/SKILL.md',
      'skills/database/SKILL.md',
      'skills/api/SKILL.md',
      'skills/frontend/SKILL.md',
      'skills/security/SKILL.md',
      'skills/validation/SKILL.md',
      'skills/testing/SKILL.md',
      'skills/storage/SKILL.md',
      'skills/email/SKILL.md',
      'skills/realtime/SKILL.md',
      'skills/observability/SKILL.md',
      'skills/dependencies/SKILL.md',
      'README.md',
      'CHANGELOG.md',
      'AGENTS.md',
    ];

    for (const req of criticalPaths) {
      const full = path.join(targetProjectDir, req);
      if (!fs.existsSync(full)) {
        throw new Error(`Dogfood assertion failed: missing ${req}`);
      }
    }

    // 5. Validate Metadata Transformations
    console.log('[Dogfood] 🔍 Step 5: Validating metadata transformations...');
    const rootPkg = JSON.parse(await fs.promises.readFile(path.join(targetProjectDir, 'package.json'), 'utf-8'));
    if (rootPkg.name !== 'platform-demo') {
      throw new Error(`Expected package.json name to be "platform-demo", got "${rootPkg.name}"`);
    }

    const appConfig = await fs.promises.readFile(path.join(targetProjectDir, 'packages/config/src/app-config.ts'), 'utf-8');
    if (!appConfig.includes("name: 'Platform Demo'")) {
      throw new Error('Expected app-config.ts to contain name "Platform Demo"');
    }
    if (!appConfig.includes("slug: 'platform-demo'")) {
      throw new Error('Expected app-config.ts to contain slug "platform-demo"');
    }

    // 6. Test Agent Skills standard inside generated project
    console.log('[Dogfood] 📋 Step 6: Testing Agent Skills tooling in generated project...');
    execSync('pnpm skills:check', { cwd: targetProjectDir, stdio: 'inherit' });
    execSync('pnpm skills:lint', { cwd: targetProjectDir, stdio: 'inherit' });
    execSync('pnpm skills:pack --all', { cwd: targetProjectDir, stdio: 'inherit' });

    // 7. Clean up root tarball
    if (fs.existsSync(tarballPath)) {
      await fs.promises.unlink(tarballPath);
    }

    console.log('\n\x1b[32m✔ Dogfooding verification passed successfully! All 14 skills, configurations, and metadata validated in clean generated project.\x1b[0m\n');
  } finally {
    if (fs.existsSync(tempDir)) {
      console.log(`[Dogfood] 🧹 Cleaning up temporary directory ${tempDir}...`);
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  }
}

runDogfoodTest().catch((err) => {
  console.error('\n\x1b[31m✖ Dogfooding test failed:\x1b[0m', err.message || err);
  process.exit(1);
});
