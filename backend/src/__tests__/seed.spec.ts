import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

describe('T25: Seed script basics', () => {
  it('seed.ts exists and exports expected symbols', async () => {
    const file = path.join(process.cwd(), 'prisma/seed.ts');
    expect(existsSync(file), 'backend/prisma/seed.ts missing').toBe(true);
    const content = readFileSync(file, 'utf8');

    // Static checks on file content
    expect(content).toMatch(/export\s+const\s+demoUsers/);
    expect(content).toMatch(/export\s+const\s+demoTrips/);
    expect(content).toMatch(/export\s+async\s+function\s+seed/);
    expect(content).toMatch(/export\s+function\s+buildDatabaseUrlFromEnv/);

    // Runtime import and shape checks
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const mod: any = await import('../../prisma/seed');
    expect(Array.isArray(mod.demoUsers)).toBe(true);
    expect(Array.isArray(mod.demoTrips)).toBe(true);
    expect(typeof mod.seed).toBe('function');

    // Call seed with a minimal Prisma-like mock to ensure it runs
    const calls: any[] = [];
    const prismaMock = {
      user: { upsert: (args: any) => void calls.push({ model: 'user', args }) },
      profile: { upsert: (args: any) => void calls.push({ model: 'profile', args }) },
      trip: { upsert: (args: any) => void calls.push({ model: 'trip', args }) },
    };
    const res = await mod.seed(prismaMock);
    expect(res.ok).toBe(true);
    expect(res.counts.users).toBeGreaterThanOrEqual(3);
    expect(res.counts.trips).toBeGreaterThanOrEqual(3);
    expect(calls.some((c) => c.model === 'user')).toBe(true);
    expect(calls.some((c) => c.model === 'profile')).toBe(true);
    expect(calls.some((c) => c.model === 'trip')).toBe(true);
  });
});
