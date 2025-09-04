import type { IncomingMessage, ServerResponse } from 'node:http';
import { SearchService } from './search.service';

export class SearchController {
  constructor(private readonly service: SearchService) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    if (!req.url) return false;
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;
    if (!(req.method === 'GET' && path === '/search')) return false;

    try {
      const q = url.searchParams.get('q') || undefined;
      const kind = (url.searchParams.get('kind') as any) || undefined;
      const page = url.searchParams.get('page') ? Number(url.searchParams.get('page')) : undefined;
      const pageSize = url.searchParams.get('pageSize') ? Number(url.searchParams.get('pageSize')) : undefined;
      const sort = (url.searchParams.get('sort') as any) || undefined;
      const order = (url.searchParams.get('order') as any) || undefined;
      const authed = this.isAuthed(req);

      const result = this.service.search({ q, kind, page, pageSize, sort, order, isAuthenticated: authed });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
      return true;
    } catch (e) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      return true;
    }
  }

  private isAuthed(req: IncomingMessage): boolean {
    const auth = req.headers['authorization'];
    if (auth && String(Array.isArray(auth) ? auth[0] : auth).trim()) return true;
    const cookie = String(req.headers['cookie'] || '');
    if (/tapne_access=/.test(cookie)) return true;
    return false;
  }
}

// Minimal placeholder module for consistency
export class SearchModule {}

