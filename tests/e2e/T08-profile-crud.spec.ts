import { test, expect } from '@playwright/test';
import { createServer } from '../../backend/src/main';

test.describe('T08: Profile CRUD + rules', () => {
  test('create, fetch, update; reserved and uniqueness enforced', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to bind server');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    // 1) Create a profile
    const createRes = await fetch(`${baseUrl}/profile/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1', username: 'Alice' }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { ok: boolean; profile: any };
    expect(created.ok).toBe(true);
    expect(created.profile.username).toBe('Alice');
    expect(created.profile.showUpcomingTrips).toBe(true);

    // 2) Fetch by username (case-insensitive)
    const getRes = await fetch(`${baseUrl}/profile/alice`);
    expect(getRes.status).toBe(200);
    const got = (await getRes.json()) as { ok: boolean; profile: any };
    expect(got.profile.userId).toBe('u1');

    // 3) Update username and toggle a flag
    const updRes = await fetch(`${baseUrl}/profile/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1', username: 'Traveler', showPastAttendance: false }),
    });
    expect(updRes.status).toBe(200);
    const updated = (await updRes.json()) as { ok: boolean; profile: any };
    expect(updated.profile.username).toBe('Traveler');
    expect(updated.profile.showPastAttendance).toBe(false);

    // 4) Reserved handle rejected
    const badRes = await fetch(`${baseUrl}/profile/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u2', username: 'admin' }),
    });
    expect(badRes.status).toBe(400);
    const bad = (await badRes.json()) as { ok: boolean; error: string };
    expect(bad.ok).toBe(false);

    // 5) Case-insensitive uniqueness enforced
    const dupRes = await fetch(`${baseUrl}/profile/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u3', username: 'traveler' }),
    });
    expect(dupRes.status).toBe(400);

    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  });
});

