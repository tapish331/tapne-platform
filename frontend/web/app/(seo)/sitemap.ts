/**
 * T22 — Sitemap generator
 * Only public routes are included.
 */

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function generateSitemap(baseUrl = 'https://tapne.local') {
  const base = trimTrailingSlash(baseUrl);
  const urls = [`${base}/`, `${base}/search`];
  return { urls };
}

