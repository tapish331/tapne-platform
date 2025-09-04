import { describe, it, expect } from 'vitest';
import { TripService } from '../../trip/trip.service';

describe('T09: Trips Domain CRUD + pagination/slug/privacy', () => {
  it('creates trips, generates unique slugs, updates title->slug, toggles privacy', () => {
    const svc = new TripService();
    const t1 = svc.create({ ownerId: 'u1', title: 'Alpine Adventure' });
    expect(t1.slug).toBe('alpine-adventure');
    const t2 = svc.create({ ownerId: 'u2', title: 'Alpine Adventure' });
    expect(t2.slug).toBe('alpine-adventure-2');

    const updated = svc.update({ id: t1.id, title: 'Alpine Adventures' });
    expect(updated.slug).toBe('alpine-adventures');
    // Ensure slug index moved for the updated trip; do not reassign other trips' slugs
    expect(svc.getBySlug('alpine-adventures')?.id).toBe(t1.id);
    expect(svc.getBySlug(t2.slug)?.id).toBe(t2.id);

    const priv = svc.update({ id: t2.id, isPrivate: true });
    expect(priv.isPrivate).toBe(true);
  });

  it('lists with pagination/sort and respects privacy by default', () => {
    const svc = new TripService();
    // 3 public, 2 private owned by u1
    const a = svc.create({ ownerId: 'u1', title: 'Bali Escape' });
    const b = svc.create({ ownerId: 'u2', title: 'Zanzibar' });
    const c = svc.create({ ownerId: 'u3', title: 'Alps' });
    const d = svc.create({ ownerId: 'u1', title: 'Secret Cave', isPrivate: true });
    const e = svc.create({ ownerId: 'u1', title: 'Hidden Falls', isPrivate: true });
    // default: createdAt desc, exclude private
    const list1 = svc.list();
    expect(list1.items.map((x) => x.id)).toEqual([c.id, b.id, a.id]);
    expect(list1.total).toBe(3);

    // include private for owner u1 when requested
    const list2 = svc.list({ includePrivateForOwnerId: 'u1', sort: 'title', order: 'asc' });
    expect(list2.items.map((x) => x.title)).toEqual(['Alps', 'Bali Escape', 'Hidden Falls', 'Secret Cave', 'Zanzibar']);

    // pagination
    const p1 = svc.list({ page: 1, pageSize: 2, includePrivateForOwnerId: 'u1', sort: 'createdAt', order: 'asc' });
    const p2 = svc.list({ page: 2, pageSize: 2, includePrivateForOwnerId: 'u1', sort: 'createdAt', order: 'asc' });
    expect(p1.items.length).toBe(2);
    expect(p2.items.length).toBe(2);
    expect(p1.total).toBe(5);
  });
});
