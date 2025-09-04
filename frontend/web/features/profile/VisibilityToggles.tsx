// Visibility helpers for profile sections (T20)

export type VisibilitySections = {
  upcomingTrips: boolean;
  recentReviews: boolean;
  organizedTrips: boolean;
  pastTripsAttended: boolean;
};

export function defaultVisibility(): VisibilitySections {
  return {
    upcomingTrips: true,
    recentReviews: true,
    organizedTrips: true,
    pastTripsAttended: true,
  };
}

export function applyVisibilityPatch(
  v: VisibilitySections,
  patch: Partial<VisibilitySections>
): VisibilitySections {
  return { ...v, ...patch };
}

export function isSectionVisible(v: VisibilitySections, section: keyof VisibilitySections): boolean {
  return Boolean(v[section]);
}

