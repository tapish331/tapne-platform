/**
 * T22 — OpenGraph image stub for Profile page
 * Plain function export to avoid JSX/runtime requirements in tests.
 */

export type OgProfileImageSpec = {
  kind: 'og-image';
  page: 'profile';
  width: number;
  height: number;
  title: string;
  username: string;
};

export function buildOgImageForProfile(username: string, title = 'Profile — Tapne'): OgProfileImageSpec {
  const u = String(username || '').trim();
  return {
    kind: 'og-image',
    page: 'profile',
    width: 1200,
    height: 630,
    title,
    username: u,
  };
}

