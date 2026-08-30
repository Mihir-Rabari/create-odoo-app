import { describe, it, expect, beforeAll } from 'vitest';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import {
  parseIndexYaml,
  packSkill,
  packAllSkills,
  createDeterministicZip,
} from '../scripts/pack-skills.js';
import { parseYamlFrontmatter } from '../scripts/check-skills.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Agent Skills Architecture & Packaging Tests', () => {
  let tempOutDir: string;

  beforeAll(async () => {
    tempOutDir = path.join(os.tmpdir(), `skills-test-${Date.now()}`);
    await fs.promises.mkdir(tempOutDir, { recursive: true });
  });

  it('should parse skills/index.yaml and discover all 13 canonical skills', async () => {
    const indexPath = path.join(rootDir, 'skills', 'index.yaml');
    const content = await fs.promises.readFile(indexPath, 'utf-8');
    const skills = parseIndexYaml(content);

    expect(skills.length).toBe(13);
    const skillNames = skills.map((s) => s.name);
    expect(skillNames).toContain('architecture');
    expect(skillNames).toContain('authentication');
    expect(skillNames).toContain('authorization');
    expect(skillNames).toContain('database');
    expect(skillNames).toContain('api');
    expect(skillNames).toContain('frontend');
    expect(skillNames).toContain('security');
    expect(skillNames).toContain('validation');
    expect(skillNames).toContain('testing');
    expect(skillNames).toContain('storage');
    expect(skillNames).toContain('email');
    expect(skillNames).toContain('realtime');
    expect(skillNames).toContain('observability');
  });

  it('should resolve relevant skills deterministically for domain tasks', () => {
    function resolveSkillsForTask(task: string): string[] {
      const lower = task.toLowerCase();
      const resolved = new Set<string>();

      if (lower.includes('auth') || lower.includes('session') || lower.includes('login')) {
        resolved.add('authentication');
        resolved.add('security');
        resolved.add('testing');
      }
      if (lower.includes('api') || lower.includes('route') || lower.includes('fastify')) {
        resolved.add('api');
        resolved.add('validation');
        resolved.add('testing');
      }
      if (lower.includes('iam') || lower.includes('permission') || lower.includes('role')) {
        resolved.add('authorization');
        resolved.add('security');
        resolved.add('testing');
      }
      if (lower.includes('db') || lower.includes('schema') || lower.includes('migration')) {
        resolved.add('database');
        resolved.add('testing');
      }
      if (lower.includes('frontend') || lower.includes('page') || lower.includes('component')) {
        resolved.add('frontend');
        resolved.add('testing');
      }

      return Array.from(resolved);
    }

    const authSkills = resolveSkillsForTask('Modify authentication session behavior');
    expect(authSkills).toContain('authentication');
    expect(authSkills).toContain('security');
    expect(authSkills).toContain('testing');

    const apiSkills = resolveSkillsForTask('Add a new Fastify API route');
    expect(apiSkills).toContain('api');
    expect(apiSkills).toContain('validation');
    expect(apiSkills).toContain('testing');

    const iamSkills = resolveSkillsForTask('Update IAM role policy permissions');
    expect(iamSkills).toContain('authorization');
    expect(iamSkills).toContain('security');
    expect(iamSkills).toContain('testing');
  });

  it('should pack a single skill into a deterministic ZIP and directory bundle', async () => {
    const result = await packSkill('authentication', {
      outDir: tempOutDir,
      silent: true,
    });

    expect(fs.existsSync(result.zipPath)).toBe(true);
    expect(fs.existsSync(result.dirPath)).toBe(true);
    expect(result.fileCount).toBeGreaterThanOrEqual(1);

    // Verify directory bundle contains SKILL.md
    const bundledSkillFile = path.join(result.dirPath, 'SKILL.md');
    expect(fs.existsSync(bundledSkillFile)).toBe(true);
    const content = await fs.promises.readFile(bundledSkillFile, 'utf-8');
    const { frontmatter } = parseYamlFrontmatter(content);
    expect(frontmatter.name).toBe('authentication');
  });

  it('should pack all 13 canonical skills into output directory', async () => {
    const count = await packAllSkills({
      outDir: tempOutDir,
      silent: true,
    });

    expect(count).toBe(13);

    const canonicalNames = [
      'architecture',
      'authentication',
      'authorization',
      'database',
      'api',
      'frontend',
      'security',
      'validation',
      'testing',
      'storage',
      'email',
      'realtime',
      'observability',
    ];

    for (const name of canonicalNames) {
      expect(fs.existsSync(path.join(tempOutDir, `${name}.zip`))).toBe(true);
      expect(fs.existsSync(path.join(tempOutDir, name, 'SKILL.md'))).toBe(true);
    }
  });

  it('should produce deterministic ZIP binary outputs for identical file inputs', () => {
    const entries = [
      { name: 'SKILL.md', data: Buffer.from('# Test Skill\n\nDeterministic content.', 'utf-8') },
      { name: 'references/test.md', data: Buffer.from('Reference content.', 'utf-8') },
    ];

    const zip1 = createDeterministicZip(entries);
    const zip2 = createDeterministicZip(entries);

    expect(zip1.equals(zip2)).toBe(true);
  });

  it('should strictly isolate skill bundles without repository root files', async () => {
    const authDir = path.join(tempOutDir, 'authentication');
    const forbiddenInBundle = [
      'AGENTS.md',
      'package.json',
      'pnpm-workspace.yaml',
      'docker-compose.yml',
      '.git',
      'node_modules',
      'apps',
      'packages',
    ];

    for (const forbidden of forbiddenInBundle) {
      expect(fs.existsSync(path.join(authDir, forbidden))).toBe(false);
    }
  });
});
