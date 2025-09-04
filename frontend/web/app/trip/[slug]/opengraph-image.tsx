/**
 * T22 — OpenGraph image stub for Trip page
 * Plain function export to avoid JSX/runtime requirements in tests.
 */

export type OgImageSpec = {
  kind: 'og-image';
  page: 'trip';
  width: number;
  height: number;
  title: string;
  slug: string;
};

export function buildOgImageForTrip(slug: string, title = 'Trip — Tapne'): OgImageSpec {
  const s = String(slug || '').trim();
  return {
    kind: 'og-image',
    page: 'trip',
    width: 1200,
    height: 630,
    title,
    slug: s,
  };
}

