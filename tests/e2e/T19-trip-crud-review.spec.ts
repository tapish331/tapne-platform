import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

test.describe('T19: Trip page presence and actions wiring', () => {
  test('trip files exist with expected exports and content', async () => {
    const files = [
      'frontend/web/app/trip/[slug]/page.tsx',
      'frontend/web/app/trip/new/page.tsx',
      'frontend/web/features/trip/TripView.tsx',
      'frontend/web/features/trip/OwnerEditor.tsx',
      'frontend/web/features/trip/ReviewForm.tsx',
      'frontend/web/lib/server/trip.mutations.ts',
    ];
    for (const f of files) expect(existsSync(f), `${f} missing`).toBe(true);

    const pageSlug = readFileSync('frontend/web/app/trip/[slug]/page.tsx', 'utf8');
    expect(pageSlug).toMatch(/export\s+const\s+metadata/);
    expect(pageSlug).toMatch(/export\s+default\s+function\s+TripPage/);
    expect(pageSlug).toMatch(/page:\s*'trip'/);

    const pageNew = readFileSync('frontend/web/app/trip/new/page.tsx', 'utf8');
    expect(pageNew).toMatch(/export\s+const\s+metadata/);
    expect(pageNew).toMatch(/export\s+default\s+function\s+NewTripPage/);
    expect(pageNew).toMatch(/page:\s*'trip-new'/);

    const view = readFileSync('frontend/web/features/trip/TripView.tsx', 'utf8');
    expect(view).toMatch(/toViewModel/);

    const editor = readFileSync('frontend/web/features/trip/OwnerEditor.tsx', 'utf8');
    expect(editor).toMatch(/emptyDraft/);
    expect(editor).toMatch(/applyDraftPatch/);

    const review = readFileSync('frontend/web/features/trip/ReviewForm.tsx', 'utf8');
    expect(review).toMatch(/makeReviewDraft/);
    expect(review).toMatch(/validateReview/);

    const mutations = readFileSync('frontend/web/lib/server/trip.mutations.ts', 'utf8');
    expect(mutations).toMatch(/createTrip/);
    expect(mutations).toMatch(/updateTrip/);
    expect(mutations).toMatch(/getTripBySlug/);
    expect(mutations).toMatch(/toggleBookmark/);
    expect(mutations).toMatch(/submitReview/);
  });
});

