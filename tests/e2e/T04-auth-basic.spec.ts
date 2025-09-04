import { test, expect } from '@playwright/test';
import { createServer } from '../../backend/src/main';
import { JwtStrategy } from '../../backend/domains/auth/strategies/jwt.strategy';

test.describe('T04: Auth basic signup/login', () => {
  test('POST /auth/signup then /auth/login issues a valid access token', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to bind server');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const email = 'carol@example.com';
    const password = 'testpass123';

    let res = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    expect(res.status).toBe(201);
    const created = (await res.json()) as { ok: boolean; user: { id: string; email: string } };
    expect(created.ok).toBe(true);
    expect(created.user.email).toBe(email);

    res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    expect(res.status).toBe(200);
    const logged = (await res.json()) as {
      ok: boolean;
      user: { id: string; email: string };
      accessToken: string;
    };
    expect(logged.ok).toBe(true);
    expect(logged.user.email).toBe(email);

    const jwt = new JwtStrategy({ JWT_SECRET: 'dev-secret' } as any);
    const result = jwt.verify(logged.accessToken);
    expect(result.valid).toBe(true);
    expect(result.payload?.sub).toBe(logged.user.id);

    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  });
});

