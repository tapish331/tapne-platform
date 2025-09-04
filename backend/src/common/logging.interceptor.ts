import type { IncomingMessage, ServerResponse } from 'node:http';

export type LogLevel = 'info' | 'error' | 'warn';

export interface LogEntry {
  level: LogLevel;
  message: string;
  requestId: string;
  timestamp: string;
  context?: Record<string, unknown> | undefined;
}

export function generateRequestId(): string {
  const rnd = Math.random().toString(16).slice(2);
  const ts = Date.now().toString(16);
  return `${ts}${rnd}`.slice(0, 24);
}

/**
 * Attaches a request ID header and returns simple structured logging helpers.
 * This is a lightweight analogue to a NestJS interceptor.
 */
export function attachLogging(req: IncomingMessage, res: ServerResponse) {
  const existing = (req.headers['x-request-id'] as string) || '';
  const requestId = existing || generateRequestId();
  try {
    res.setHeader('X-Request-Id', requestId);
  } catch {
    // ignore header set errors in tests
  }
  const startedAt = Date.now();

  function emit(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      requestId,
      timestamp: new Date().toISOString(),
      context,
    };
    const line = JSON.stringify(entry);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }

  function done() {
    emit('info', 'request_completed', {
      method: req.method || 'GET',
      url: req.url || '',
      statusCode: (res as any).statusCode ?? 0,
      durationMs: Date.now() - startedAt,
    });
  }

  return { requestId, log: emit, done };
}

export class LoggingInterceptor {
  begin(req: IncomingMessage, res: ServerResponse) {
    return attachLogging(req, res);
  }
}

