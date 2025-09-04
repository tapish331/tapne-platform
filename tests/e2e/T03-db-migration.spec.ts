import { test, expect } from '@playwright/test';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(__dirname, '..', '..');

function run(cmd: string[], cwd = ROOT, env: NodeJS.ProcessEnv = process.env): number {
  const res = spawnSync(cmd[0], cmd.slice(1), {
    stdio: 'inherit',
    cwd,
    shell: process.platform === 'win32',
    env: { ...process.env, ...env },
  });
  return res.status ?? 1;
}

test.describe('T03: Prisma setup', () => {
  test('prisma CLI available and schema validates/generates', async () => {
    // Ensure prisma is available
    const v = spawnSync('npx', ['--no', 'prisma', '--version'], {
      cwd: ROOT,
      shell: process.platform === 'win32',
      stdio: 'pipe',
      encoding: 'utf8',
    });
    expect(v.status).toBe(0);

    const schemaPath = path.join(ROOT, 'backend/prisma/schema.prisma');
    expect(existsSync(schemaPath), 'schema.prisma missing').toBe(true);

    // Provide DATABASE_URL explicitly to avoid machine-specific env assumptions
    const ENV = { DATABASE_URL: 'postgresql://user:password@localhost:5432/tapne' };

    // Validate schema
    expect(
      run(['npx', '--no', 'prisma', 'validate', '--schema', schemaPath], ROOT, ENV)
    ).toBe(0);

    // Generate client (no DB connection needed)
    expect(
      run(['npx', '--no', 'prisma', 'generate', '--schema', schemaPath], ROOT, ENV)
    ).toBe(0);

    // Check generated client exists
    const clientIndex = path.join(ROOT, 'node_modules', '@prisma', 'client', 'index.d.ts');
    expect(existsSync(clientIndex), 'generated client missing').toBe(true);
  });
});
