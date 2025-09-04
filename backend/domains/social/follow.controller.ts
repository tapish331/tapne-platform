import type { IncomingMessage, ServerResponse } from 'node:http';
import { FollowService } from './follow.service';

export class FollowController {
  constructor(private readonly service: FollowService) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    if (!req.url) return false;
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (req.method === 'POST' && path === '/social/follow') {
      try {
        const body = await this.readJson(req);
        this.service.follow({ followerId: body.followerId, followeeId: body.followeeId });
        const counts = this.service.getCounts(body.followeeId);
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, following: true, counts }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    if (req.method === 'POST' && path === '/social/unfollow') {
      try {
        const body = await this.readJson(req);
        this.service.unfollow({ followerId: body.followerId, followeeId: body.followeeId });
        const counts = this.service.getCounts(body.followeeId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, following: false, counts }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    if (req.method === 'GET' && path === '/social/counts') {
      const userId = url.searchParams.get('userId') || '';
      try {
        const counts = this.service.getCounts(userId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, userId, counts }));
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

// Minimal module placeholder for consistency
export class FollowModule {}

