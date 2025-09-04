import { describe, it, expect } from 'vitest';

import SearchPage, { metadata } from '../../../app/search/page';
import { fetchPublicSearch, fetchAuthSearch } from '../../../lib/server/search.queries';
import * as search from '..';

describe('T18: Search page — public limited vs full on auth', () => {
  it('exports search page metadata with title', () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toMatch(/Search/i);
  });

  it('SearchPage returns limited fields when unauthenticated', () => {
    const out = SearchPage({ q: 'a' });
    expect(out && typeof out).toBe('object');
    expect((out as any).page).toBe('search');
    expect((out as any).mode).toBe('public');
    const trips = (out as any).results.trips as any[];
    expect(Array.isArray(trips)).toBe(true);
    if (trips.length) {
      expect('ownerId' in trips[0]).toBe(false);
    }
  });

  it('SearchPage returns full fields when authenticated', () => {
    const out = SearchPage({ userId: 'user_123', q: 'a' });
    expect(out && typeof out).toBe('object');
    expect((out as any).mode).toBe('auth');
    const trips = (out as any).results.trips as any[];
    expect(Array.isArray(trips)).toBe(true);
    if (trips.length) {
      expect(typeof trips[0].ownerId).toBe('string');
      expect(typeof trips[0].createdAt).toBe('number');
    }
  });

  it('query helpers return deterministic shapes', () => {
    const pub = fetchPublicSearch();
    expect(Array.isArray(pub.trips)).toBe(true);
    expect(Array.isArray(pub.profiles)).toBe(true);
    if (pub.trips.length) {
      expect('ownerId' in (pub.trips[0] as any)).toBe(false);
    }
    const full = fetchAuthSearch('u');
    expect(Array.isArray(full.trips)).toBe(true);
    expect(Array.isArray(full.profiles)).toBe(true);
    if (full.trips.length) {
      expect(typeof (full.trips[0] as any).ownerId).toBe('string');
    }
  });

  it('feature helpers provide filters, rendering, and bookmark rule', () => {
    const f = search.makeFilters({ q: 'hi' });
    expect(f.q).toBe('hi');
    expect(f.kind).toMatch(/all|trip|profile/);
    const rendered = search.renderResultItem({ kind: 'trip', id: 't', label: 'Coastal Walk' });
    expect(rendered.kind).toBe('rendered');
    expect(rendered.text).toMatch(/Trip:/);
    const can = search.canBookmark({ kind: 'trip', id: 't', label: 'x' }, true);
    expect(can).toBe(true);
    const cannot = search.canBookmark({ kind: 'profile', id: 'p', label: 'y' }, true);
    expect(cannot).toBe(false);
  });
});

