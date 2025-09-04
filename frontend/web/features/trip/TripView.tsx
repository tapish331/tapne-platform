// Minimal view helpers for Trip page (T19)
// No JSX to keep tests dependency-free.

export type TripDetail = {
  id: string;
  slug: string;
  title: string;
  ownerId: string;
  isPrivate?: boolean;
  coverUrl?: string | null;
};

export type ViewModel = {
  kind: 'trip-view';
  canEdit: boolean;
  canReview: boolean;
  canBookmark: boolean;
  title: string;
};

export function toViewModel(trip: TripDetail, currentUserId: string | null): ViewModel {
  const uid = currentUserId || '';
  const owner = uid && trip.ownerId === uid;
  return {
    kind: 'trip-view',
    canEdit: Boolean(owner),
    canReview: Boolean(uid && !owner),
    canBookmark: Boolean(uid),
    title: trip.title,
  };
}

// T23: moderation wiring helpers (report/block permissions)
import { canReportTrip, canBlockUser } from '../moderation/BlockButton';

export function attachModeration(
  vm: ViewModel,
  trip: TripDetail,
  currentUserId: string | null
): ViewModel & { canReport: boolean; canBlock: boolean } {
  const canReport = canReportTrip(currentUserId, trip.ownerId);
  const canBlock = canBlockUser(currentUserId, trip.ownerId);
  return { ...vm, canReport, canBlock };
}
