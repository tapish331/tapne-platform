import { test, expect } from '@playwright/test';
import { createServer } from '../../backend/src/main';

test.describe('T05: Auth email flows (verify + reset)', () => {
  test('verify email and reset password end-to-end', async () => {
    process.env.E2E_EXPOSE_TOKENS = '1';
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to bind server');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const email = 'dana@example.com';
    const password = 'initialPass1';

    // Signup
    let res = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    expect(res.status).toBe(201);

    // Request verification, retrieve token (exposed in e2e)
    res = await fetch(`${baseUrl}/auth/email/send-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const v = (await res.json()) as { ok: boolean; token: string };
    expect(v.ok).toBe(true);
    expect(typeof v.token).toBe('string');

    // Verify via link
    res = await fetch(`${baseUrl}/auth/email/verify?token=${encodeURIComponent(v.token)}`);
    const vres = (await res.json()) as { ok: boolean; user?: any };
    expect(vres.ok).toBe(true);
    expect(vres.user?.email).toBe(email);
    expect(vres.user?.emailVerified).toBe(true);

    // Request reset
    res = await fetch(`${baseUrl}/auth/email/send-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const r = (await res.json()) as { ok: boolean; token: string };
    expect(r.ok).toBe(true);
    expect(typeof r.token).toBe('string');

    // Reset using token
    const newPassword = 'newSecret99';
    res = await fetch(`${baseUrl}/auth/email/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: r.token, newPassword }),
    });
    const rres = (await res.json()) as { ok: boolean };
    expect(rres.ok).toBe(true);

    // Login using new password
    res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: newPassword }),
    });
    const logged = (await res.json()) as { ok: boolean; user: { email: string } };
    expect(logged.ok).toBe(true);
    expect(logged.user.email).toBe(email);

    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  });
});

