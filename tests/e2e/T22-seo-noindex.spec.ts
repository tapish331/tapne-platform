import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

test.describe('T22: SEO robots + noindex + OG + sitemap', () => {
  test('files exist and contain expected exports/content', async () => {
    const files = [
      'frontend/web/app/robots.ts',
      'frontend/web/app/trip/[slug]/opengraph-image.tsx',
      'frontend/web/app/profile/[username]/opengraph-image.tsx',
      'frontend/web/app/(seo)/sitemap.ts',
      'frontend/web/app/trip/[slug]/page.tsx',
      'frontend/web/app/profile/[username]/page.tsx',
    ];
    for (const f of files) expect(existsSync(f), `${f} missing`).toBe(true);

    const robots = readFileSync('frontend/web/app/robots.ts', 'utf8');
    expect(robots).toMatch(/export\s+const\s+robotsRules/);
    expect(robots).toMatch(/buildRobotsTxt/);
    // Verify disallow list is present in source and includes protected routes
    expect(robots).toMatch(/disallow\s*:\s*\[/i);
    expect(robots).toMatch(/'\/trip'/);
    expect(robots).toMatch(/'\/profile'/);
    expect(robots).toMatch(/'\/account'/);

    const tripPage = readFileSync('frontend/web/app/trip/[slug]/page.tsx', 'utf8');
    expect(tripPage).toMatch(/robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);

    const profilePage = readFileSync('frontend/web/app/profile/[username]/page.tsx', 'utf8');
    expect(profilePage).toMatch(/robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);

    const ogTrip = readFileSync('frontend/web/app/trip/[slug]/opengraph-image.tsx', 'utf8');
    expect(ogTrip).toMatch(/buildOgImageForTrip/);
    expect(ogTrip).toMatch(/kind:\s*'og-image'/);

    const ogProfile = readFileSync('frontend/web/app/profile/[username]/opengraph-image.tsx', 'utf8');
    expect(ogProfile).toMatch(/buildOgImageForProfile/);
    expect(ogProfile).toMatch(/kind:\s*'og-image'/);

    const sitemap = readFileSync('frontend/web/app/(seo)/sitemap.ts', 'utf8');
    expect(sitemap).toMatch(/generateSitemap/);
    // ensure it includes search and does not include trip/profile/account references
    expect(sitemap).toMatch(/search/);
  });
});
