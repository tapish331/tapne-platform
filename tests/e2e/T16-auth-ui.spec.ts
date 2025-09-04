import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

test.describe('T16: Auth UI + middleware', () => {
  test('frontend auth pages, api client, and middleware exist with expected content', async () => {
    const files = [
      'frontend/web/app/account/(auth)/login/page.tsx',
      'frontend/web/app/account/(auth)/signup/page.tsx',
      'frontend/web/app/account/(auth)/verify/page.tsx',
      'frontend/web/app/account/(auth)/reset/page.tsx',
      'frontend/web/lib/api.ts',
      'frontend/web/middleware.ts',
    ];
    for (const f of files) expect(existsSync(f), `${f} missing`).toBe(true);

    const login = readFileSync('frontend/web/app/account/(auth)/login/page.tsx', 'utf8');
    expect(login).toMatch(/export\s+const\s+metadata/);
    expect(login).toMatch(/export\s+default\s+function\s+LoginPage/);

    const middleware = readFileSync('frontend/web/middleware.ts', 'utf8');
    expect(middleware).toMatch(/PUBLIC_PATHS/);
    expect(middleware).toMatch(/matcher:\s*\[/);
    // Ensure Home and Search are public
    expect(middleware).toMatch(/'\/'/);
    expect(middleware).toMatch(/'\/search'/);

    const api = readFileSync('frontend/web/lib/api.ts', 'utf8');
    expect(api).toMatch(/export\s+const\s+apiClient/);
    expect(api).toMatch(/login\(/);
    expect(api).toMatch(/signup\(/);
  });
});

