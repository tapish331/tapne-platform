// Profile Body view model builder (T20)
// Avoid JSX; keep pure data for tests.

import type { VisibilitySections } from './VisibilityToggles';

export type BodySection =
  | { kind: 'upcomingTrips'; items: string[] }
  | { kind: 'recentReviews'; items: string[] }
  | { kind: 'organizedTrips'; items: string[] }
  | { kind: 'pastTripsAttended'; items: string[] };

export type BodyModel = { sections: BodySection[] };

export function buildBody(visibility: VisibilitySections, seed = 'p'): BodyModel {
  const sections: BodySection[] = [];
  if (visibility.upcomingTrips) sections.push({ kind: 'upcomingTrips', items: [`${seed}_u1`] });
  if (visibility.recentReviews) sections.push({ kind: 'recentReviews', items: [`${seed}_r1`] });
  if (visibility.organizedTrips) sections.push({ kind: 'organizedTrips', items: [`${seed}_o1`] });
  if (visibility.pastTripsAttended) sections.push({ kind: 'pastTripsAttended', items: [`${seed}_p1`] });
  return { sections };
}

