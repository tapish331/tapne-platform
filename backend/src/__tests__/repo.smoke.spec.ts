import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

describe('T01: Monorepo & Tooling Bootstrap', () => {
  it('root package.json has required scripts', () => {
    const rootPkgPath = path.resolve(__dirname, '../../../package.json');
    const raw = readFileSync(rootPkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    expect(pkg.scripts).toBeTruthy();
    for (const k of ['test', 'test:e2e', 'lint', 'format', 'verify:tasks', 'test:all']) {
      expect(pkg.scripts[k]).toBeTypeOf('string');
    }
  });

  it('core root tooling files exist', () => {
    const root = path.resolve(__dirname, '../../../');
    const files = [
      '.editorconfig',
      '.gitignore',
      '.gitattributes',
      'tsconfig.base.json',
      '.prettierrc',
      '.eslintrc.cjs',
      'tests/e2e/playwright.config.ts',
      'tests/e2e/fixtures/env.ts',
    ];
    for (const f of files) expect(existsSync(path.join(root, f))).toBe(true);
  });
});
