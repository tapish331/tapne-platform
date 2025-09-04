import type { IncomingMessage, ServerResponse } from 'node:http';

export interface HttpLikeError extends Error {
  statusCode?: number;
  status?: number;
}

/**
 * Formats errors consistently and ensures the response carries a request ID.
 * This is a lightweight analogue to a NestJS exception filter.
 */
export class HttpExceptionFilter {
  handle(
    _req: IncomingMessage,
    res: ServerResponse,
    error: unknown,
    requestId?: string
  ) {
    const err = error as HttpLikeError;
    const status = (typeof err?.statusCode === 'number' && err.statusCode) ||
      (typeof err?.status === 'number' && (err.status as number)) ||
      500;
    const rid = (res.getHeader?.('X-Request-Id') as string) || requestId || '';

    try {
      if (rid && !res.getHeader('X-Request-Id')) res.setHeader('X-Request-Id', rid);
      res.setHeader('Content-Type', 'application/json');
    } catch {
      // ignore in tests
    }
    (res as any).statusCode = status;

    const message = String(err?.message || err || 'Internal Error');
    const payload = { ok: false, error: message, requestId: rid };

    try {
      // Minimal structured error log
      // eslint-disable-next-line no-console
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'http_exception',
          requestId: rid,
          status,
          error: message,
        })
      );
    } catch {
      // ignore
    }

    try {
      (res as any).end(JSON.stringify(payload));
    } catch {
      /* ignore */
    }
  }
}

