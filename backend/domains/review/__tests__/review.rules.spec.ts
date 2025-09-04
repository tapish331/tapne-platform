import { describe, it, expect } from 'vitest';
import { TripService } from '../../trip/trip.service';
import { ReviewService } from '../review.service';

describe('T10: Reviews Domain rules', () => {
  it('enforces one review per user per trip and prevents owner from reviewing own trip', () => {
    const trips = new TripService();
    const t = trips.create({ ownerId: 'owner1', title: 'Hidden Valley' });

    const reviews = new ReviewService(trips);

    // Owner cannot review own trip
    expect(() => reviews.create({ tripId: t.id, userId: 'owner1', rating: 5 })).toThrow();

    // Non-owner can create a review
    const r1 = reviews.create({ tripId: t.id, userId: 'u2', rating: 4, comment: 'Great!' });
    expect(r1.tripId).toBe(t.id);
    expect(r1.userId).toBe('u2');
    expect(r1.rating).toBe(4);

    // Same user cannot review the same trip twice
    expect(() => reviews.create({ tripId: t.id, userId: 'u2', rating: 3 })).toThrow();

    // Another user can review
    const r2 = reviews.create({ tripId: t.id, userId: 'u3', rating: 5 });
    expect(r2.userId).toBe('u3');

    // List by trip returns both reviews
    const list = reviews.listByTrip(t.id);
    expect(list.length).toBe(2);
    expect(list.map((r) => r.userId).sort()).toEqual(['u2', 'u3']);
  });

  it('validates rating range 1..5', () => {
    const trips = new TripService();
    const t = trips.create({ ownerId: 'o', title: 'Cave' });
    const reviews = new ReviewService(trips);
    expect(() => reviews.create({ tripId: t.id, userId: 'u', rating: 0 })).toThrow();
    expect(() => reviews.create({ tripId: t.id, userId: 'u', rating: 6 })).toThrow();
  });
});

