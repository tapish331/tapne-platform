import type { IncomingMessage, ServerResponse } from 'node:http';
import { ProfileService } from './profile.service';
import { validateCreateProfileDto } from './dto/create-profile.dto';
import { validateUpdateProfileDto } from './dto/update-profile.dto';

export class ProfileController {
  constructor(private readonly service: ProfileService) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    if (!req.url) return false;
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (req.method === 'POST' && path === '/profile/create') {
      try {
        const body = await this.readJson(req);
        validateCreateProfileDto(body);
        const profile = this.service.create(body);
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, profile }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    if (req.method === 'PATCH' && path === '/profile/update') {
      try {
        const body = await this.readJson(req);
        validateUpdateProfileDto(body);
        const profile = this.service.update(body);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, profile }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    if (req.method === 'GET' && path.startsWith('/profile/')) {
      const urlObj = new URL(req.url, 'http://localhost');
      const username = decodeURIComponent(path.replace('/profile/', ''));
      try {
        const viewer = urlObj.searchParams.get('excludeBlockedForUserId') || '';
        const profile = viewer
          ? this.service.getByUsernameForViewer(username, viewer)
          : this.service.getByUsername(username);
        if (!profile) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Not Found' }));
          return true;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, profile }));
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
