import { describe, it, expect } from 'vitest';
import { getHealth } from '../../health/health.controller';

describe('T02: Health controller', () => {
  it('returns ok payload with uptime and timestamp', () => {
    const h = getHealth();
    expect(h.status).toBe('ok');
    expect(typeof h.uptime).toBe('number');
    expect(h.uptime).toBeGreaterThanOrEqual(0);
    expect(typeof h.timestamp).toBe('string');
    // Basic ISO format check
    expect(() => new Date(h.timestamp)).not.toThrowError();
  });
});

