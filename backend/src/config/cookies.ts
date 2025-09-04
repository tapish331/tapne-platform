export type CookieOptions = {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path?: string;
  maxAge?: number; // seconds
};

export function defaultCookieOptions(env: NodeJS.ProcessEnv = process.env): CookieOptions {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'lax' : 'lax',
    path: '/',
  };
}

export function serializeCookie(
  name: string,
  value: string,
  opts: CookieOptions
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=' + (opts.path || '/'),
    'HttpOnly',
    `SameSite=${opts.sameSite}`,
  ];
  if (opts.secure) parts.push('Secure');
  if (opts.maxAge) parts.push(`Max-Age=${Math.floor(opts.maxAge)}`);
  return parts.join('; ');
}

