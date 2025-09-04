import type { IncomingMessage, ServerResponse } from 'node:http';
import { BookmarkService } from './bookmark.service';

export class BookmarkController {
  constructor(private readonly service: BookmarkService) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    if (!req.url) return false;
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (req.method === 'POST' && path === '/trip/bookmark') {
      try {
        const body = await this.readJson(req);
        this.service.bookmark({ userId: body.userId, tripId: body.tripId });
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, bookmarked: true }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    if (req.method === 'POST' && path === '/trip/unbookmark') {
      try {
        const body = await this.readJson(req);
        this.service.unbookmark({ userId: body.userId, tripId: body.tripId });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, bookmarked: false }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    if (req.method === 'GET' && path === '/trip/bookmarks') {
      const userId = url.searchParams.get('userId') || '';
      try {
        if (!userId) throw new Error('userId is required');
        const trips = this.service.listTripsByUser(userId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, userId, trips }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    return false;
  }

  private async readJson(req: IncomingMessage): Promise<any> {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const raw = Buffer.concat(chunks).toString('utf8');
    try {
      return JSON.parse(raw || '{}');
    } catch {
      throw new Error('Invalid JSON');
    }
  }
}

// Minimal placeholder module for consistency
export class BookmarkModule {}

