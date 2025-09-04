import { test, expect } from '@playwright/test';
import { createServer } from '../../backend/src/main';

test.describe('T11: Follow/Unfollow endpoints + counts', () => {
  test('follow, idempotent, counts, unfollow', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to bind server');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const counts = async (userId: string) => {
      const resp = await fetch(`${baseUrl}/social/counts?userId=${encodeURIComponent(userId)}`);
      expect(resp.status).toBe(200);
      const json = (await resp.json()) as { ok: boolean; counts: { followers: number; following: number } };
      expect(json.ok).toBe(true);
      return json.counts;
    };

    // initial
    expect(await counts('u1')).toEqual({ followers: 0, following: 0 });
    expect(await counts('u2')).toEqual({ followers: 0, following: 0 });

    // follow u2 by u1
    const doFollow = async (followerId: string, followeeId: string) => {
      const resp = await fetch(`${baseUrl}/social/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId, followeeId }),
      });
      expect([200, 201]).toContain(resp.status);
      const json = (await resp.json()) as { ok: boolean; following: boolean };
      expect(json.ok).toBe(true);
      return json;
    };

    await doFollow('u1', 'u2');
    expect(await counts('u1')).toEqual({ followers: 0, following: 1 });
    expect(await counts('u2')).toEqual({ followers: 1, following: 0 });

    // idempotent
    await doFollow('u1', 'u2');
    expect(await counts('u1')).toEqual({ followers: 0, following: 1 });
    expect(await counts('u2')).toEqual({ followers: 1, following: 0 });

    // another user follows u2
    await doFollow('u3', 'u2');
    expect(await counts('u2')).toEqual({ followers: 2, following: 0 });

    // unfollow
    const doUnfollow = async (followerId: string, followeeId: string) => {
      const resp = await fetch(`${baseUrl}/social/unfollow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followerId, followeeId }),
      });
      expect(resp.status).toBe(200);
      const json = (await resp.json()) as { ok: boolean; following: boolean };
      expect(json.ok).toBe(true);
      return json;
    };

    await doUnfollow('u1', 'u2');
    expect(await counts('u1')).toEqual({ followers: 0, following: 0 });
    expect(await counts('u2')).toEqual({ followers: 1, following: 0 });

    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  });
});

