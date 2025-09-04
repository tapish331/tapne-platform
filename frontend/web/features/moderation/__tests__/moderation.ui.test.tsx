import { describe, it, expect } from 'vitest';

import { makeReportButton, reportEntity, listReports } from '../ReportButton';
import {
  makeBlockButton,
  toggleBlock,
  isBlocked,
  filterSearchResultsForBlocked,
  canBlockUser,
  canReportTrip,
} from '../BlockButton';
import * as tripView from '../../trip/TripView';
import * as hero from '../../profile/Hero';
import { fetchAuthSearch } from '../../../lib/server/search.queries';

describe('T23: Moderation UI hooks and filtering', () => {
  it('ReportButton confirms and creates a report record', () => {
    const btn = makeReportButton();
    const conf = btn.confirm('spam');
    expect(conf.ok).toBe(true);
    const res = reportEntity('rpt_1', 'trip', 'trip_123', conf.reason!);
    expect(res.ok).toBe(true);
    const all = listReports();
    expect(all.length).toBeGreaterThan(0);
    expect(all[all.length - 1].entity).toBe('trip');
  });

  it('BlockButton toggles and isBlocked reflects state', () => {
    const viewer = 'u_me';
    const target = 'u_them';
    expect(isBlocked(viewer, target)).toBe(false);
    const btn = makeBlockButton(viewer, target);
    const t1 = btn.onToggle();
    expect(t1.ok).toBe(true);
    expect(isBlocked(viewer, target)).toBe(true);
    const t2 = toggleBlock(viewer, target);
    expect(t2.ok).toBe(true);
    expect(isBlocked(viewer, target)).toBe(false);
  });

  it('Search results are filtered by blocklist for authenticated results', () => {
    const viewer = 'viewer_1';
    // Auth results include ownerId on trips and userId on profiles
    const full = fetchAuthSearch(viewer, '');
    // Block the second trip's owner and first profile
    const ownerToBlock = full.trips[1].ownerId;
    const userToBlock = full.profiles[0].userId;
    toggleBlock(viewer, ownerToBlock);
    toggleBlock(viewer, userToBlock);
    const filtered = filterSearchResultsForBlocked(viewer, full);
    expect(filtered.trips.find((t) => t.ownerId === ownerToBlock)).toBeUndefined();
    expect(filtered.profiles.find((p) => p.userId === userToBlock)).toBeUndefined();
  });

  it('TripView moderation permissions exclude owner', () => {
    const trip = { id: 't1', slug: 'x', title: 'Trip', ownerId: 'owner_1' } as any;
    const base = tripView.toViewModel(trip, 'visitor_1');
    const withMod = tripView.attachModeration(base, trip, 'visitor_1');
    expect(withMod.canReport).toBe(true);
    expect(withMod.canBlock).toBe(true);
    const own = tripView.attachModeration(base, trip, 'owner_1');
    expect(own.canReport).toBe(false);
    expect(own.canBlock).toBe(false);
    // direct helpers
    expect(canReportTrip('visitor_1', 'owner_1')).toBe(true);
    expect(canReportTrip('owner_1', 'owner_1')).toBe(false);
  });

  it('Profile Hero moderation exposes canBlock correctly', () => {
    const h = hero.makeHero('me', 'them');
    const mod = hero.attachModerationToHero(h, 'me');
    expect(mod.canBlock).toBe(true);
    const self = hero.attachModerationToHero(hero.makeHero('me', 'me'), 'me');
    expect(self.canBlock).toBe(false);
    expect(canBlockUser('me', 'me')).toBe(false);
  });
});

