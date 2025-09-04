import { describe, it, expect } from 'vitest';
import { ModerationService } from '../../moderation/moderation.service';
import { TripService } from '../../trip/trip.service';

describe('T13: Moderation — report & block/mute enforcement', () => {
  it('blocks/unblocks users; list filters exclude blocked owners (symmetrically)', () => {
    const mod = new ModerationService();
    const trips = new TripService(mod);

    const a = trips.create({ ownerId: 'u1', title: 'Alpine' });
    const b = trips.create({ ownerId: 'u2', title: 'Beach' });
    const c = trips.create({ ownerId: 'u3', title: 'Canyon' });

    // Baseline: 3 public trips visible
    expect(trips.list().total).toBe(3);

    // uX blocks u2 => should hide trips by u2 to uX
    mod.block('uX', 'u2');
    const list1 = trips.list({ excludeBlockedForUserId: 'uX', sort: 'title', order: 'asc' });
    expect(list1.items.map((t) => t.title)).toEqual(['Alpine', 'Canyon']);

    // Symmetry: if u2 blocks uX, also hide (even if viewer didn't block)
    // First unblock to reset
    mod.unblock('uX', 'u2');
    mod.block('u2', 'uX');
    const list2 = trips.list({ excludeBlockedForUserId: 'uX', sort: 'title', order: 'asc' });
    expect(list2.items.map((t) => t.title)).toEqual(['Alpine', 'Canyon']);

    // Unblock restores visibility
    mod.unblock('u2', 'uX');
    const list3 = trips.list({ excludeBlockedForUserId: 'uX', sort: 'title', order: 'asc' });
    expect(list3.items.map((t) => t.title)).toEqual(['Alpine', 'Beach', 'Canyon']);

    // Mute is separate; should not affect list filtering in this simplified backend
    mod.mute('uX', 'u3');
    const list4 = trips.list({ excludeBlockedForUserId: 'uX', sort: 'title', order: 'asc' });
    expect(list4.items.map((t) => t.title)).toEqual(['Alpine', 'Beach', 'Canyon']);
  });

  it('creates reports for users or trips', () => {
    const mod = new ModerationService();
    const r1 = mod.createReport({ reporterId: 'u1', targetType: 'user', targetId: 'uZ', reason: 'harassment' });
    const r2 = mod.createReport({ reporterId: 'u1', targetType: 'trip', targetId: 't1' });
    expect(r1.id).toBeTruthy();
    expect(r1.targetType).toBe('user');
    expect(r2.targetType).toBe('trip');
    const mine = mod.listReportsByReporter('u1');
    expect(mine.length).toBe(2);
  });
});

