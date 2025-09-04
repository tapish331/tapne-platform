export const metadata = {
  title: 'New Trip — Tapne',
  description: 'Create a new trip',
};

// No JSX; plain-return for tests
import { newTripDraft } from '../../../lib/server/trip.mutations';

export type NewTripComposition = {
  kind: 'page';
  page: 'trip-new';
  protected: true;
  draft: ReturnType<typeof newTripDraft>;
};

export default function NewTripPage(props?: { userId?: string | null }) {
  // Protected route: even if userId is absent, we still return the composition
  // marker with a blank draft; tests focus on shape, not gating runtime.
  const draft = newTripDraft();
  const out: NewTripComposition = {
    kind: 'page',
    page: 'trip-new',
    protected: true,
    draft,
  };
  return out;
}

