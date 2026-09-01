import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import { generateProject } from '../src/generator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSmokeTest(): Promise<void> {
  console.log('\x1b[35m=== Running create-odoo-app Smoke Test ===\x1b[0m\n');

  const tempDir = path.join(os.tmpdir(), `create-odoo-app-smoke-${Date.now()}`);

  try {
    console.log(`[Smoke Test] 🚀 Generating application in ${tempDir}...`);
    const result = await generateProject({
      projectName: 'smoke-portal',
      targetDir: tempDir,
      templateDir: path.resolve(__dirname, '..'),
      skipInstall: true,
      skipGit: true,
    });

    if (!result.success) {
      throw new Error(`Generator returned failure: ${result.error}`);
    }

    console.log('[Smoke Test] 🔍 Validating generated directory structure...');

    const requiredPaths = [
      'package.json',
      'pnpm-workspace.yaml',
      'docker-compose.yml',
      '.env.example',
      '.env',
      '.gitignore',
      'apps/web/package.json',
      'apps/web/src/app/layout.tsx',
      'apps/web/AGENTS.md',
      'apps/api/package.json',
      'apps/api/src/server.ts',
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
      'packages/openapi/package.json',
      'packages/shared/package.json',
      'packages/validation/package.json',
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

    for (const reqPath of requiredPaths) {
      const fullPath = path.join(tempDir, reqPath);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Expected file missing in generated output: ${reqPath}`);
      }
    }

    console.log('[Smoke Test] 🔍 Validating transformed project metadata...');

    // Validate root package.json
    const rootPkg = JSON.parse(
      await fs.promises.readFile(path.join(tempDir, 'package.json'), 'utf-8')
    );
    if (rootPkg.name !== 'smoke-portal') {
      throw new Error(`Expected package.json name to be "smoke-portal", received "${rootPkg.name}"`);
    }
    if (rootPkg.bin !== undefined) {
      throw new Error('Expected "bin" property to be removed from generated project package.json');
    }

    // Validate app-config.ts
    const appConfig = await fs.promises.readFile(
      path.join(tempDir, 'packages/config/src/app-config.ts'),
      'utf-8'
    );
    if (!appConfig.includes("name: 'Smoke Portal'")) {
      throw new Error('Expected app-config.ts to contain human title "Smoke Portal"');
    }
    if (!appConfig.includes("slug: 'smoke-portal'")) {
      throw new Error('Expected app-config.ts to contain slug "smoke-portal"');
    }

    // Validate README.md
    const readme = await fs.promises.readFile(path.join(tempDir, 'README.md'), 'utf-8');
    if (!readme.includes('# Smoke Portal')) {
      throw new Error('Expected README.md to start with "# Smoke Portal"');
    }

    // Validate skills/index.yaml in generated project
    const generatedIndex = await fs.promises.readFile(
      path.join(tempDir, 'skills', 'index.yaml'),
      'utf-8'
    );
    if (!generatedIndex.includes('skills:')) {
      throw new Error('Expected generated skills/index.yaml to contain "skills:" list');
    }

    // Validate absence of leaked private/dev files
    const forbiddenPaths = [
      'brain',
      'implementation_plan.md',
      'walkthrough.md',
      '.git',
    ];

    for (const forbPath of forbiddenPaths) {
      if (fs.existsSync(path.join(tempDir, forbPath))) {
        throw new Error(`Forbidden temporary file leaked into generated project: ${forbPath}`);
      }
    }

    console.log(`\n\x1b[32m✔ Smoke test passed successfully! All ${requiredPaths.length} assertions verified.\x1b[0m\n`);
  } finally {
    if (fs.existsSync(tempDir)) {
      console.log(`[Smoke Test] 🧹 Cleaning up temporary directory ${tempDir}...`);
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  }
}

runSmokeTest().catch((err) => {
  console.error('[Smoke Test] ✖ Failed:', err);
  process.exit(1);
});
