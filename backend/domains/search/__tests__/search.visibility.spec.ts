import { describe, it, expect } from 'vitest';
import { TripService } from '../../trip/trip.service';
import { ProfileService } from '../../profile/profile.service';
import { SearchService } from '../search.service';

describe('T14: Search visibility (public vs auth)', () => {
  it('returns limited fields for unauthenticated and full for authenticated', () => {
    const tripSvc = new TripService();
    const profSvc = new ProfileService();
    const search = new SearchService(tripSvc, profSvc);

    // Seed trips (one private)
    const t1 = tripSvc.create({ ownerId: 'u1', title: 'Safari Adventure' });
    const t2 = tripSvc.create({ ownerId: 'u2', title: 'Secret Cave', isPrivate: true });

    // Seed profiles
    profSvc.create({ userId: 'u1', username: 'Alice', bio: 'Love wild life' });
    profSvc.create({ userId: 'u2', username: 'Bob', bio: 'Cave diver' });

    const pub = search.search({ q: 'a', kind: 'all', isAuthenticated: false, sort: 'title', order: 'asc' });
    expect(pub.ok).toBe(true);
    // Private trips should be excluded
    expect(pub.trips.length).toBe(1);
    const tripPub = pub.trips[0] as any;
    expect(tripPub.title).toBe('Safari Adventure');
    expect(tripPub.slug).toBe(t1.slug);
    // Limited fields: ownerId is not present
    expect('ownerId' in tripPub).toBe(false);

    const auth = search.search({ q: 'a', kind: 'all', isAuthenticated: true, sort: 'title', order: 'asc' });
    expect(auth.ok).toBe(true);
    // Still excludes private by default
    expect(auth.trips.length).toBe(1);
    const tripFull = auth.trips[0] as any;
    expect(tripFull.ownerId).toBe('u1');
    expect(typeof tripFull.createdAt).toBe('number');

    // Profiles: public returns limited fields
    const pPub = pub.profiles.find((p: any) => p.username.toLowerCase() === 'alice') as any;
    expect(pPub).toBeTruthy();
    expect('bio' in pPub).toBe(false);
    const pFull = auth.profiles.find((p: any) => p.username.toLowerCase() === 'alice') as any;
    expect(pFull).toBeTruthy();
    expect(pFull.bio).toBe('Love wild life');
  });
});

