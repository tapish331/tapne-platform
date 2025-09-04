import type { IncomingMessage, ServerResponse } from 'node:http';
import { ModerationService } from './moderation.service';

export class ModerationController {
  constructor(private readonly service: ModerationService) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    if (!req.url) return false;
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    // --- Block / Unblock ---
    if (req.method === 'POST' && path === '/moderation/block') {
      try {
        const body = await this.readJson(req);
        this.service.block(body.blockerId, body.blockedId);
        const blockedIds = this.service.listBlockedIdsFor(body.blockerId);
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, blocked: true, blockedIds }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    if (req.method === 'POST' && path === '/moderation/unblock') {
      try {
        const body = await this.readJson(req);
        this.service.unblock(body.blockerId, body.blockedId);
        const blockedIds = this.service.listBlockedIdsFor(body.blockerId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, blocked: false, blockedIds }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    if (req.method === 'GET' && path === '/moderation/blocked') {
      try {
        const userId = url.searchParams.get('userId') || '';
        const blockedIds = this.service.listBlockedIdsFor(userId);
        const blockedByIds = this.service.listBlockedByIds(userId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, userId, blockedIds, blockedByIds }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    // --- Mute / Unmute --- (optional UX helper)
    if (req.method === 'POST' && path === '/moderation/mute') {
      try {
        const body = await this.readJson(req);
        this.service.mute(body.muterId, body.mutedId);
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, muted: true }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    if (req.method === 'POST' && path === '/moderation/unmute') {
      try {
        const body = await this.readJson(req);
        this.service.unmute(body.muterId, body.mutedId);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, muted: false }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    // --- Report ---
    if (req.method === 'POST' && path === '/moderation/report') {
      try {
        const body = await this.readJson(req);
        const rec = this.service.createReport(body);
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, report: rec }));
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
export class ModerationModule {}

