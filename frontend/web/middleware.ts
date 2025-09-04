/**
 * Minimal Next.js-like middleware stub.
 * We avoid importing 'next/server' so the file is self-contained for tests.
 */

const PUBLIC_PATHS = ['/', '/search', '/api/auth', '/_next', '/assets'];

export function middleware(req: { nextUrl?: { pathname: string }; cookies?: { get: (n: string) => { value?: string } | undefined } }) {
  const pathname = req?.nextUrl?.pathname || '/';
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (isPublic) return { action: 'allow' };

  const hasSession = !!req?.cookies?.get('tapne_session')?.value;
  if (!hasSession) {
    const next = encodeURIComponent(pathname);
    return { action: 'redirect', location: `/account/login?next=${next}` };
  }
  return { action: 'allow' };
}

export const config = {
  matcher: ['/((?!_next|assets).*)'],
};

export { PUBLIC_PATHS };

