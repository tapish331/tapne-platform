import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';

test.describe('T01: Bootstrap sanity', () => {
  test('tooling files present and readable', async () => {
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
    for (const f of files) expect(existsSync(f), `${f} missing`).toBe(true);
  });
});

