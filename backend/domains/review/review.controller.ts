import type { IncomingMessage, ServerResponse } from 'node:http';
import { ReviewService } from './review.service';
import { validateCreateReviewDto } from './dto/create-review.dto';
import { parseListReviewsQuery } from './dto/list-reviews.dto';

export class ReviewController {
  constructor(private readonly service: ReviewService) {}

  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    if (!req.url) return false;
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname;

    if (req.method === 'POST' && path === '/review/create') {
      try {
        const body = await this.readJson(req);
        validateCreateReviewDto(body);
        const review = this.service.create(body);
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: true, review }));
      } catch (e) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({ ok: false, error: String((e as Error).message || e) })
        );
      }
      return true;
    }

    if (req.method === 'GET' && path === '/review') {
      const q = parseListReviewsQuery(url.searchParams);
      if (!q.tripId) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ ok: false, error: 'tripId is required' }));
        return true;
      }
      const reviews = this.service.listByTrip(q.tripId);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: true, reviews }));
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
export class ReviewModule {}

