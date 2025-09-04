import { test, expect } from '@playwright/test';
import { createServer } from '../../backend/src/main';

test.describe('T13: Moderation endpoints + trip filtering', () => {
  test('block/unblock and report, with list excluding blocked owners', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to bind server');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    // Create trips owned by u2 and u3
    let res = await fetch(`${baseUrl}/trip/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId: 'u2', title: 'Beach' }),
    });
    expect(res.status).toBe(201);
    await res.json();
    res = await fetch(`${baseUrl}/trip/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId: 'u3', title: 'Canyon' }),
    });
    expect(res.status).toBe(201);
    await res.json();

    // uX blocks u2
    res = await fetch(`${baseUrl}/moderation/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockerId: 'uX', blockedId: 'u2' }),
    });
    expect(res.status).toBe(201);
    const blockResp = (await res.json()) as { ok: boolean; blocked: boolean; blockedIds: string[] };
    expect(blockResp.ok).toBe(true);
    expect(blockResp.blocked).toBe(true);
    expect(blockResp.blockedIds).toContain('u2');

    // Trip list should exclude u2's trips for viewer uX
    res = await fetch(`${baseUrl}/trip?excludeBlockedForUserId=uX&sort=title&order=asc`);
    expect(res.status).toBe(200);
    const list1 = (await res.json()) as { ok: boolean; items: { title: string; ownerId: string }[] };
    expect(list1.ok).toBe(true);
    expect(list1.items.map((t) => t.title)).toEqual(['Canyon']);

    // Unblock restores visibility
    res = await fetch(`${baseUrl}/moderation/unblock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockerId: 'uX', blockedId: 'u2' }),
    });
    expect(res.status).toBe(200);

    res = await fetch(`${baseUrl}/trip?excludeBlockedForUserId=uX&sort=title&order=asc`);
    const list2 = (await res.json()) as { ok: boolean; items: { title: string }[] };
    expect(list2.items.map((t) => t.title)).toEqual(['Beach', 'Canyon']);

    // Report a user and a trip
    res = await fetch(`${baseUrl}/moderation/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reporterId: 'uX', targetType: 'user', targetId: 'u2', reason: 'spam' }),
    });
    expect(res.status).toBe(201);
    const report1 = (await res.json()) as { ok: boolean; report: { id: string; targetType: string } };
    expect(report1.ok).toBe(true);
    expect(report1.report.id).toBeTruthy();
    expect(report1.report.targetType).toBe('user');

    res = await fetch(`${baseUrl}/moderation/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reporterId: 'uX', targetType: 'trip', targetId: 't1' }),
    });
    expect(res.status).toBe(201);

    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  });
});

