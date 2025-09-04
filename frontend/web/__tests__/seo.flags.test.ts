import { describe, it, expect } from 'vitest';

import TripPage, { metadata as tripMeta } from '../app/trip/[slug]/page';
import ProfilePage, { metadata as profileMeta } from '../app/profile/[username]/page';
import { robotsRules, buildRobotsTxt } from '../app/robots';
import { buildOgImageForTrip } from '../app/trip/[slug]/opengraph-image';
import { buildOgImageForProfile } from '../app/profile/[username]/opengraph-image';
import { generateSitemap } from '../app/(seo)/sitemap';

describe('T22: SEO — robots, noindex, OG, sitemap', () => {
  it('sets robots noindex on protected pages (trip, profile)', () => {
    expect(tripMeta.robots).toBeDefined();
    expect(tripMeta.robots.index).toBe(false);
    expect(tripMeta.robots.follow).toBe(false);
    expect(profileMeta.robots.index).toBe(false);
    expect(profileMeta.robots.follow).toBe(false);
    // Ensure page compositions remain protected
    expect(TripPage({ slug: 'alpine-route' }).protected).toBe(true);
    expect(ProfilePage({ username: 'alice' }).protected).toBe(true);
  });

  it('robots.txt rules disallow protected routes and declare sitemap', () => {
    expect(robotsRules.allow).toContain('/');
    expect(robotsRules.allow).toContain('/search');
    for (const dis of ['/trip', '/profile', '/account']) {
      expect(robotsRules.disallow).toContain(dis);
    }
    const txt = buildRobotsTxt('https://tapne.local');
    expect(txt).toMatch(/User-agent: \*/);
    expect(txt).toMatch(/Allow: \/$/m);
    expect(txt).toMatch(/Allow: \/search/m);
    expect(txt).toMatch(/Disallow: \/trip/m);
    expect(txt).toMatch(/Disallow: \/profile/m);
    expect(txt).toMatch(/Disallow: \/account/m);
    expect(txt).toMatch(/Sitemap: https:\/\/tapne\.local\/sitemap\.xml/);
  });

  it('builds OG image specs for trip and profile', () => {
    const t = buildOgImageForTrip('alpine-route');
    expect(t.kind).toBe('og-image');
    expect(t.page).toBe('trip');
    expect(t.width).toBe(1200);
    expect(t.height).toBe(630);
    expect(t.slug).toBe('alpine-route');
    const p = buildOgImageForProfile('alice');
    expect(p.page).toBe('profile');
    expect(p.username).toBe('alice');
  });

  it('sitemap contains only public routes', () => {
    const sm = generateSitemap('https://tapne.local');
    const urls = sm.urls;
    expect(urls).toContain('https://tapne.local/');
    expect(urls).toContain('https://tapne.local/search');
    expect(urls.join('\n')).not.toMatch(/\/trip/);
    expect(urls.join('\n')).not.toMatch(/\/profile/);
    expect(urls.join('\n')).not.toMatch(/\/account/);
  });
});

