import { test, expect } from '@playwright/test';
import { createServer } from '../../backend/src/main';

test.describe('T12: Bookmarks & Participation', () => {
  test('bookmark/unbookmark and join/leave; list by user', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to bind server');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    // helper: create trip
    const mkTrip = async (payload: any) => {
      const resp = await fetch(`${baseUrl}/trip/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(resp.status).toBe(201);
      const json = (await resp.json()) as { ok: boolean; trip: any };
      expect(json.ok).toBe(true);
      return json.trip;
    };

    const t1 = await mkTrip({ ownerId: 'owner1', title: 'Blue Lagoon' });
    const t2 = await mkTrip({ ownerId: 'owner2', title: 'Red Canyon' });

    // bookmark t1 for user u1
    const doBookmark = async (userId: string, tripId: string) => {
      const resp = await fetch(`${baseUrl}/trip/bookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tripId }),
      });
      expect([200, 201]).toContain(resp.status);
      const json = (await resp.json()) as { ok: boolean; bookmarked: boolean };
      expect(json.ok).toBe(true);
    };
    await doBookmark('u1', t1.id);
    await doBookmark('u1', t1.id); // idempotent

    // join t2 for user u1
    const doJoin = async (userId: string, tripId: string) => {
      const resp = await fetch(`${baseUrl}/trip/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tripId }),
      });
      expect([200, 201]).toContain(resp.status);
      const json = (await resp.json()) as { ok: boolean; joined: boolean };
      expect(json.ok).toBe(true);
    };
    await doJoin('u1', t2.id);
    await doJoin('u1', t2.id); // idempotent

    // list bookmarks
    const bResp = await fetch(`${baseUrl}/trip/bookmarks?userId=u1`);
    expect(bResp.status).toBe(200);
    const b = (await bResp.json()) as { ok: boolean; trips: any[] };
    expect(b.ok).toBe(true);
    expect(b.trips.map((x) => x.id)).toEqual([t1.id]);

    // list attended
    const aResp = await fetch(`${baseUrl}/trip/attended?userId=u1`);
    expect(aResp.status).toBe(200);
    const a = (await aResp.json()) as { ok: boolean; trips: any[] };
    expect(a.ok).toBe(true);
    expect(a.trips.map((x) => x.id)).toEqual([t2.id]);

    // unbookmark / leave
    const doUnbookmark = async (userId: string, tripId: string) => {
      const resp = await fetch(`${baseUrl}/trip/unbookmark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tripId }),
      });
      expect(resp.status).toBe(200);
      const json = (await resp.json()) as { ok: boolean; bookmarked: boolean };
      expect(json.ok).toBe(true);
    };
    await doUnbookmark('u1', t1.id);

    const doLeave = async (userId: string, tripId: string) => {
      const resp = await fetch(`${baseUrl}/trip/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, tripId }),
      });
      expect(resp.status).toBe(200);
      const json = (await resp.json()) as { ok: boolean; joined: boolean };
      expect(json.ok).toBe(true);
    };
    await doLeave('u1', t2.id);

    const b2 = await (await fetch(`${baseUrl}/trip/bookmarks?userId=u1`)).json();
    expect((b2 as any).trips).toEqual([]);
    const a2 = await (await fetch(`${baseUrl}/trip/attended?userId=u1`)).json();
    expect((a2 as any).trips).toEqual([]);

    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  });
});

