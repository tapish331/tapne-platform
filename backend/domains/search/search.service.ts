import type { TripService, TripRecord } from '../trip/trip.service';
import type { ProfileService, ProfileRecord } from '../profile/profile.service';

export type SearchKind = 'trip' | 'profile' | 'all';
export type SortOrder = 'asc' | 'desc';

export type SearchParams = {
  q?: string; // query string, case-insensitive substring match
  kind?: SearchKind;
  page?: number; // 1-based
  pageSize?: number; // default 10
  sort?: 'createdAt' | 'title' | 'username';
  order?: SortOrder;
  isAuthenticated?: boolean; // determines "public" vs "full" fields
};

export type PublicTrip = Pick<TripRecord, 'id' | 'title' | 'slug'>;
export type FullTrip = TripRecord;

export type PublicProfile = Pick<ProfileRecord, 'userId' | 'username'>;
export type FullProfile = ProfileRecord;

export type SearchResult = {
  ok: true;
  trips: (PublicTrip | FullTrip)[];
  profiles: (PublicProfile | FullProfile)[];
  counts: { trips: number; profiles: number };
};

function substr(hay: string, needle: string): boolean {
  return hay.toLowerCase().includes(needle.toLowerCase());
}

export class SearchService {
  constructor(private readonly trips: TripService, private readonly profiles: ProfileService) {}

  search(params: SearchParams = {}): SearchResult {
    const q = (params.q || '').trim().toLowerCase();
    const kind: SearchKind = params.kind || 'all';
    const page = Math.max(1, Math.floor(params.page || 1));
    const pageSize = Math.max(1, Math.min(50, Math.floor(params.pageSize || 10)));
    const sort = params.sort || (kind === 'profile' ? 'username' : 'createdAt');
    const order: SortOrder = params.order === 'asc' ? 'asc' : 'desc';
    const authed = Boolean(params.isAuthenticated);

    let tripItems: TripRecord[] = [];
    let profileItems: ProfileRecord[] = [];

    if (kind === 'all' || kind === 'trip') {
      // Get all trips via TripService (respect privacy: exclude private by default)
      const all = this.trips.list({ page: 1, pageSize: 1000, sort: 'createdAt', order: 'desc' }).items;
      tripItems = all.filter((t) => {
        if (t.isPrivate) return false; // do not show private trips in search by default
        if (!q) return true;
        return substr(t.title, q) || substr(t.slug, q);
      });

      // Sort
      tripItems.sort((a, b) => {
        let cmp = 0;
        if (sort === 'title') cmp = a.title.localeCompare(b.title);
        else if (sort === 'createdAt') cmp = a.createdAt - b.createdAt;
        return order === 'asc' ? cmp : -cmp;
      });

      // Paginate
      const start = (page - 1) * pageSize;
      tripItems = tripItems.slice(start, start + pageSize).map((t) => ({ ...t }));
    }

    if (kind === 'all' || kind === 'profile') {
      // ProfileService does not provide list, so scan internal map via a small trick:
      // we leverage lookups by a seed of likely usernames by probing getByUsername.
      // However, since ProfileService stores in-memory, we cannot enumerate. To support
      // search in this simplified environment, we keep a weak registry on the service via a hidden method.
      const anySvc = this.profiles as any;
      const allProfiles: ProfileRecord[] =
        typeof anySvc.__unsafe_all === 'function' ? anySvc.__unsafe_all() : [];

      profileItems = allProfiles.filter((p) => {
        if (!q) return true;
        return substr(p.username, q) || (p.bio ? substr(p.bio, q) : false);
      });

      profileItems.sort((a, b) => {
        let cmp = 0;
        if (sort === 'username') cmp = a.username.toLowerCase().localeCompare(b.username.toLowerCase());
        else if (sort === 'createdAt') cmp = 0; // no timestamp on profile; keep as-is
        return order === 'asc' ? cmp : -cmp;
      });

      const start = (page - 1) * pageSize;
      profileItems = profileItems.slice(start, start + pageSize).map((p) => ({ ...p }));
    }

    // Shape results
    const tripsOut = tripItems.map((t) =>
      authed
        ? (t as FullTrip)
        : ({ id: t.id, title: t.title, slug: t.slug } satisfies PublicTrip)
    );
    const profilesOut = profileItems.map((p) =>
      authed
        ? (p as FullProfile)
        : ({ userId: p.userId, username: p.username } satisfies PublicProfile)
    );

    return {
      ok: true,
      trips: tripsOut,
      profiles: profilesOut,
      counts: { trips: tripsOut.length, profiles: profilesOut.length },
    };
  }
}

// Minimal placeholder module for consistency
export class SearchModule {}
