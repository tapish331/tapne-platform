import http from 'node:http';
import { getHealth } from './health/health.controller';
import { attachLogging } from './common/logging.interceptor';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { AuthService } from '../domains/auth/auth.service';
import { AuthController } from '../domains/auth/auth.controller';
import { EmailController } from '../domains/auth/controllers/email.controller';
import { RateLimitGuard } from './security/rate-limit.guard';
import { CaptchaService } from './security/captcha.service';
import { MediaService } from './media/media.service';
import { MediaController } from './media/media.controller';
import { ProfileService } from '../domains/profile/profile.service';
import { ProfileController } from '../domains/profile/profile.controller';
import { TripService } from '../domains/trip/trip.service';
import { TripController } from '../domains/trip/trip.controller';
import { BookmarkService } from '../domains/trip/bookmark.service';
import { BookmarkController } from '../domains/trip/bookmark.controller';
import { ParticipationService } from '../domains/trip/participation.service';
import { ParticipationController } from '../domains/trip/participation.controller';
import { ReviewService } from '../domains/review/review.service';
import { ReviewController } from '../domains/review/review.controller';
import { FollowService } from '../domains/social/follow.service';
import { FollowController } from '../domains/social/follow.controller';
import { ModerationService } from '../domains/moderation/moderation.service';
import { ModerationController } from '../domains/moderation/moderation.controller';
import { SearchService } from '../domains/search/search.service';
import { SearchController } from '../domains/search/search.controller';

export function createServer() {
  const authService = new AuthService(process.env);
  const authController = new AuthController(authService, process.env);
  const emailController = new EmailController(authService, process.env);
  const captcha = new CaptchaService(process.env);
  const limiter = new RateLimitGuard(
    { windowMs: 60_000, max: 60 },
    {
      perPath: {
        '/auth/signup': { windowMs: 60_000, max: 5 },
        '/auth/login': { windowMs: 60_000, max: 10 },
        '/auth/email/send-verification': { windowMs: 60_000, max: 5 },
        '/auth/email/send-reset': { windowMs: 60_000, max: 5 },
      },
      trustProxy: process.env.TRUST_PROXY === '1',
    }
  );
  const mediaService = new MediaService(process.env);
  const mediaController = new MediaController(mediaService);
  const profileService = new ProfileService(process.env);
  const profileController = new ProfileController(profileService);
  const moderationService = new ModerationService();
  const moderationController = new ModerationController(moderationService);
  const tripService = new TripService(moderationService);
  profileService.setBlockProvider?.(moderationService);
  const tripController = new TripController(tripService);
  const searchService = new SearchService(tripService, profileService);
  const searchController = new SearchController(searchService);
  const bookmarkService = new BookmarkService(tripService);
  const bookmarkController = new BookmarkController(bookmarkService);
  const participationService = new ParticipationService(tripService);
  const participationController = new ParticipationController(participationService);
  const reviewService = new ReviewService(tripService);
  const reviewController = new ReviewController(reviewService);
  const followService = new FollowService();
  const followController = new FollowController(followService);
  const server = http.createServer(async (req, res) => {
    const { requestId, log, done } = attachLogging(req, res);
    // Ensure header is explicitly present (observability)
    try { res.setHeader('X-Request-Id', requestId); } catch {}
    // Basic CORS for health check
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Security headers (minimal Helmet-like hardening)
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    if (!req.url) {
      res.statusCode = 400;
      res.end('Bad Request');
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      const body = JSON.stringify(getHealth());
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(body);
      done();
      return;
    }

    // Rate-limit public endpoints
    if (!limiter.allow(req, res)) return;

    // Enforce CAPTCHA on signup via header x-captcha-token (only when enabled)
    try {
      if (
        process.env.ENFORCE_CAPTCHA_SIGNUP === '1' &&
        req.method === 'POST' &&
        req.url &&
        new URL(req.url, 'http://localhost').pathname === '/auth/signup'
      ) {
        const tokenHeader = req.headers['x-captcha-token'];
        const token = Array.isArray(tokenHeader) ? tokenHeader[0] : tokenHeader;
        const ok = await captcha.verify(token || '');
        if (!ok) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: false, error: 'Invalid CAPTCHA' }));
          done();
          return;
        }
      }
    } catch (e) {
      new HttpExceptionFilter().handle(req, res, e, requestId);
      done();
      return;
    }

    // Auth + email routes
    authController
      .handle(req, res)
      .then((handled) => {
        if (handled) return true; // propagate handled
        return emailController.handle(req, res);
      })
      .then((handled) => {
        if (handled) return true; // propagate
        return mediaController.handle(req, res);
      })
      .then((handled) => {
        if (handled) return true; // propagate
        return profileController.handle(req, res);
      })
      .then((handled) => {
        if (handled) return true; // propagate
        return searchController.handle(req, res);
      })
      .then((handled) => {
        if (handled) return true; // propagate
        // Handle bookmark/participation endpoints before generic /trip/:slug
        return bookmarkController.handle(req, res);
      })
      .then((handled) => {
        if (handled) return true; // propagate
        return participationController.handle(req, res);
      })
      .then((handled) => {
        if (handled) return true; // propagate
        return tripController.handle(req, res);
      })
      .then((handled) => {
        if (handled) return true; // propagate
        return reviewController.handle(req, res);
      })
      .then((handled) => {
        if (handled) return true; // propagate
        return followController.handle(req, res);
      })
      .then((handled) => {
        if (handled) return true; // propagate
        return moderationController.handle(req, res);
      })
      .then((handled) => {
        if (handled) return; // already handled
        res.statusCode = 404;
        res.end('Not Found');
        done();
      })
      .catch((err) => {
        new HttpExceptionFilter().handle(req, res, err, requestId);
      })
      .finally(() => {
        try {
          done();
        } catch {
          /* ignore */
        }
      });
    return;

  });

  return server;
}

// Allow running directly (manual dev)
if (require.main === module) {
  const server = createServer();
  const port = Number(process.env.PORT || 3001);
  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend server listening on http://localhost:${port}`);
  });
}
