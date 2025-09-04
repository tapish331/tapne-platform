import type { Trip } from './trip';
import type { Profile } from './profile';

export type SearchKind = 'trip' | 'profile' | 'all';

export type PublicTrip = Pick<Trip, 'id' | 'title' | 'slug'>;
export type FullTrip = Trip;

export type PublicProfile = Pick<Profile, 'userId' | 'username'>;
export type FullProfile = Profile;

export type SearchResponse = {
  ok: true;
  trips: (PublicTrip | FullTrip)[];
  profiles: (PublicProfile | FullProfile)[];
  counts: { trips: number; profiles: number };
};

