import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

test.describe('T24: Errors & Observability', () => {
  test('files exist and contain expected exports/content', async () => {
    const files = [
      'backend/src/common/logging.interceptor.ts',
      'backend/src/common/http-exception.filter.ts',
      'frontend/web/app/error.tsx',
      'frontend/web/app/global-error.tsx',
      'frontend/web/lib/log.ts',
      'backend/src/main.ts',
    ];
    for (const f of files) expect(existsSync(f), `${f} missing`).toBe(true);

    const logging = readFileSync('backend/src/common/logging.interceptor.ts', 'utf8');
    expect(logging).toMatch(/export\s+function\s+attachLogging/);
    expect(logging).toMatch(/export\s+class\s+LoggingInterceptor/);
    expect(logging).toMatch(/X-Request-Id/);

    const filter = readFileSync('backend/src/common/http-exception.filter.ts', 'utf8');
    expect(filter).toMatch(/export\s+class\s+HttpExceptionFilter/);
    expect(filter).toMatch(/application\/json/);

    const main = readFileSync('backend/src/main.ts', 'utf8');
    expect(main).toMatch(/X-Request-Id/);
    expect(main).toMatch(/HttpExceptionFilter/);

    const err = readFileSync('frontend/web/app/error.tsx', 'utf8');
    expect(err).toMatch(/export\s+default\s+function\s+Error/);
    expect(err).toMatch(/reset\(\)/);

    const gerr = readFileSync('frontend/web/app/global-error.tsx', 'utf8');
    expect(gerr).toMatch(/use client/);
    expect(gerr).toMatch(/export\s+default\s+function\s+GlobalError/);

    const flog = readFileSync('frontend/web/lib/log.ts', 'utf8');
    expect(flog).toMatch(/export\s+function\s+logEvent/);
    expect(flog).toMatch(/export\s+function\s+logError/);
    expect(flog).toMatch(/withRequestId/);
  });
});

