/**
 * Minimal server-side query stubs for Search (T18)
 * Deterministic outputs; no network calls.
 */

export type PublicTrip = { id: string; title: string; slug: string };
export type FullTrip = PublicTrip & { ownerId: string; createdAt: number };

export type PublicProfile = { userId: string; username: string };
export type FullProfile = PublicProfile & { bio: string | null };

export type SearchPublic = { trips: PublicTrip[]; profiles: PublicProfile[] };
export type SearchFull = { trips: FullTrip[]; profiles: FullProfile[] };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function now(): number {
  // deterministic-ish increasing timestamp per call without relying on real time
  const n = (now as any)._t || Date.now();
  const next = n + 1;
  (now as any)._t = next;
  return next;
}

export function fetchPublicSearch(q = ''): SearchPublic {
  const baseTrips: PublicTrip[] = [
    { id: 't_pub_1', title: 'Coastal Walk', slug: slugify('Coastal Walk') },
    { id: 't_pub_2', title: 'Alpine Route', slug: slugify('Alpine Route') },
  ];
  const baseProfiles: PublicProfile[] = [
    { userId: 'u_pub_1', username: 'alice' },
    { userId: 'u_pub_2', username: 'bob' },
  ];
  const qq = q.toLowerCase();
  const trips = baseTrips.filter((t) => !qq || t.title.toLowerCase().includes(qq) || t.slug.includes(qq));
  const profiles = baseProfiles.filter((p) => !qq || p.username.toLowerCase().includes(qq));
  return { trips, profiles };
}

export function fetchAuthSearch(userId: string, q = ''): SearchFull {
  const uid = String(userId || 'user');
  const pub = fetchPublicSearch(q);
  const trips: FullTrip[] = pub.trips.map((t, i) => ({
    ...t,
    ownerId: i === 0 ? 'owner_alice' : 'owner_bob',
    createdAt: now() + i + uid.length,
  }));
  const profiles: FullProfile[] = pub.profiles.map((p, i) => ({
    ...p,
    bio: i === 0 ? 'Adventurer' : 'Explorer',
  }));
  return { trips, profiles };
}

