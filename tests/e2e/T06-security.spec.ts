import { test, expect } from '@playwright/test';
import { createServer } from '../../backend/src/main';

test.describe('T06: Security hardening', () => {
  test('security headers present on /health', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to bind server');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('referrer-policy')).toBe('no-referrer');

    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  });

  test('signup requires CAPTCHA; rate limit applies on auth endpoints', async () => {
    process.env.CAPTCHA_TEST_MODE = '1';
    process.env.ENFORCE_CAPTCHA_SIGNUP = '1';
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to bind server');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const email = 'rate@example.com';
    const password = 'abc12345';

    // Missing CAPTCHA should fail
    let res = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    expect(res.status).toBe(400);

    // Provide valid CAPTCHA header
    res = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-captcha-token': 'TEST_OK' },
      body: JSON.stringify({ email, password }),
    });
    expect(res.status).toBe(201);

    // Hammer login to trigger rate limit (max 10/min configured)
    let lastStatus = 0;
    for (let i = 0; i < 12; i++) {
      const r = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      lastStatus = r.status;
    }
    expect(lastStatus).toBe(429);

    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  });
});
