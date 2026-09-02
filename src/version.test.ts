import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppConfig } from '../packages/config/src/app-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Package Version & Identity Invariants', () => {
  const pkgPath = path.join(rootDir, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

  it('should have official package name "create-odoo-app"', () => {
    expect(pkg.name).toBe('create-odoo-app');
  });

  it('should have valid SemVer versions', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/);
    expect(AppConfig.version).toMatch(/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/);
  });

  it('should declare correct binary entry point for npx execution', () => {
    expect(pkg.bin).toBeDefined();
    expect(pkg.bin['create-odoo-app']).toBe('./dist/cli.js');
  });

  it('should point to canonical GitHub repository under Mihir-Rabari', () => {
    expect(pkg.repository?.url).toBe('https://github.com/Mihir-Rabari/create-odoo-app.git');
    expect(pkg.bugs?.url).toBe('https://github.com/Mihir-Rabari/create-odoo-app/issues');
    expect(pkg.homepage).toBe('https://github.com/Mihir-Rabari/create-odoo-app#readme');
  });
});
