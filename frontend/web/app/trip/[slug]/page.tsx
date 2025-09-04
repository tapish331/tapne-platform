export const metadata = {
  title: 'Trip — Tapne',
  description: 'Trip detail page with reviews and bookmark',
  // T22: Auth-gated page should not be indexed
  robots: { index: false, follow: false },
};

// Keep free of JSX; return plain objects for unit tests
import { getTripBySlug } from '../../../lib/server/trip.mutations';

export type TripComposition = {
  kind: 'page';
  page: 'trip';
  protected: true;
  slug: string;
  trip?: ReturnType<typeof getTripBySlug> | undefined;
  ownerView: boolean;
};

export default function TripPage(props: { slug: string; userId?: string | null }) {
  const slug = String(props.slug || '').trim();
  const userId = props.userId ? String(props.userId) : null;
  const trip = getTripBySlug(slug);
  const ownerView = Boolean(userId && trip && trip.ownerId === userId);
  const out: TripComposition = {
    kind: 'page',
    page: 'trip',
    protected: true,
    slug,
    trip,
    ownerView,
  };
  return out;
}
