import { describe, it, expect } from 'vitest';

import HomePage, { metadata } from '../../../app/page';
import { fetchPublicHome, fetchPersonalizedHome } from '../../../lib/server/home.queries';
import * as home from '..';

describe('T17: Home page — public and personalized sections', () => {
  it('exports home page metadata with title', () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toMatch(/Home/i);
  });

  it('HomePage returns a composition object with public sections', () => {
    const out = HomePage();
    expect(out && typeof out).toBe('object');
    expect((out as any).page).toBe('home');
    expect(out.sections.public.trendingTrips.length).toBeGreaterThan(0);
    expect(out.sections.public.popularProfiles.length).toBeGreaterThan(0);
  });

  it('Public and personalized query helpers return deterministic data', () => {
    const pub = fetchPublicHome();
    expect(Array.isArray(pub.trendingTrips)).toBe(true);
    expect(Array.isArray(pub.popularProfiles)).toBe(true);
    expect(pub.trendingTrips[0].title).toMatch(/Alpine|Coast|Trek|Desert/i);

    const per = fetchPersonalizedHome('user_123');
    expect(Array.isArray(per.recommendedTrips)).toBe(true);
    expect(Array.isArray(per.followingActivity)).toBe(true);
  });

  it('feature helpers expose simple card and loading factories', () => {
    const c1 = home.makeTripCard({ id: 't', title: 'Trip' });
    const c2 = home.makeProfileCard({ id: 'p', username: 'me' });
    const l = home.loading();
    expect(c1.kind).toBe('card');
    expect(c2.kind).toBe('card');
    expect(l.kind).toBe('loading');
  });
});

