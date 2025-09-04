import type { TripService, TripRecord } from './trip.service';

export type ParticipationPair = {
  userId: string;
  tripId: string;
};

export class ParticipationService {
  private readonly pairs = new Set<string>(); // key: userId:tripId
  private readonly byUser = new Map<string, Set<string>>(); // userId -> set of tripIds

  constructor(private readonly tripService: TripService) {}

  private key(userId: string, tripId: string): string {
    return `${userId}:${tripId}`;
  }

  private ensureValid({ userId, tripId }: ParticipationPair): void {
    if (!userId || !tripId) throw new Error('userId and tripId are required');
    const trip: TripRecord | undefined = this.tripService.getById(tripId);
    if (!trip) throw new Error('Trip not found');
  }

  join(input: ParticipationPair): void {
    this.ensureValid(input);
    const k = this.key(input.userId, input.tripId);
    if (this.pairs.has(k)) return; // idempotent
    this.pairs.add(k);
    const set = this.byUser.get(input.userId) || new Set<string>();
    set.add(input.tripId);
    this.byUser.set(input.userId, set);
  }

  leave(input: ParticipationPair): void {
    this.ensureValid(input);
    const k = this.key(input.userId, input.tripId);
    if (!this.pairs.has(k)) return; // idempotent
    this.pairs.delete(k);
    const set = this.byUser.get(input.userId);
    if (set) {
      set.delete(input.tripId);
      if (set.size === 0) this.byUser.delete(input.userId);
    }
  }

  isAttendee(userId: string, tripId: string): boolean {
    return this.pairs.has(this.key(userId, tripId));
  }

  listTripIdsByUser(userId: string): string[] {
    return Array.from(this.byUser.get(userId) || []);
  }

  listTripsByUser(userId: string): TripRecord[] {
    const ids = this.listTripIdsByUser(userId);
    const out: TripRecord[] = [];
    for (const id of ids) {
      const t = this.tripService.getById(id);
      if (t) out.push(t);
    }
    return out;
  }
}

