/**
 * T22 — SEO/Slugs/OG & Robots
 * Minimal robots.txt helpers to keep tests deterministic and Next.js-free.
 */

export type RobotsRules = {
  userAgent: string;
  allow: string[];
  disallow: string[];
};

export const robotsRules: RobotsRules = {
  userAgent: '*',
  allow: ['/', '/search'],
  disallow: ['/trip', '/profile', '/account'],
};

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function buildRobotsTxt(baseUrl = 'https://tapne.local', rules: RobotsRules = robotsRules): string {
  const lines: string[] = [];
  lines.push(`User-agent: ${rules.userAgent}`);
  for (const a of rules.allow) lines.push(`Allow: ${a}`);
  for (const d of rules.disallow) lines.push(`Disallow: ${d}`);
  const base = trimTrailingSlash(baseUrl);
  lines.push(`Sitemap: ${base}/sitemap.xml`);
  return lines.join('\n');
}

// Optional default export shaped like Next.js route metadata (not used by tests)
export default function robots() {
  return { rules: robotsRules, sitemap: 'https://tapne.local/sitemap.xml' };
}

