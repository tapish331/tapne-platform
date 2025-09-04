import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

test.describe('T18: Search page presence and visibility code', () => {
  test('search files exist with expected exports and content', async () => {
    const files = [
      'frontend/web/app/search/page.tsx',
      'frontend/web/features/search/index.ts',
      'frontend/web/lib/server/search.queries.ts',
    ];
    for (const f of files) expect(existsSync(f), `${f} missing`).toBe(true);

    const page = readFileSync('frontend/web/app/search/page.tsx', 'utf8');
    expect(page).toMatch(/export\s+const\s+metadata/);
    expect(page).toMatch(/export\s+default\s+function\s+SearchPage/);
    expect(page).toMatch(/page:\s*'search'/);

    const queries = readFileSync('frontend/web/lib/server/search.queries.ts', 'utf8');
    expect(queries).toMatch(/export\s+function\s+fetchPublicSearch/);
    expect(queries).toMatch(/export\s+function\s+fetchAuthSearch/);

    const features = readFileSync('frontend/web/features/search/index.ts', 'utf8');
    expect(features).toMatch(/makeFilters/);
    expect(features).toMatch(/renderResultItem/);
    expect(features).toMatch(/canBookmark/);
  });
});

