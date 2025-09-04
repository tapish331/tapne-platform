import type { IncomingMessage, ServerResponse } from 'node:http';
import { TripService } from './trip.service';
import { validateCreateTripDto } from './dto/create-trip.dto';
import { validateUpdateTripDto } from './dto/update-trip.dto';
import { parseListTripsQuery } from './dto/list-trips.dto';

export class TripController {
  constructor(private readonly service: TripService) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    if (!req.url) return false;
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (req.method === 'POST' && path === '/trip/create') {
      try {
        const body = await this.readJson(req);
        validateCreateTripDto(body);
        const trip = this.service.create(body);
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, trip }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    if (req.method === 'PATCH' && path === '/trip/update') {
      try {
        const body = await this.readJson(req);
        validateUpdateTripDto(body);
        const trip = this.service.update(body);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, trip }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: String((e as Error).message || e) }));
      }
      return true;
    }

    if (req.method === 'GET' && path === '/trip') {
      const q = parseListTripsQuery(url.searchParams);
      const page = q.page ? Number(q.page) : undefined;
      const pageSize = q.pageSize ? Number(q.pageSize) : undefined;
      const sort = q.sort === 'title' ? 'title' : 'createdAt';
      const order = q.order === 'asc' ? 'asc' : 'desc';
      const result = this.service.list({
        page,
        pageSize,
        sort,
        order,
        ownerId: q.ownerId,
        includePrivateForOwnerId: q.includePrivateForOwnerId,
        excludeBlockedForUserId: q.excludeBlockedForUserId,
      });
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, ...result }));
      return true;
    }

    if (req.method === 'GET' && path.startsWith('/trip/')) {
      const slug = decodeURIComponent(path.replace('/trip/', ''));
      const trip = this.service.getBySlug(slug);
      if (!trip) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'Not Found' }));
        return true;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, trip }));
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
export class TripModule {}
