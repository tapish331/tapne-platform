import { test, expect } from '@playwright/test';
import { createServer } from '../../backend/src/main';

test.describe('T10: Review flow', () => {
  test('owner cannot review; one review per user per trip', async () => {
    const server = createServer();
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Failed to bind server');
    const baseUrl = `http://127.0.0.1:${address.port}`;

    // Create a trip
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

    const trip = await mkTrip({ ownerId: 'ownerZ', title: 'Misty Mountain' });

    // Owner cannot review own trip
    const respOwner = await fetch(`${baseUrl}/review/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId: trip.id, userId: 'ownerZ', rating: 5 }),
    });
    expect(respOwner.status).toBe(400);
    const errOwner = (await respOwner.json()) as { ok: boolean; error: string };
    expect(errOwner.ok).toBe(false);

    // Non-owner creates a review
    const mkReview = async (payload: any) => {
      const resp = await fetch(`${baseUrl}/review/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      expect(resp.status).toBe(201);
      const json = (await resp.json()) as { ok: boolean; review: any };
      expect(json.ok).toBe(true);
      return json.review;
    };

    const r1 = await mkReview({ tripId: trip.id, userId: 'u2', rating: 4, comment: 'Nice!' });
    expect(r1.tripId).toBe(trip.id);

    // Same user cannot review the same trip twice
    const dup = await fetch(`${baseUrl}/review/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId: trip.id, userId: 'u2', rating: 3 }),
    });
    expect(dup.status).toBe(400);

    // Listing by trip returns the one review
    const list = await fetch(`${baseUrl}/review?tripId=${encodeURIComponent(trip.id)}`);
    expect(list.status).toBe(200);
    const l = (await list.json()) as { ok: boolean; reviews: any[] };
    expect(l.ok).toBe(true);
    expect(l.reviews.length).toBe(1);
    expect(l.reviews[0].userId).toBe('u2');

    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  });
});

