import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

test.describe('T17: Home page presence and composition', () => {
  test('home files exist with expected exports and content', async () => {
    const files = [
      'frontend/web/app/page.tsx',
      'frontend/web/features/home/index.ts',
      'frontend/web/lib/server/home.queries.ts',
    ];
    for (const f of files) expect(existsSync(f), `${f} missing`).toBe(true);

    const page = readFileSync('frontend/web/app/page.tsx', 'utf8');
    expect(page).toMatch(/export\s+const\s+metadata/);
    expect(page).toMatch(/export\s+default\s+function\s+HomePage/);
    expect(page).toMatch(/page:\s*'home'/);

    const queries = readFileSync('frontend/web/lib/server/home.queries.ts', 'utf8');
    expect(queries).toMatch(/export\s+function\s+fetchPublicHome/);
    expect(queries).toMatch(/export\s+function\s+fetchPersonalizedHome/);

    const features = readFileSync('frontend/web/features/home/index.ts', 'utf8');
    expect(features).toMatch(/makeTripCard/);
    expect(features).toMatch(/makeProfileCard/);
    expect(features).toMatch(/loading/);
  });
});

