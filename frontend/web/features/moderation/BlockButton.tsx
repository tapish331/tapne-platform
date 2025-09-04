// Moderation UI: Block button model, blocklist store, and search filtering (T23)

import type { SearchFull, SearchPublic } from '../../lib/server/search.queries';

const blockMap = new Map<string, Set<string>>(); // viewerId -> Set<blockedUserId>

function ensureSet(viewerId: string) {
  const vid = String(viewerId || '').trim();
  let set = blockMap.get(vid);
  if (!set) {
    set = new Set<string>();
    blockMap.set(vid, set);
  }
  return set;
}

export function isBlocked(viewerId: string, targetUserId: string): boolean {
  const vid = String(viewerId || '').trim();
  const tid = String(targetUserId || '').trim();
  if (!vid || !tid) return false;
  return Boolean(blockMap.get(vid)?.has(tid));
}

export function toggleBlock(viewerId: string, targetUserId: string) {
  const vid = String(viewerId || '').trim();
  const tid = String(targetUserId || '').trim();
  if (!vid || !tid) return { ok: false as const, error: 'bad input' };
  if (vid === tid) return { ok: false as const, error: 'cannot block self' };
  const set = ensureSet(vid);
  if (set.has(tid)) {
    set.delete(tid);
    return { ok: true as const, blocked: false };
  }
  set.add(tid);
  return { ok: true as const, blocked: true };
}

export function canBlockUser(viewerId: string | null | undefined, targetUserId: string): boolean {
  const vid = viewerId ? String(viewerId) : '';
  const tid = String(targetUserId || '');
  if (!vid || !tid) return false;
  if (vid === tid) return false;
  return true;
}

export function canReportTrip(viewerId: string | null | undefined, ownerUserId: string): boolean {
  const vid = viewerId ? String(viewerId) : '';
  const oid = String(ownerUserId || '');
  if (!vid || !oid) return false;
  if (vid === oid) return false;
  return true;
}

export type BlockButtonModel = {
  kind: 'button';
  label: 'Block' | 'Unblock';
  onToggle: () => { ok: boolean; blocked?: boolean };
};

export function makeBlockButton(viewerId: string, targetUserId: string): BlockButtonModel {
  const blocked = isBlocked(viewerId, targetUserId);
  return {
    kind: 'button',
    label: blocked ? 'Unblock' : 'Block',
    onToggle: () => toggleBlock(viewerId, targetUserId),
  };
}

// Filter search results to respect blocklists.
// Works with both public (no trip owner) and full (includes ownerId) results.
export function filterSearchResultsForBlocked<T extends SearchPublic | SearchFull>(
  viewerId: string,
  results: T
): T {
  const set = blockMap.get(String(viewerId || '').trim()) || new Set<string>();
  const ids = new Set(set);
  const isFull = (r: any): r is SearchFull => Array.isArray((r as any).trips) && 'ownerId' in (((r as any).trips || [])[0] || {});

  const out: any = { ...results };
  if (isFull(results)) {
    out.trips = (results as SearchFull).trips.filter((t) => !ids.has(t.ownerId));
    out.profiles = (results as SearchFull).profiles.filter((p) => !ids.has(p.userId));
  } else {
    // Public results: filter profiles by userId; leave trips as-is (no owner present)
    out.trips = (results as SearchPublic).trips.slice();
    out.profiles = (results as SearchPublic).profiles.filter((p) => !ids.has(p.userId));
  }
  return out;
}

