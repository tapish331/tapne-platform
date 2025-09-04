import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

test.describe('T23: Moderation UI presence + wiring', () => {
  test('moderation files exist with expected exports and references', async () => {
    const files = [
      'frontend/web/features/moderation/ReportButton.tsx',
      'frontend/web/features/moderation/BlockButton.tsx',
      'frontend/web/features/trip/TripView.tsx',
      'frontend/web/features/profile/Hero.tsx',
      'frontend/web/features/search/index.ts',
    ];
    for (const f of files) expect(existsSync(f), `${f} missing`).toBe(true);

    const report = readFileSync('frontend/web/features/moderation/ReportButton.tsx', 'utf8');
    expect(report).toMatch(/export\s+function\s+makeReportButton/);
    expect(report).toMatch(/export\s+function\s+reportEntity/);

    const block = readFileSync('frontend/web/features/moderation/BlockButton.tsx', 'utf8');
    expect(block).toMatch(/export\s+function\s+makeBlockButton/);
    expect(block).toMatch(/export\s+function\s+toggleBlock/);
    expect(block).toMatch(/export\s+function\s+isBlocked/);
    expect(block).toMatch(/export\s+function\s+filterSearchResultsForBlocked/);

    const tripView = readFileSync('frontend/web/features/trip/TripView.tsx', 'utf8');
    expect(tripView).toMatch(/export\s+function\s+attachModeration/);

    const hero = readFileSync('frontend/web/features/profile/Hero.tsx', 'utf8');
    expect(hero).toMatch(/attachModerationToHero/);

    const search = readFileSync('frontend/web/features/search/index.ts', 'utf8');
    expect(search).toMatch(/applyBlockFilter/);
  });
});

