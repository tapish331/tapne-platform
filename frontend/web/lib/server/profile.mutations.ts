/**
 * Deterministic in-memory profile + follow + visibility logic (T20)
 *
 * Mirrors the style of trip.mutations with simple, test-friendly behavior.
 */

export type VisibilitySections = {
  hero: boolean; // always visible in this simplified model
  upcomingTrips: boolean;
  recentReviews: boolean;
  organizedTrips: boolean;
  pastTripsAttended: boolean;
};

export type ProfileRecord = {
  id: string;
  username: string;
  bio?: string;
  pronouns?: string;
  travelStyle?: string;
  visibility: VisibilitySections;
};

const profiles = new Map<string, ProfileRecord>(); // key: username
const followers = new Map<string, Set<string>>(); // key: followeeUsername -> Set<followerUserId>
const following = new Map<string, Set<string>>(); // key: followerUserId -> Set<followeeUsername>

function makeId() {
  const n = (makeId as any)._n || 1;
  (makeId as any)._n = n + 1;
  return `user_${n}`;
}

export function defaultVisibility(): VisibilitySections {
  return {
    hero: true,
    upcomingTrips: true,
    recentReviews: true,
    organizedTrips: true,
    pastTripsAttended: true,
  };
}

export function ensureProfile(username: string): ProfileRecord {
  const key = String(username || '').trim();
  if (!key) throw new Error('username required');
  let p = profiles.get(key);
  if (!p) {
    p = {
      id: makeId(),
      username: key,
      bio: '',
      pronouns: '',
      travelStyle: '',
      visibility: defaultVisibility(),
    };
    profiles.set(key, p);
  }
  return p;
}

export function getProfileByUsername(username: string): ProfileRecord | undefined {
  const key = String(username || '').trim();
  if (!key) return undefined;
  return profiles.get(key) || ensureProfile(key);
}

export function updateVisibility(ownerUsername: string, patch: Partial<VisibilitySections>) {
  const p = ensureProfile(ownerUsername);
  p.visibility = { ...p.visibility, ...patch };
  return { ok: true as const, profile: p };
}

export function follow(followerId: string, followeeUsername: string) {
  const fid = String(followerId || '').trim();
  const uname = String(followeeUsername || '').trim();
  if (!fid || !uname) return { ok: false as const, error: 'bad input' };
  // Owner cannot follow themselves in this model if ids match username exactly
  if (fid === uname) return { ok: false as const, error: 'cannot follow self' };
  ensureProfile(uname);
  let fset = followers.get(uname);
  if (!fset) {
    fset = new Set();
    followers.set(uname, fset);
  }
  let gset = following.get(fid);
  if (!gset) {
    gset = new Set();
    following.set(fid, gset);
  }
  fset.add(fid);
  gset.add(uname);
  return { ok: true as const, following: true };
}

export function unfollow(followerId: string, followeeUsername: string) {
  const fid = String(followerId || '').trim();
  const uname = String(followeeUsername || '').trim();
  if (!fid || !uname) return { ok: false as const, error: 'bad input' };
  followers.get(uname)?.delete(fid);
  following.get(fid)?.delete(uname);
  return { ok: true as const, following: false };
}

export function toggleFollow(followerId: string, followeeUsername: string) {
  const fid = String(followerId || '').trim();
  const uname = String(followeeUsername || '').trim();
  if (!fid || !uname) return { ok: false as const, error: 'bad input' };
  if (fid === uname) return { ok: false as const, error: 'cannot follow self' };
  const set = followers.get(uname) || new Set<string>();
  if (!followers.has(uname)) followers.set(uname, set);
  if (set.has(fid)) {
    set.delete(fid);
    following.get(fid)?.delete(uname);
    return { ok: true as const, following: false };
  }
  set.add(fid);
  let gset = following.get(fid);
  if (!gset) {
    gset = new Set();
    following.set(fid, gset);
  }
  gset.add(uname);
  return { ok: true as const, following: true };
}

export function getCounts(username: string): { followers: number; following: number } {
  const uname = String(username || '').trim();
  const f1 = followers.get(uname)?.size || 0;
  // In this simplified model, the username is also a userId; use that for following set
  const f2 = following.get(uname)?.size || 0;
  return { followers: f1, following: f2 };
}

