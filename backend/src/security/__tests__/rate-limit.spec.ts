import { describe, it, expect } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { RateLimitGuard } from '../rate-limit.guard';

function fakeReq(path: string, ip = '127.0.0.1', headers: Record<string, string> = {}): IncomingMessage {
  return {
    url: path,
    headers,
    // @ts-expect-error partial
    socket: { remoteAddress: ip },
  } as IncomingMessage;
}

function fakeRes() {
  const headers: Record<string, string> = {};
  let code = 200;
  return {
    get headers() {
      return headers;
    },
    get statusCode() {
      return code;
    },
    setHeader(k: string, v: string) {
      headers[k] = v;
    },
    end() {
      /* noop */
    },
    set statusCode(v: number) {
      code = v;
    },
  } as unknown as ServerResponse & { headers: Record<string, string> };
}

describe('T06: RateLimitGuard', () => {
  it('allows up to max per window and then blocks with 429', () => {
    const guard = new RateLimitGuard({ windowMs: 1000, max: 2 });
    const req = fakeReq('/test');
    const res = fakeRes();

    expect(guard.allow(req, res)).toBe(true);
    expect(guard.allow(req, res)).toBe(true);
    // Third should be blocked
    const res2 = fakeRes();
    expect(guard.allow(req, res2)).toBe(false);
    expect(res2.statusCode).toBe(429);
    expect(Number(res2.headers['X-RateLimit-Remaining'])).toBe(0);
    expect(res2.headers['X-RateLimit-Limit']).toBe('2');
  });

  it('resets after the window passes', async () => {
    const guard = new RateLimitGuard({ windowMs: 20, max: 1 });
    const req = fakeReq('/foo');
    const res = fakeRes();
    expect(guard.allow(req, res)).toBe(true);
    const res2 = fakeRes();
    expect(guard.allow(req, res2)).toBe(false);
    await new Promise((r) => setTimeout(r, 30));
    const res3 = fakeRes();
    expect(guard.allow(req, res3)).toBe(true);
  });

  it('uses x-forwarded-for when trustProxy is enabled', () => {
    const guard = new RateLimitGuard({ windowMs: 1000, max: 1 }, { trustProxy: true });
    const reqA = fakeReq('/alpha', '127.0.0.1', { 'x-forwarded-for': '1.1.1.1' });
    const reqB = fakeReq('/alpha', '127.0.0.1', { 'x-forwarded-for': '2.2.2.2' });
    const resA = fakeRes();
    const resB = fakeRes();
    expect(guard.allow(reqA, resA)).toBe(true);
    // Different client IP should still be allowed
    expect(guard.allow(reqB, resB)).toBe(true);
  });
});

