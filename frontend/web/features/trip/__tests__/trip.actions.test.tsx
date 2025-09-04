import { describe, it, expect } from 'vitest';

import TripPage, { metadata as tripMeta } from '../../../app/trip/[slug]/page';
import NewTripPage, { metadata as newTripMeta } from '../../../app/trip/new/page';
import * as view from '../TripView';
import * as editor from '../OwnerEditor';
import * as review from '../ReviewForm';
import {
  newTripDraft,
  createTrip,
  getTripBySlug,
  updateTrip,
  toggleBookmark,
  listBookmarks,
  submitReview,
  listReviews,
} from '../../../lib/server/trip.mutations';

describe('T19: Trip page — CRUD + review + bookmark', () => {
  it('exports metadata for trip pages', () => {
    expect(tripMeta).toBeDefined();
    expect(tripMeta.title).toMatch(/Trip/i);
    expect(newTripMeta.title).toMatch(/New Trip/i);
  });

  it('NewTripPage returns a protected composition with a blank draft', () => {
    const out = NewTripPage({ userId: 'u1' });
    expect(out.kind).toBe('page');
    expect(out.page).toBe('trip-new');
    expect(out.protected).toBe(true);
    expect(out.draft.title).toBe('');
  });

  it('Owner can create a trip and then update title -> slug changes', () => {
    const draft = newTripDraft();
    const patched = editor.applyDraftPatch(draft, { title: 'River Escape', isPrivate: true });
    const create = createTrip('owner_1', patched);
    expect(create.ok).toBe(true);
    const trip = create.trip!;
    expect(trip.slug).toMatch(/river-escape/);
    const pageForOwner = TripPage({ slug: trip.slug, userId: 'owner_1' });
    expect(pageForOwner.ownerView).toBe(true);
    // Update title
    const up = updateTrip('owner_1', trip.slug, { title: 'River Escape Deluxe' });
    expect(up.ok).toBe(true);
    expect(up.trip!.slug).toMatch(/river-escape-deluxe/);
    // Old slug no longer returns a trip
    const gone = getTripBySlug(trip.slug);
    expect(gone).toBeUndefined();
  });

  it('TripView view model sets permissions correctly', () => {
    const crt = createTrip('owner_2', { title: 'Forest Trail' });
    const t = crt.trip!;
    const asOwner = view.toViewModel(t as any, 'owner_2');
    expect(asOwner.canEdit).toBe(true);
    expect(asOwner.canReview).toBe(false);
    expect(asOwner.canBookmark).toBe(true);
    const asVisitor = view.toViewModel(t as any, 'vis_9');
    expect(asVisitor.canEdit).toBe(false);
    expect(asVisitor.canReview).toBe(true);
    expect(asVisitor.canBookmark).toBe(true);
  });

  it('Bookmark toggle flips state and listBookmarks reflects it', () => {
    const crt = createTrip('own_bm', { title: 'Canyon Run' });
    const slug = crt.trip!.slug;
    const u = 'user_bm';
    const t1 = toggleBookmark(u, slug);
    expect(t1.ok).toBe(true);
    expect(t1.bookmarked).toBe(true);
    expect(listBookmarks(u)).toContain(slug);
    const t2 = toggleBookmark(u, slug);
    expect(t2.ok).toBe(true);
    expect(t2.bookmarked).toBe(false);
    expect(listBookmarks(u)).not.toContain(slug);
  });

  it('Review submission enforces rules: owner cannot review; one per user', () => {
    const crt = createTrip('own_rv', { title: 'Peak Summit' });
    const slug = crt.trip!.slug;
    const ownerAttempt = submitReview('own_rv', slug, 5, 'great');
    expect(ownerAttempt.ok).toBe(false);
    const draft = review.makeReviewDraft({ rating: 4, text: 'Nice views' });
    const valid = review.validateReview(draft);
    expect(valid.ok).toBe(true);
    const r1 = submitReview('vis_1', slug, draft.rating, draft.text);
    expect(r1.ok).toBe(true);
    const again = submitReview('vis_1', slug, 5, 'again');
    expect(again.ok).toBe(false);
    const all = listReviews(slug);
    expect(all.length).toBe(1);
    expect(all[0].rating).toBe(4);
  });

  it('TripPage composition reflects ownerView and trip presence', () => {
    const make = createTrip('o3', { title: 'City Lights' });
    const slug = make.trip!.slug;
    const anon = TripPage({ slug });
    expect(anon.protected).toBe(true);
    expect(anon.ownerView).toBe(false);
    expect(anon.trip?.slug).toBe(slug);
    const owner = TripPage({ slug, userId: 'o3' });
    expect(owner.ownerView).toBe(true);
  });
});

