import { describe, it, expect } from 'vitest';

import ProfilePage, { metadata as profileMeta } from '../../../app/profile/[username]/page';
import * as toggles from '../VisibilityToggles';
import * as body from '../Body';
import * as hero from '../Hero';
import {
  getProfileByUsername,
  updateVisibility,
  toggleFollow,
  follow,
  unfollow,
  getCounts,
} from '../../../lib/server/profile.mutations';

describe('T20: Profile page — visibility & follow', () => {
  it('exports profile page metadata with title', () => {
    expect(profileMeta).toBeDefined();
    expect(profileMeta.title).toMatch(/Profile/i);
  });

  it('ProfilePage returns a protected composition and ownerView reflects identity', () => {
    const anon = ProfilePage({ username: 'alice' });
    expect(anon.page).toBe('profile');
    expect(anon.protected).toBe(true);
    expect(anon.ownerView).toBe(false);
    const owner = ProfilePage({ username: 'alice', userId: 'alice' });
    expect(owner.ownerView).toBe(true);
  });

  it('Visibility toggles default to all true and can be patched', () => {
    const v = toggles.defaultVisibility();
    expect(v.upcomingTrips && v.recentReviews && v.organizedTrips && v.pastTripsAttended).toBe(true);
    const next = toggles.applyVisibilityPatch(v, { recentReviews: false, pastTripsAttended: false });
    expect(next.recentReviews).toBe(false);
    expect(toggles.isSectionVisible(next, 'organizedTrips')).toBe(true);
  });

  it('Body model includes only visible sections', () => {
    const v = toggles.applyVisibilityPatch(toggles.defaultVisibility(), { recentReviews: false });
    const m = body.buildBody(v, 'seed');
    const kinds = m.sections.map((s) => s.kind);
    expect(kinds).toContain('upcomingTrips');
    expect(kinds).not.toContain('recentReviews');
  });

  it('Follow/unfollow/toggleFollow mutate counts and hero reflects canFollow', () => {
    // Ensure profiles exist
    getProfileByUsername('bob');
    getProfileByUsername('carol');
    // Initially zero
    expect(getCounts('bob').followers).toBeGreaterThanOrEqual(0);
    // bob follows carol
    const f1 = follow('bob', 'carol');
    expect(f1.ok).toBe(true);
    expect(getCounts('carol').followers).toBe(1);
    // toggle to unfollow
    const t1 = toggleFollow('bob', 'carol');
    expect(t1.ok).toBe(true);
    expect(t1.following).toBe(false);
    expect(getCounts('carol').followers).toBe(0);
    // self follow is rejected
    const nope = toggleFollow('carol', 'carol');
    expect(nope.ok).toBe(false);
    // hero model
    const hOwner = hero.makeHero('carol', 'carol');
    expect(hOwner.isOwner).toBe(true);
    expect(hOwner.canFollow).toBe(false);
    const hVis = hero.makeHero('dave', 'carol');
    expect(hVis.canFollow).toBe(true);
    // explicit unfollow leaves counts at 0
    const u1 = unfollow('dave', 'carol');
    expect(u1.ok).toBe(true);
    expect(getCounts('carol').followers).toBe(0);
  });

  it('Owner can update visibility settings', () => {
    const username = 'eve';
    getProfileByUsername(username);
    const up = updateVisibility(username, { organizedTrips: false });
    expect(up.ok).toBe(true);
    expect(up.profile.visibility.organizedTrips).toBe(false);
  });
});

