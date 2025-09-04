// Minimal building blocks for Search page (T18)
// Avoid JSX and React deps to keep unit tests simple and deterministic.

export type Filters = {
  q: string;
  kind: 'all' | 'trip' | 'profile';
  sort: 'createdAt' | 'title' | 'username';
  order: 'asc' | 'desc';
};

export function makeFilters(init: Partial<Filters> = {}): Filters {
  return {
    q: init.q ?? '',
    kind: init.kind ?? 'all',
    sort: init.sort ?? (init.kind === 'profile' ? 'username' : 'createdAt'),
    order: init.order ?? 'desc',
  };
}

export type ResultItem = { kind: 'trip' | 'profile'; id: string; label: string };

export function renderResultItem(item: ResultItem): { kind: 'rendered'; text: string } {
  const prefix = item.kind === 'trip' ? 'Trip:' : 'Profile:';
  return { kind: 'rendered', text: `${prefix} ${item.label}` };
}

export function canBookmark(item: ResultItem, isAuthenticated: boolean): boolean {
  if (item.kind !== 'trip') return false;
  return Boolean(isAuthenticated);
}

// T23: moderation wiring for search lists (filtering by blocklist)
import { filterSearchResultsForBlocked } from '../moderation/BlockButton';

export function applyBlockFilter<T>(viewerId: string, results: T): T {
  // This function is intentionally generic; moderation module handles shapes.
  // Cast is safe for our test stubs.
  return filterSearchResultsForBlocked(viewerId, results as any) as any as T;
}
