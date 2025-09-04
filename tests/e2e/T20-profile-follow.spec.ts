import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

test.describe('T20: Profile page presence + follow + visibility wiring', () => {
  test('profile files exist with expected exports and content', async () => {
    const files = [
      'frontend/web/app/profile/[username]/page.tsx',
      'frontend/web/features/profile/Hero.tsx',
      'frontend/web/features/profile/Body.tsx',
      'frontend/web/features/profile/VisibilityToggles.tsx',
      'frontend/web/lib/server/profile.mutations.ts',
    ];
    for (const f of files) expect(existsSync(f), `${f} missing`).toBe(true);

    const page = readFileSync('frontend/web/app/profile/[username]/page.tsx', 'utf8');
    expect(page).toMatch(/export\s+const\s+metadata/);
    expect(page).toMatch(/export\s+default\s+function\s+ProfilePage/);
    expect(page).toMatch(/page:\s*'profile'/);

    const hero = readFileSync('frontend/web/features/profile/Hero.tsx', 'utf8');
    expect(hero).toMatch(/makeHero/);
    expect(hero).toMatch(/toggleFollowFromHero/);

    const body = readFileSync('frontend/web/features/profile/Body.tsx', 'utf8');
    expect(body).toMatch(/buildBody/);

    const toggles = readFileSync('frontend/web/features/profile/VisibilityToggles.tsx', 'utf8');
    expect(toggles).toMatch(/defaultVisibility/);
    expect(toggles).toMatch(/applyVisibilityPatch/);
    expect(toggles).toMatch(/isSectionVisible/);

    const mutations = readFileSync('frontend/web/lib/server/profile.mutations.ts', 'utf8');
    expect(mutations).toMatch(/getProfileByUsername/);
    expect(mutations).toMatch(/updateVisibility/);
    expect(mutations).toMatch(/follow/);
    expect(mutations).toMatch(/unfollow/);
    expect(mutations).toMatch(/toggleFollow/);
    expect(mutations).toMatch(/getCounts/);
  });
});

