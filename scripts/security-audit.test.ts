import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  findCompiledOutputShadowingSource,
  findCompiledOutputInPackageFilesArray,
} from './security-audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('findCompiledOutputShadowingSource', () => {
  it('passes (returns empty) for the current repository state', () => {
    // This reflects the real acceptance criterion: `git ls-files` on the actual
    // repo must not contain any compiled output beside .ts source under
    // packages/*/src, or `pnpm audit:security` would fail.
    const trackedFiles = execSync('git ls-files', { cwd: rootDir, encoding: 'utf-8' })
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean);

    expect(findCompiledOutputShadowingSource(trackedFiles)).toEqual([]);
  });

  it('flags a .js file committed beside its .ts source', () => {
    const trackedFiles = [
      'packages/shared/src/crypto/password.ts',
      'packages/shared/src/crypto/password.js',
    ];

    expect(findCompiledOutputShadowingSource(trackedFiles)).toEqual([
      'packages/shared/src/crypto/password.js',
    ]);
  });

  it('flags .d.ts, .js.map, and .d.ts.map compiled artifacts', () => {
    const trackedFiles = [
      'packages/auth/src/index.ts',
      'packages/auth/src/index.d.ts',
      'packages/auth/src/index.js.map',
      'packages/auth/src/index.d.ts.map',
    ];

    expect(findCompiledOutputShadowingSource(trackedFiles)).toEqual([
      'packages/auth/src/index.d.ts',
      'packages/auth/src/index.js.map',
      'packages/auth/src/index.d.ts.map',
    ]);
  });

  it('does not flag .ts source files, or compiled output outside packages/*/src', () => {
    const trackedFiles = [
      'packages/auth/src/index.ts',
      'apps/api/dist/index.js',
      'scripts/security-audit.js',
      'packages/auth/tsconfig.json',
    ];

    expect(findCompiledOutputShadowingSource(trackedFiles)).toEqual([]);
  });
});

describe('findCompiledOutputInPackageFilesArray', () => {
  it('passes (returns empty) for the current root package.json files array', () => {
    const rootPackageJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8')
    );
    const filesArray: string[] = Array.isArray(rootPackageJson.files) ? rootPackageJson.files : [];

    expect(findCompiledOutputInPackageFilesArray(filesArray)).toEqual([]);
  });

  it('flags a files-array entry that explicitly ships compiled output', () => {
    const files = ['packages/auth/src', 'packages/shared/src/crypto/password.js'];

    expect(findCompiledOutputInPackageFilesArray(files)).toEqual([
      'packages/shared/src/crypto/password.js',
    ]);
  });

  it('does not flag whole-directory entries such as "packages/auth/src"', () => {
    const files = ['packages/auth/src', 'packages/auth/package.json'];

    expect(findCompiledOutputInPackageFilesArray(files)).toEqual([]);
  });
});
