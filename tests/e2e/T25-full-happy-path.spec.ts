import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

test.describe('T25: Docker Compose, Seeds, CI', () => {
  test('files exist and contain expected content', async () => {
    const files = [
      'docker-compose.yml',
      'backend/prisma/seed.ts',
      '.github/workflows/ci.yml',
    ];
    for (const f of files) expect(existsSync(f), `${f} missing`).toBe(true);

    // docker-compose content checks
    const dc = readFileSync('docker-compose.yml', 'utf8');
    expect(dc).toMatch(/services:/);
    expect(dc).toMatch(/db:/);
    expect(dc).toMatch(/image:\s*postgres/);
    expect(dc).toMatch(/backend:/);
    expect(dc).toMatch(/frontend:/);
    // localstack is optional but included by default here
    expect(dc).toMatch(/localstack:/);
    expect(dc).toMatch(/DATABASE_URL/);

    // seed script structure
    const seed = readFileSync('backend/prisma/seed.ts', 'utf8');
    expect(seed).toMatch(/export\s+const\s+demoUsers/);
    expect(seed).toMatch(/export\s+const\s+demoTrips/);
    expect(seed).toMatch(/export\s+async\s+function\s+seed/);
    expect(seed).toMatch(/uniqueSlug/);

    // CI workflow essential steps
    const ci = readFileSync('.github/workflows/ci.yml', 'utf8');
    expect(ci).toMatch(/on:/);
    expect(ci).toMatch(/push:/);
    expect(ci).toMatch(/pull_request:/);
    expect(ci).toMatch(/setup-node/);
    expect(ci).toMatch(/npm ci/);
    expect(ci).toMatch(/npm run verify:tasks/);
    expect(ci).toMatch(/npm run test:all/);

    // Runtime execution of the seed is covered by a unit test. Here we assert
    // structure only to keep the E2E run hermetic without module loader quirks.
  });
});
