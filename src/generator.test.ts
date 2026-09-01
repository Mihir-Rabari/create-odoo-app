import { describe, it, expect, afterAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import {
  validateProjectName,
  toHumanTitle,
  toPackageName,
  generateProject,
} from './generator.js';
import { shouldIgnore } from './utils/fs.js';

describe('Generator Unit Tests', () => {
  describe('validateProjectName', () => {
    it('should approve valid project names', () => {
      expect(validateProjectName('my-app').valid).toBe(true);
      expect(validateProjectName('campus_connect').valid).toBe(true);
      expect(validateProjectName('app123').valid).toBe(true);
      expect(validateProjectName('.').valid).toBe(true);
    });

    it('should reject invalid project names', () => {
      expect(validateProjectName('').valid).toBe(false);
      expect(validateProjectName('   ').valid).toBe(false);
      expect(validateProjectName('my app').valid).toBe(false);
      expect(validateProjectName('../escaped').valid).toBe(false);
      expect(validateProjectName('nested/app').valid).toBe(false);
      expect(validateProjectName('node_modules').valid).toBe(false);
      expect(validateProjectName('package.json').valid).toBe(false);
    });
  });

  describe('toHumanTitle', () => {
    it('should convert kebab-case and snake_case to Title Case', () => {
      expect(toHumanTitle('my-awesome-app')).toBe('My Awesome App');
      expect(toHumanTitle('campus_connect')).toBe('Campus Connect');
      expect(toHumanTitle('simple')).toBe('Simple');
      expect(toHumanTitle('.')).toBe('My Application');
    });
  });

  describe('toPackageName', () => {
    it('should normalize project names', () => {
      expect(toPackageName('My-App')).toBe('my-app');
      expect(toPackageName('campus_connect')).toBe('campus_connect');
    });
  });

  describe('Template Ignore Filters', () => {
    const base = '/path/to/template';

    it('should ignore build artifacts, node_modules, and git files', () => {
      expect(shouldIgnore('/path/to/template/.git', base)).toBe(true);
      expect(shouldIgnore('/path/to/template/node_modules', base)).toBe(true);
      expect(shouldIgnore('/path/to/template/dist', base)).toBe(true);
      expect(shouldIgnore('/path/to/template/.next', base)).toBe(true);
      expect(shouldIgnore('/path/to/template/.env', base)).toBe(true);
      expect(shouldIgnore('/path/to/template/app.log', base)).toBe(true);
      expect(shouldIgnore('/path/to/template/brain', base)).toBe(true);
      expect(shouldIgnore('/path/to/template/implementation_plan.md', base)).toBe(true);
      expect(shouldIgnore('/path/to/template/walkthrough.md', base)).toBe(true);
    });

    it('should not ignore template source files', () => {
      expect(shouldIgnore('/path/to/template/apps/web/src/app/page.tsx', base)).toBe(false);
      expect(shouldIgnore('/path/to/template/packages/config/src/app-config.ts', base)).toBe(false);
      expect(shouldIgnore('/path/to/template/.env.example', base)).toBe(false);
      expect(shouldIgnore('/path/to/template/skills/security/SKILL.md', base)).toBe(false);
      expect(shouldIgnore('/path/to/template/package.json', base)).toBe(false);
    });
  });

  describe('End-to-End Scaffolding in Temporary Directory', () => {
    const testAppDir = path.join(os.tmpdir(), `create-odoo-app-test-${Date.now()}`);

    afterAll(async () => {
      if (fs.existsSync(testAppDir)) {
        await fs.promises.rm(testAppDir, { recursive: true, force: true });
      }
    });

    it('should generate a complete, valid application without machine path leaks', async () => {
      const result = await generateProject({
        projectName: 'acme-portal',
        targetDir: testAppDir,
        templateDir: path.resolve(__dirname, '..'),
        skipInstall: true,
        skipGit: true,
      });

      expect(result.success).toBe(true);
      expect(result.projectName).toBe('acme-portal');
      expect(result.humanTitle).toBe('Acme Portal');

      // Check structure
      expect(fs.existsSync(path.join(testAppDir, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(testAppDir, 'pnpm-workspace.yaml'))).toBe(true);
      expect(fs.existsSync(path.join(testAppDir, '.env.example'))).toBe(true);
      expect(fs.existsSync(path.join(testAppDir, '.env'))).toBe(true);
      expect(fs.existsSync(path.join(testAppDir, '.gitignore'))).toBe(true);
      expect(fs.existsSync(path.join(testAppDir, '.npmignore'))).toBe(false);
      expect(fs.existsSync(path.join(testAppDir, 'apps/web/package.json'))).toBe(true);
      expect(fs.existsSync(path.join(testAppDir, 'apps/api/package.json'))).toBe(true);
      expect(fs.existsSync(path.join(testAppDir, 'packages/auth/package.json'))).toBe(true);
      expect(fs.existsSync(path.join(testAppDir, 'packages/iam/package.json'))).toBe(true);
      expect(fs.existsSync(path.join(testAppDir, 'packages/config/package.json'))).toBe(true);
      expect(fs.existsSync(path.join(testAppDir, 'skills/security/SKILL.md'))).toBe(true);

      // Check transformed root package.json
      const generatedPkg = JSON.parse(
        await fs.promises.readFile(path.join(testAppDir, 'package.json'), 'utf-8')
      );
      expect(generatedPkg.name).toBe('acme-portal');
      expect(generatedPkg.description).toContain('Acme Portal');
      expect(generatedPkg.bin).toBeUndefined(); // Should not declare bin in generated project

      // Check transformed app-config.ts
      const appConfigContent = await fs.promises.readFile(
        path.join(testAppDir, 'packages/config/src/app-config.ts'),
        'utf-8'
      );
      expect(appConfigContent).toContain("name: 'Acme Portal'");
      expect(appConfigContent).toContain("slug: 'acme-portal'");

      // Check transformed README
      const readmeContent = await fs.promises.readFile(
        path.join(testAppDir, 'README.md'),
        'utf-8'
      );
      expect(readmeContent).toContain('# Acme Portal');

      // Verify no temporary artifacts leaked
      expect(fs.existsSync(path.join(testAppDir, 'brain'))).toBe(false);
      expect(fs.existsSync(path.join(testAppDir, 'implementation_plan.md'))).toBe(false);
      expect(fs.existsSync(path.join(testAppDir, 'walkthrough.md'))).toBe(false);
    });
  });
});
