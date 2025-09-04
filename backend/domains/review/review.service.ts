import crypto from 'node:crypto';
import type { TripService, TripRecord } from '../trip/trip.service';

export type ReviewInput = {
  tripId: string;
  userId: string;
  rating: number; // 1..5
  comment?: string | null;
};

export type ReviewRecord = {
  id: string;
  tripId: string;
  userId: string;
  rating: number;
  comment: string | null;
  createdAt: number; // epoch ms
};

export class ReviewService {
  private readonly byId = new Map<string, ReviewRecord>();
  private readonly byTripUser = new Map<string, ReviewRecord>(); // key: `${tripId}:${userId}`
  private readonly byTrip = new Map<string, ReviewRecord[]>();

  constructor(private readonly tripService: TripService) {}

  private key(tripId: string, userId: string): string {
    return `${tripId}:${userId}`;
  }

  private ensureAllowed(input: ReviewInput): void {
    const { tripId, userId, rating } = input;
    if (!tripId || !userId) throw new Error('tripId and userId are required');
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('rating must be 1..5');
    const trip: TripRecord | undefined = this.tripService.getById(tripId);
    if (!trip) throw new Error('Trip not found');
    if (trip.ownerId === userId) throw new Error('Owner cannot review own trip');
    if (this.byTripUser.has(this.key(tripId, userId))) throw new Error('Review already exists for this user/trip');
  }

  create(input: ReviewInput): ReviewRecord {
    this.ensureAllowed(input);
    const now = Date.now();
    const rec: ReviewRecord = {
      id: crypto.randomUUID(),
      tripId: input.tripId,
      userId: input.userId,
      rating: input.rating,
      comment: input.comment ?? null,
      createdAt: now,
    };
    this.byId.set(rec.id, rec);
    this.byTripUser.set(this.key(rec.tripId, rec.userId), rec);
    const arr = this.byTrip.get(rec.tripId) || [];
    arr.push(rec);
    this.byTrip.set(rec.tripId, arr);
    return { ...rec };
  }

  listByTrip(tripId: string): ReviewRecord[] {
    const arr = this.byTrip.get(tripId) || [];
    return arr.map((r) => ({ ...r }));
  }
}

