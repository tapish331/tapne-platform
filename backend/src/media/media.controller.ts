import type { IncomingMessage, ServerResponse } from 'node:http';
import { MediaService } from './media.service';

export class MediaController {
  constructor(private readonly service: MediaService) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    if (!req.url) return false;
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (req.method === 'POST' && path === '/media/presign') {
      try {
        const body = await this.readJson(req);
        const result = this.service.getPresignedUpload({
          filename: String(body.filename || ''),
          contentType: String(body.contentType || ''),
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, ...result }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    if (req.method === 'POST' && path === '/media/webhook') {
      try {
        const body = await this.readJson(req);
        const result = await this.service.handleUploadWebhook({ key: String(body.key || '') });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(result));
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

