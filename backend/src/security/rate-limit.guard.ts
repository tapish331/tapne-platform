import type { IncomingMessage, ServerResponse } from 'node:http';

export type RateLimitKeyFn = (req: IncomingMessage) => string;

export type RateLimitConfig = {
  windowMs: number; // time window in ms
  max: number; // max requests per window per key
};

export class RateLimitGuard {
  private readonly defaultCfg: RateLimitConfig;
  private readonly perPath: Map<string, RateLimitConfig> = new Map();
  private readonly hits: Map<string, { count: number; resetAt: number }> = new Map();
  private readonly trustProxy: boolean;
  private keyFn: RateLimitKeyFn;

  constructor(
    defaultCfg: RateLimitConfig,
    options: {
      perPath?: Record<string, RateLimitConfig>;
      trustProxy?: boolean;
      keyFn?: RateLimitKeyFn;
    } = {}
  ) {
    this.defaultCfg = defaultCfg;
    if (options.perPath) {
      for (const [p, cfg] of Object.entries(options.perPath)) this.perPath.set(p, cfg);
    }
    this.trustProxy = Boolean(options.trustProxy ?? process.env.TRUST_PROXY === '1');
    this.keyFn = options.keyFn || ((req) => `${this.getClientIp(req)}:${this.getPath(req)}`);
  }

  private getPath(req: IncomingMessage): string {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      return url.pathname;
    } catch {
      return '/';
    }
  }

  private getClientIp(req: IncomingMessage): string {
    if (this.trustProxy) {
      const xf = req.headers['x-forwarded-for'];
      const got = Array.isArray(xf) ? xf[0] : xf;
      if (got) return String(got).split(',')[0].trim();
    }
    // Node may not expose req.socket.remoteAddress in our environment, fall back
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyReq: any = req as any;
    const sock = anyReq.socket || anyReq.connection;
    return (sock && (sock.remoteAddress || sock.localAddress)) || 'local';
  }

  private cfgFor(req: IncomingMessage): RateLimitConfig {
    const path = this.getPath(req);
    return this.perPath.get(path) || this.defaultCfg;
  }

  private now(): number {
    return Date.now();
  }

  // Returns true if allowed; if not allowed, sets 429 and minimal headers
  allow(req: IncomingMessage, res?: ServerResponse): boolean {
    const key = this.keyFn(req);
    const cfg = this.cfgFor(req);
    const t = this.now();
    const bucket = this.hits.get(key);
    if (!bucket || bucket.resetAt <= t) {
      this.hits.set(key, { count: 1, resetAt: t + cfg.windowMs });
      this.setHeaders(res, cfg, 0, t + cfg.windowMs);
      return true;
    }
    if (bucket.count < cfg.max) {
      bucket.count += 1;
      this.setHeaders(res, cfg, bucket.count, bucket.resetAt);
      return true;
    }
    // Limit exceeded
    if (res) {
      res.statusCode = 429;
      res.setHeader('Retry-After', Math.max(0, Math.ceil((bucket.resetAt - t) / 1000)).toString());
      this.setHeaders(res, cfg, bucket.count, bucket.resetAt);
      try {
        res.setHeader('Content-Type', 'application/json');
      } catch {}
      try {
        res.end(JSON.stringify({ ok: false, error: 'Too Many Requests' }));
      } catch {}
    }
    return false;
  }

  private setHeaders(res: ServerResponse | undefined, cfg: RateLimitConfig, count: number, resetAt: number) {
    if (!res) return;
    try {
      res.setHeader('X-RateLimit-Limit', String(cfg.max));
      res.setHeader('X-RateLimit-Remaining', String(Math.max(0, cfg.max - count)));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
    } catch {}
  }
}

