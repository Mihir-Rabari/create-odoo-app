import { describe, it, expect, afterAll, beforeAll } from 'vitest';
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

    it('should ignore scripts that develop and publish create-odoo-app itself', () => {
      // These check *this* repo's own git history and identity (security-audit.test.ts
      // shells out to `git ls-files`), or exist solely to verify/publish the CLI package
      // — none of it means anything once copied into a scaffolded, renamed project.
      expect(shouldIgnore('/path/to/template/scripts/security-audit.ts', base)).toBe(true);
      expect(shouldIgnore('/path/to/template/scripts/security-audit.test.ts', base)).toBe(true);
      expect(shouldIgnore('/path/to/template/scripts/verify-release.ts', base)).toBe(true);
      expect(shouldIgnore('/path/to/template/scripts/smoke-test.ts', base)).toBe(true);
      expect(shouldIgnore('/path/to/template/scripts/dogfood-test.ts', base)).toBe(true);
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

    // Scaffolded once for the whole block rather than inside the first test.
    //
    // Copying the template tree is slow enough on a Windows CI runner to exceed the
    // default 5s test timeout, and when it did, every later test in this block failed
    // with a confusing ENOENT on .env rather than one clear timeout. Setup now owns both
    // the work and the generous timeout; the tests below only make assertions.
    let result: Awaited<ReturnType<typeof generateProject>>;

    beforeAll(async () => {
      result = await generateProject({
        projectName: 'acme-portal',
        targetDir: testAppDir,
        templateDir: path.resolve(__dirname, '..'),
        skipInstall: true,
        skipGit: true,
      });
    }, 180_000);

    it('should generate a complete, valid application without machine path leaks', async () => {
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

    it('mints per-project secrets instead of copying the published placeholders', async () => {
      // Every generated project previously shipped the same SESSION_SECRET and root
      // password, both of which are public in .env.example on npm and GitHub.
      //
      // The placeholders are read out of the generated .env.example rather than
      // hard-coded here, so this stays correct if they are ever changed — and so the
      // literals live in exactly one place in the repository.
      const envContents = await fs.promises.readFile(path.join(testAppDir, '.env'), 'utf-8');
      const exampleContents = await fs.promises.readFile(
        path.join(testAppDir, '.env.example'),
        'utf-8'
      );

      for (const key of ['SESSION_SECRET', 'INITIAL_ROOT_PASSWORD']) {
        const placeholder = new RegExp(`^${key}=(.+)$`, 'm').exec(exampleContents)?.[1];
        expect(placeholder, `${key} missing from .env.example`).toBeTruthy();
        expect(envContents).not.toContain(placeholder!);
      }

      const sessionSecret = /^SESSION_SECRET=(.+)$/m.exec(envContents)?.[1] ?? '';
      expect(sessionSecret.length).toBeGreaterThanOrEqual(32);

      const rootPassword = /^INITIAL_ROOT_PASSWORD=(.+)$/m.exec(envContents)?.[1] ?? '';
      expect(rootPassword.length).toBeGreaterThanOrEqual(12);
    });

    it('generates a different secret for each project', async () => {
      const otherDir = path.join(os.tmpdir(), `create-odoo-app-secrets-${Date.now()}`);
      try {
        const other = await generateProject({
          projectName: 'beta-portal',
          targetDir: otherDir,
          templateDir: path.resolve(__dirname, '..'),
          skipInstall: true,
          skipGit: true,
        });

        expect(other.generatedSecrets?.SESSION_SECRET).toBeDefined();
        expect(other.generatedSecrets?.SESSION_SECRET).not.toBe(
          /^SESSION_SECRET=(.+)$/m.exec(
            await fs.promises.readFile(path.join(testAppDir, '.env'), 'utf-8')
          )?.[1]
        );
      } finally {
        await fs.promises.rm(otherDir, { recursive: true, force: true });
      }
    });

    it('strips the generator’s own identity from the generated package.json', async () => {
      // Left in place, every scaffolded app points its issue tracker and authorship at
      // the create-odoo-app repository.
      const generatedPkg = JSON.parse(
        await fs.promises.readFile(path.join(testAppDir, 'package.json'), 'utf-8')
      );

      expect(generatedPkg.repository).toBeUndefined();
      expect(generatedPkg.bugs).toBeUndefined();
      expect(generatedPkg.homepage).toBeUndefined();
      expect(generatedPkg.author).toBeUndefined();
      expect(generatedPkg.files).toBeUndefined();
      expect(generatedPkg.private).toBe(true);
      expect(generatedPkg.version).toBe('0.1.0');
    });

    it('does not inherit ignore-scripts in the generated .npmrc', async () => {
      // Inheriting it would permanently suppress install scripts for the user's own
      // future dependencies.
      const npmrcPath = path.join(testAppDir, '.npmrc');
      if (fs.existsSync(npmrcPath)) {
        const npmrc = await fs.promises.readFile(npmrcPath, 'utf-8');
        expect(npmrc).not.toMatch(/^s*ignore-scriptss*=s*true/m);
      }
    });
  });
});

describe('Target directory safety', () => {
  it('refuses to scaffold into a directory that already has files', async () => {
    const dir = path.join(os.tmpdir(), `create-odoo-app-occupied-${Date.now()}`);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, 'important-work.txt'), 'do not clobber');

    try {
      const result = await generateProject({
        projectName: 'occupied-app',
        targetDir: dir,
        templateDir: path.resolve(__dirname, '..'),
        skipInstall: true,
        skipGit: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not empty/i);

      // The pre-existing file must be untouched.
      expect(await fs.promises.readFile(path.join(dir, 'important-work.txt'), 'utf-8')).toBe(
        'do not clobber'
      );
    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  });

  it('allows scaffolding into a directory containing only .git', async () => {
    const dir = path.join(os.tmpdir(), `create-odoo-app-gitonly-${Date.now()}`);
    await fs.promises.mkdir(path.join(dir, '.git'), { recursive: true });

    try {
      const result = await generateProject({
        projectName: 'git-initialised',
        targetDir: dir,
        templateDir: path.resolve(__dirname, '..'),
        skipInstall: true,
        skipGit: true,
      });

      expect(result.success).toBe(true);
    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  });
});

/**
 * The theme flag was decorative until 1.2.0: it wrote `components.json`'s
 * `baseColor`, which only affects later `npx shadcn add` runs, and left
 * `globals.css` byte-identical. Every generated app looked the same whichever
 * theme the user picked. These tests assert the choice reaches disk.
 */
describe('Theme application', () => {
  const templateDir = path.resolve(__dirname, '..');

  async function scaffold(theme: 'neutral' | 'zinc' | 'violet' | 'rose') {
    const dir = path.join(os.tmpdir(), `create-odoo-app-theme-${theme}-${Date.now()}`);

    const result = await generateProject({
      projectName: `theme-${theme}`,
      targetDir: dir,
      templateDir,
      skipInstall: true,
      skipGit: true,
      theme,
    });

    expect(result.success).toBe(true);

    const read = (relative: string) =>
      fs.promises.readFile(path.join(dir, relative), 'utf-8');

    return {
      dir,
      css: await read('apps/web/src/app/globals.css'),
      layout: await read('apps/web/src/app/layout.tsx'),
      componentsJson: JSON.parse(await read('apps/web/components.json')),
    };
  }

  it('writes the selected palette, radius, and fonts into the app', async () => {
    const violet = await scaffold('violet');

    try {
      expect(violet.css).toContain('Theme: Violet & Indigo');
      expect(violet.css).toContain('--radius: 0.75rem;');
      expect(violet.css).toContain('--primary: 258 90% 61%;');
      expect(violet.css).toContain('.dark {');

      expect(violet.layout).toContain('Plus_Jakarta_Sans');
      expect(violet.layout).toContain('FONTS:START');
      expect(violet.layout).toContain('FONTS:END');

      expect(violet.componentsJson.tailwind.baseColor).toBe('zinc');
    } finally {
      await fs.promises.rm(violet.dir, { recursive: true, force: true });
    }
  }, 60_000);

  it('declares explicit weights for families with no variable version', async () => {
    const zinc = await scaffold('zinc');

    try {
      // next/font/google throws at build time for a non-variable family
      // declared without `weight`, so this is a build break, not a nit.
      expect(zinc.layout).toContain('IBM_Plex_Sans');
      expect(zinc.layout).toContain("weight: ['400', '500', '600', '700'],");
      expect(zinc.layout).toContain("weight: ['400', '500'],");
    } finally {
      await fs.promises.rm(zinc.dir, { recursive: true, force: true });
    }
  }, 60_000);

  it('produces visibly different apps for different themes', async () => {
    const [zinc, rose] = [await scaffold('zinc'), await scaffold('rose')];

    try {
      expect(zinc.css).not.toEqual(rose.css);
      expect(zinc.layout).not.toEqual(rose.layout);
    } finally {
      await fs.promises.rm(zinc.dir, { recursive: true, force: true });
      await fs.promises.rm(rose.dir, { recursive: true, force: true });
    }
  }, 90_000);
});
