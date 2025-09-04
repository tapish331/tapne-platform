import { describe, it, expect } from 'vitest';
import { TripService } from '../../trip/trip.service';
import { BookmarkService } from '../../trip/bookmark.service';
import { ParticipationService } from '../../trip/participation.service';

describe('T12: Bookmarks & Participation', () => {
  it('bookmarks are idempotent and listable; unbookmark works', () => {
    const trips = new TripService();
    const t1 = trips.create({ ownerId: 'u1', title: 'Hidden Lake' });
    const t2 = trips.create({ ownerId: 'u2', title: 'Alpine Pass' });
    const svc = new BookmarkService(trips);

    expect(svc.listTripIdsByUser('z')).toEqual([]);
    svc.bookmark({ userId: 'z', tripId: t1.id });
    svc.bookmark({ userId: 'z', tripId: t1.id }); // idempotent
    expect(svc.isBookmarked('z', t1.id)).toBe(true);
    expect(svc.listTripsByUser('z').map((x) => x.id)).toEqual([t1.id]);

    svc.bookmark({ userId: 'z', tripId: t2.id });
    expect(new Set(svc.listTripIdsByUser('z'))).toEqual(new Set([t1.id, t2.id]));

    svc.unbookmark({ userId: 'z', tripId: t1.id });
    expect(svc.isBookmarked('z', t1.id)).toBe(false);
    expect(svc.listTripIdsByUser('z')).toEqual([t2.id]);

    // idempotent unbookmark
    svc.unbookmark({ userId: 'z', tripId: t1.id });
    expect(svc.listTripIdsByUser('z')).toEqual([t2.id]);
  });

  it('participation join/leave is idempotent and listable', () => {
    const trips = new TripService();
    const t1 = trips.create({ ownerId: 'a', title: 'Canyon Walk' });
    const t2 = trips.create({ ownerId: 'b', title: 'River Run' });
    const svc = new ParticipationService(trips);

    svc.join({ userId: 'uX', tripId: t1.id });
    svc.join({ userId: 'uX', tripId: t1.id });
    expect(svc.isAttendee('uX', t1.id)).toBe(true);
    expect(svc.listTripsByUser('uX').map((x) => x.id)).toEqual([t1.id]);

    svc.join({ userId: 'uX', tripId: t2.id });
    expect(new Set(svc.listTripIdsByUser('uX'))).toEqual(new Set([t1.id, t2.id]));

    svc.leave({ userId: 'uX', tripId: t1.id });
    expect(svc.isAttendee('uX', t1.id)).toBe(false);
    expect(svc.listTripIdsByUser('uX')).toEqual([t2.id]);

    svc.leave({ userId: 'uX', tripId: t1.id }); // idempotent
    expect(svc.listTripIdsByUser('uX')).toEqual([t2.id]);
  });

  it('validates trip existence', () => {
    const trips = new TripService();
    const b = new BookmarkService(trips);
    const p = new ParticipationService(trips);
    expect(() => b.bookmark({ userId: 'u', tripId: 'nope' })).toThrow();
    expect(() => p.join({ userId: 'u', tripId: 'nope' })).toThrow();
  });
});

