import { test, expect } from '@playwright/test';
import { createServer } from '../../backend/src/main';

test.describe('T14: Search public vs auth', () => {
  test('GET /search returns limited fields when unauthenticated, full when authorized', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to bind server');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    // Seed: profiles and trips
    let resp = await fetch(`${baseUrl}/profile/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1', username: 'Alice', bio: 'Wild life' }),
    });
    expect(resp.status).toBe(201);

    resp = await fetch(`${baseUrl}/profile/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u2', username: 'Bob', bio: 'Cave diver' }),
    });
    expect(resp.status).toBe(201);

    resp = await fetch(`${baseUrl}/trip/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId: 'u1', title: 'Safari Adventure' }),
    });
    expect(resp.status).toBe(201);
    const t1 = (await resp.json()) as { ok: boolean; trip: any };
    const slug = t1.trip.slug as string;

    resp = await fetch(`${baseUrl}/trip/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId: 'u2', title: 'Secret Cave', isPrivate: true }),
    });
    expect(resp.status).toBe(201);

    // Unauthenticated search
    let r = await fetch(`${baseUrl}/search?q=a&kind=all&sort=title&order=asc`);
    expect(r.status).toBe(200);
    let json = (await r.json()) as {
      ok: boolean;
      trips: any[];
      profiles: any[];
      counts: { trips: number; profiles: number };
    };
    expect(json.ok).toBe(true);
    // Private trip excluded; only public trip seen
    expect(json.trips.length).toBe(1);
    expect(json.trips[0].slug).toBe(slug);
    expect('ownerId' in json.trips[0]).toBe(false);
    const pAlice = json.profiles.find((p) => p.username.toLowerCase() === 'alice');
    expect(pAlice).toBeTruthy();
    expect('bio' in pAlice).toBe(false);

    // Authenticated search (simulate via Authorization header)
    r = await fetch(`${baseUrl}/search?q=a&kind=all&sort=title&order=asc`, {
      headers: { Authorization: 'Bearer test' },
    });
    expect(r.status).toBe(200);
    json = (await r.json()) as any;
    expect(json.ok).toBe(true);
    expect(json.trips.length).toBe(1);
    expect(json.trips[0].ownerId).toBe('u1');
    const pAliceFull = json.profiles.find((p: any) => p.username.toLowerCase() === 'alice');
    expect(pAliceFull.bio).toBe('Wild life');

    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  });
});

