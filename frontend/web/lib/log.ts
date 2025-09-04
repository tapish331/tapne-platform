export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface FrontendLogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  data?: Record<string, unknown>;
}

export function withRequestId(id?: string) {
  return { 'X-Request-Id': id || '' } as Record<string, string>;
}

export function logEvent(message: string, data?: Record<string, unknown>, level: LogLevel = 'info') {
  const entry: FrontendLogEntry = {
    level,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
  return entry;
}

export function logError(message: string, data?: Record<string, unknown>) {
  return logEvent(message, data, 'error');
}

export const logger = { logEvent, logError, withRequestId };

