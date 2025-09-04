/**
 * Deterministic in-memory trip mutations (T19)
 * No external deps; keeps unit tests fast.
 */

export type TripRecord = {
  id: string;
  slug: string;
  title: string;
  ownerId: string;
  isPrivate: boolean;
  createdAt: number;
};

export type Review = {
  tripSlug: string;
  userId: string;
  rating: number; // 1..5
  text: string;
  createdAt: number;
};

const trips = new Map<string, TripRecord>(); // key: slug
const reviews = new Map<string, Map<string, Review>>(); // key: slug -> userId -> Review
const bookmarks = new Map<string, Set<string>>(); // userId -> Set<slug>

function makeId() {
  // Simple increasing counter to keep deterministic
  const n = (makeId as any)._n || 1;
  (makeId as any)._n = n + 1;
  return `trip_${n}`;
}

function now(): number {
  const n = (now as any)._t || Date.now();
  const next = n + 1;
  (now as any)._t = next;
  return next;
}

function slugify(s: string): string {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function newTripDraft() {
  return { title: '', isPrivate: false };
}

export function getTripBySlug(slug: string): TripRecord | undefined {
  const key = String(slug || '').trim();
  if (!key) return undefined;
  return trips.get(key);
}

export function listBookmarks(userId: string): string[] {
  return Array.from(bookmarks.get(userId || '') || []);
}

export function createTrip(ownerId: string, input: { title: string; isPrivate?: boolean }) {
  const uid = String(ownerId || '').trim();
  if (!uid) return { ok: false as const, error: 'ownerId required' };
  const title = String(input?.title || '').trim();
  if (!title) return { ok: false as const, error: 'title required' };
  const base = slugify(title);
  let slug = base;
  let i = 1;
  while (slug && trips.has(slug)) {
    i += 1;
    slug = `${base}-${i}`;
  }
  const rec: TripRecord = {
    id: makeId(),
    slug,
    title,
    ownerId: uid,
    isPrivate: Boolean(input?.isPrivate),
    createdAt: now(),
  };
  trips.set(rec.slug, rec);
  return { ok: true as const, trip: rec };
}

export function updateTrip(ownerId: string, slug: string, patch: Partial<Pick<TripRecord, 'title' | 'isPrivate'>>) {
  const rec = getTripBySlug(slug);
  if (!rec) return { ok: false as const, error: 'not found' };
  if (rec.ownerId !== ownerId) return { ok: false as const, error: 'forbidden' };
  const next: TripRecord = { ...rec };
  if (typeof patch.title === 'string' && patch.title.trim() && patch.title !== rec.title) {
    // Update title and slug (basic re-slug)
    const title = patch.title.trim();
    const base = slugify(title);
    let newSlug = base;
    let i = 1;
    if (newSlug !== rec.slug) {
      while (newSlug && newSlug !== rec.slug && trips.has(newSlug)) {
        i += 1;
        newSlug = `${base}-${i}`;
      }
    }
    trips.delete(rec.slug);
    next.title = title;
    next.slug = newSlug;
  }
  if (typeof patch.isPrivate === 'boolean') next.isPrivate = patch.isPrivate;
  trips.set(next.slug, next);
  return { ok: true as const, trip: next };
}

export function toggleBookmark(userId: string, tripSlug: string) {
  const uid = String(userId || '').trim();
  const slug = String(tripSlug || '').trim();
  if (!uid || !slug) return { ok: false as const, error: 'bad input' };
  if (!trips.has(slug)) return { ok: false as const, error: 'trip not found' };
  let set = bookmarks.get(uid);
  if (!set) {
    set = new Set();
    bookmarks.set(uid, set);
  }
  if (set.has(slug)) {
    set.delete(slug);
    return { ok: true as const, bookmarked: false };
  }
  set.add(slug);
  return { ok: true as const, bookmarked: true };
}

export function submitReview(userId: string, tripSlug: string, rating: number, text: string) {
  const uid = String(userId || '').trim();
  const slug = String(tripSlug || '').trim();
  if (!uid || !slug) return { ok: false as const, error: 'bad input' };
  const trip = trips.get(slug);
  if (!trip) return { ok: false as const, error: 'trip not found' };
  if (trip.ownerId === uid) return { ok: false as const, error: 'owner cannot review own trip' };
  const r = Math.max(1, Math.min(5, Math.round(Number(rating) || 0)));
  let byUser = reviews.get(slug);
  if (!byUser) {
    byUser = new Map();
    reviews.set(slug, byUser);
  }
  if (byUser.has(uid)) return { ok: false as const, error: 'one review per user per trip' };
  const rec: Review = { tripSlug: slug, userId: uid, rating: r, text: String(text || ''), createdAt: now() };
  byUser.set(uid, rec);
  return { ok: true as const, review: rec };
}

export function listReviews(tripSlug: string): Review[] {
  const byUser = reviews.get(String(tripSlug || '').trim());
  return byUser ? Array.from(byUser.values()) : [];
}

