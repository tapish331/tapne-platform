/**
 * Minimal server-side query stubs for Home (T17)
 * No network calls; deterministic outputs for tests.
 */

export type Trip = { id: string; title: string; coverUrl?: string };
export type Profile = { id: string; username: string; avatarUrl?: string };

export type PublicHomeData = {
  trendingTrips: Trip[];
  popularProfiles: Profile[];
};

export type PersonalizedHomeData = {
  recommendedTrips: Trip[];
  followingActivity: { by: string; action: string; target: string }[];
};

function id(seed: string) {
  return `id_${seed}`;
}

export function fetchPublicHome(): PublicHomeData {
  return {
    trendingTrips: [
      { id: id('t1'), title: 'Alpine Trek' },
      { id: id('t2'), title: 'Desert Caravan' },
    ],
    popularProfiles: [
      { id: id('u1'), username: 'wanderer' },
      { id: id('u2'), username: 'nomad' },
    ],
  };
}

export function fetchPersonalizedHome(userId: string): PersonalizedHomeData {
  const safe = String(userId || 'user');
  return {
    recommendedTrips: [
      { id: id(`rt_${safe}_1`), title: 'Hidden Coastline' },
      { id: id(`rt_${safe}_2`), title: 'Forest Retreat' },
    ],
    followingActivity: [
      { by: 'friend_anna', action: 'bookmarked', target: 'Alpine Trek' },
      { by: 'friend_lee', action: 'reviewed', target: 'Hidden Coastline' },
    ],
  };
}

