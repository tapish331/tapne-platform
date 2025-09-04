import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

test.describe('T15: Frontend bootstrap presence', () => {
  test('frontend/web scaffold files exist and have basic content', async () => {
    const files = [
      'frontend/web/package.json',
      'frontend/web/next.config.mjs',
      'frontend/web/tailwind.config.ts',
      // postcss config may be .js or .cjs depending on ESM/CJS usage
      'frontend/web/styles/globals.css',
      'frontend/web/app/layout.tsx',
      'frontend/web/app/page.tsx',
    ];
    for (const f of files) expect(existsSync(f), `${f} missing`).toBe(true);

    // Check package.json has a test script
    const pkg = JSON.parse(readFileSync('frontend/web/package.json', 'utf8'));
    expect(typeof pkg.scripts?.test).toBe('string');

    // globals.css includes Tailwind directives
    const css = readFileSync('frontend/web/styles/globals.css', 'utf8');
    expect(css).toMatch(/@tailwind\s+base;/);
    expect(css).toMatch(/@tailwind\s+components;/);
    expect(css).toMatch(/@tailwind\s+utilities;/);

    // layout.tsx exports metadata
    const layout = readFileSync('frontend/web/app/layout.tsx', 'utf8');
    expect(layout).toMatch(/export\s+const\s+metadata/);

    // PostCSS config exists as either JS or CJS
    const hasJs = existsSync('frontend/web/postcss.config.js');
    const hasCjs = existsSync('frontend/web/postcss.config.cjs');
    expect(hasJs || hasCjs).toBe(true);
  });
});
