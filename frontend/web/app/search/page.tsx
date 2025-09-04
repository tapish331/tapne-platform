export const metadata = {
  title: 'Search — Tapne',
  description: 'Find trips and profiles on Tapne',
};

// Keep this file free of JSX so tests don't require React runtime
import { fetchPublicSearch, fetchAuthSearch } from '../../lib/server/search.queries';

export type SearchCompositionPublic = {
  kind: 'page';
  page: 'search';
  mode: 'public';
  results: ReturnType<typeof fetchPublicSearch>;
};

export type SearchCompositionAuth = {
  kind: 'page';
  page: 'search';
  mode: 'auth';
  results: ReturnType<typeof fetchAuthSearch>;
};

export type SearchComposition = SearchCompositionPublic | SearchCompositionAuth;

export default function SearchPage(props?: { userId?: string | null; q?: string }) {
  const q = props?.q || '';
  const authed = Boolean(props?.userId);
  if (!authed) {
    const results = fetchPublicSearch(q);
    const out: SearchCompositionPublic = { kind: 'page', page: 'search', mode: 'public', results };
    return out;
  }
  const results = fetchAuthSearch(String(props?.userId || ''), q);
  const out: SearchCompositionAuth = { kind: 'page', page: 'search', mode: 'auth', results };
  return out;
}

