import { describe, it, expect } from 'vitest';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { HttpExceptionFilter } from '../http-exception.filter';

function fakeReq(url = '/'): IncomingMessage {
  return { url } as IncomingMessage;
}

function fakeRes(): ServerResponse & {
  headers: Record<string, string>;
  body?: string;
} {
  const headers: Record<string, string> = {};
  let code = 200;
  let body = '';
  return {
    get headers() {
      return headers;
    },
    get statusCode() {
      return code;
    },
    set statusCode(v: number) {
      code = v;
    },
    get body() {
      return body;
    },
    setHeader(k: string, v: string) {
      headers[k] = v;
    },
    getHeader(k: string) {
      return headers[k];
    },
    end(chunk?: any) {
      body = String(chunk ?? '');
    },
  } as unknown as ServerResponse & { headers: Record<string, string>; body?: string };
}

describe('T24: HttpExceptionFilter', () => {
  it('formats unknown errors as JSON with requestId and 500 status', () => {
    const filter = new HttpExceptionFilter();
    const req = fakeReq('/boom');
    const res = fakeRes();
    filter.handle(req, res, new Error('Boom!'), 'REQ123');

    // @ts-expect-error test helper
    const body = JSON.parse((res as any).body || '{}');
    expect(res.statusCode).toBe(500);
    expect(res.headers['Content-Type']).toContain('application/json');
    expect(res.headers['X-Request-Id']).toBe('REQ123');
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/Boom/);
    expect(body.requestId).toBe('REQ123');
  });

  it('respects explicit statusCode on error', () => {
    const filter = new HttpExceptionFilter();
    const req = fakeReq('/bad');
    const res = fakeRes();
    const err = Object.assign(new Error('Bad request'), { statusCode: 400 });
    filter.handle(req, res, err, 'A1');
    // @ts-expect-error test helper
    const body = JSON.parse((res as any).body || '{}');
    expect(res.statusCode).toBe(400);
    expect(body.requestId).toBe('A1');
    expect(body.error).toMatch(/Bad/);
  });
});
