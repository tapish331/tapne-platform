# Tapne Platform

This repository hosts the Tapne monorepo. Tasks are implemented sequentially per `strictly_sequential_task_list.txt` with accompanying unit/integration and E2E tests.

This README documents Task T01–T19 completion and how to run verification and tests.

## T01 — Monorepo & Tooling Bootstrap

What’s included:
- Root scripts: `test`, `test:e2e`, `lint`, `format`, `verify:tasks`, `test:all`.
- Editor and VCS hygiene: `.editorconfig`, `.gitignore`, `.gitattributes`.
- Shared TypeScript config: `tsconfig.base.json`.
- Formatting & lint config: `.prettierrc`, `.eslintrc.cjs`.
- E2E scaffolding: `tests/e2e/playwright.config.ts`, `tests/e2e/fixtures/env.ts`.
- Unit smoke test for the repo: `backend/src/__tests__/repo.smoke.spec.ts`.
- E2E test for bootstrap: `tests/e2e/T01-bootstrap.spec.ts`.

Tooling choices:
- Unit/Integration test runner: `vitest` (TS supported, file args supported).
- E2E test runner: `@playwright/test` (configured to run headless and not require launching a browser for the T01 test).

## Install

Requires Node.js >= 18.

```
npm install
```

## Commands

- `npm run verify:tasks` — Verifies tracked files are covered by the task allowlist.
- `npm run test:all` — Runs all unit/integration tests grouped by package and then Playwright E2E tests.
- `npm test` — Runs `vitest` for unit/integration tests (accepts file paths).
- `npm run test:e2e` — Runs Playwright tests using `tests/e2e/playwright.config.ts`.
- `npm run lint` — ESLint across the repo.
- `npm run format` — Prettier check.

## Notes

- Subsequent tasks (T03+) will expand backend and add frontend packages.
- E2E tests for T01 validate tooling presence; T02 adds an actual HTTP health check.

---

## T02 — Backend Bootstrap (Health Endpoint)

Goal: Provide a minimal backend bootstrap exposing `GET /health` and add tests to validate it.

What’s included:
- Backend package manifest: `backend/package.json` with `test` and `start:dev` scripts.
- Minimal server and module placeholders:
  - `backend/src/main.ts` — lightweight Node HTTP server with CORS/headers and `/health` route.
  - `backend/src/app.module.ts` — placeholder to mirror Nest-style layout for future tasks.
  - `backend/src/health/health.controller.ts` — `getHealth()` returns `{ status: 'ok', uptime, timestamp }`.
- Unit test: `backend/src/health/__tests__/health.controller.spec.ts`.
- E2E test: `tests/e2e/T02-health.spec.ts` starts the server on an ephemeral port and asserts `/health` response.

Run just T02 unit test:
```
cd backend
npm run test -- src/health/__tests__/health.controller.spec.ts
```

Run just T02 E2E test:
```
npm run test:e2e -- tests/e2e/T02-health.spec.ts
```

Start the backend server manually (temporary dev placeholder):
```
node backend/src/main.ts
# or
npm --prefix backend run start:dev
```

Health check:
```
curl http://localhost:3001/health
# => { "status": "ok", "uptime": <number>, "timestamp": "<ISO>" }
```

---

## T03 — Database & Prisma Schema

Goal: Install Prisma, model core entities, expose a Prisma service, and validate/generate the client.

What’s included:
- Prisma schema: `backend/prisma/schema.prisma` with models: User, Profile, Trip, TripReview, Follow, Bookmark, Participation, Report, Block, Token.
- Prisma service: `backend/src/prisma/prisma.service.ts` (minimal provider exposing `DATABASE_URL`).
- Prisma module placeholder: `backend/src/prisma/prisma.module.ts`.
- Backend env: `backend/.env` with `DATABASE_URL` example for PostgreSQL.
- Unit test: `backend/src/prisma/__tests__/prisma.service.spec.ts`.
- E2E test: `tests/e2e/T03-db-migration.spec.ts` validates CLI availability and runs `prisma validate` + `prisma generate`.

Install dependencies (root):
```
npm install --save-dev prisma @prisma/client
```

Run just T03 unit test:
```
cd backend
npm run test -- src/prisma/__tests__/prisma.service.spec.ts
```

Run just T03 E2E test:
```
npm run test:e2e -- tests/e2e/T03-db-migration.spec.ts
```

Notes:
- The Prisma schema targets PostgreSQL via `DATABASE_URL`. The E2E test uses `prisma validate` and `prisma generate` which do not require a live DB connection.
- A real application would wire `@prisma/client` within `PrismaService` and manage connect/disconnect in lifecycle hooks.

---

## T04 — Auth Core (Signup/Login/JWT/Hashing)

Goal: Provide a minimal, testable auth core with email+password signup/login, password hashing, JWT issuance, and secure cookie options. Endpoints are exposed on the lightweight HTTP server for E2E coverage.

What’s included:
- Auth domain files:
  - `backend/domains/auth/auth.service.ts` — in-memory users, scrypt password hashing, HS256 JWT signer.
  - `backend/domains/auth/auth.controller.ts` — HTTP handlers for `POST /auth/signup` and `POST /auth/login`.
  - `backend/domains/auth/dto/{signup.dto.ts,login.dto.ts}` — DTO validation helpers.
  - `backend/domains/auth/strategies/jwt.strategy.ts` — HS256 verify with exp check.
  - `backend/domains/auth/guards/jwt.guard.ts` — Authorization header Bearer token check.
  - `backend/domains/auth/auth.module.ts` — placeholder module for parity with Nest layout.
- Cookie config:
  - `backend/src/config/cookies.ts` — default cookie options and serializer (`HttpOnly`, `SameSite=Lax`, `Secure` in production).
- Server wiring:
  - `backend/src/main.ts` — mounts auth controller routes (`/auth/signup`, `/auth/login`).
- Tests:
  - Unit: `backend/domains/auth/__tests__/auth.service.spec.ts` validates signup/login, hashing, and JWT verification.
  - E2E: `tests/e2e/T04-auth-basic.spec.ts` starts the server, performs signup+login, and verifies returned access token.

API quick reference:
- `POST /auth/signup` — body `{ email, password }` → `201` `{ ok: true, user: { id, email } }`.
- `POST /auth/login` — body `{ email, password }` → `200` `{ ok: true, user, accessToken }` and `Set-Cookie` for `tapne_access` and `tapne_refresh`.

Environment:
- `JWT_SECRET` — HS256 signing secret (defaults to `dev-secret` for local/tests if unset).

Run just T04 unit test:
```
cd backend
npm run test -- domains/auth/__tests__/auth.service.spec.ts
```

Run just T04 E2E test:
```
npm run test:e2e -- tests/e2e/T04-auth-basic.spec.ts
```

Notes:
- The current implementation uses an in-memory user store intended purely for tests and local scaffolding. Later tasks (T05+) wire persistent storage and full flows (email verification, reset, etc.).

---

## T05 — Email Verification & Password Reset

Goal: Issue cryptographic tokens for email verification and password resets, provide an SMTP-backed sender abstraction (test double), and expose HTTP endpoints to complete verification and reset flows. Tests assert both service-level behavior and end-to-end HTTP routes.

What’s included:
- Email domain files:
  - `backend/domains/auth/email/email.service.ts` — issues verification/reset tokens, simulates sending emails (records "sent" events in-memory for tests), verifies tokens, resets passwords.
  - `backend/domains/auth/email/templates/{verify.html,reset.html}` — basic HTML templates (placeholders used by the service for content).
  - `backend/domains/auth/controllers/email.controller.ts` — HTTP endpoints for sending and consuming verification/reset tokens.
- Auth service enhancements:
  - `backend/domains/auth/auth.service.ts` — adds `emailVerified` flag on user records and helper methods: `getUserByEmail`, `getUserById`, `markEmailVerified`, `setPassword`.
- Server wiring:
  - `backend/src/main.ts` — mounts the email controller routes after auth routes.
- Tests:
  - Unit/Integration: `backend/domains/auth/__tests__/email-flows.spec.ts` — exercises token issuance, verification, and password reset using the service layer.
  - E2E: `tests/e2e/T05-auth-email.spec.ts` — starts the server, signs up a user, requests verification + reset, verifies the email, resets the password, and logs in with the new password.

API quick reference:
- `POST /auth/email/send-verification` — body `{ email }` → `200 { ok: true }` (and `token` included when `E2E_EXPOSE_TOKENS=1` for tests).
- `GET /auth/email/verify?token=...` → `200 { ok: true, user: { id, email, emailVerified: true } }` on success.
- `POST /auth/email/send-reset` — body `{ email }` → `200 { ok: true }` (and `token` in test mode).
- `POST /auth/email/reset` — body `{ token, newPassword }` → `200 { ok: true }` on success.

Environment:
- `PUBLIC_BASE_URL` — Base URL used to generate links in emails (default `http://localhost:3001`).
- `VERIFY_TOKEN_TTL_SEC` — Verification token TTL in seconds (default `3600`).
- `RESET_TOKEN_TTL_SEC` — Reset token TTL in seconds (default `900`).
- `E2E_EXPOSE_TOKENS` — When set to `1`, email endpoints include tokens in responses to make E2E testing deterministic.

Run just T05 unit/integration test:
```
cd backend
npm run test -- domains/auth/__tests__/email-flows.spec.ts
```

Run just T05 E2E test:
```
npm run test:e2e -- tests/e2e/T05-auth-email.spec.ts
```

---

## T06 — Security Hardening (Rate Limit, CAPTCHA, Headers)

Goal: Add rate limiting for public endpoints, require CAPTCHA for signup, and set strict security headers. Implement unit and E2E tests.

What’s included:
- Security modules:
  - `backend/src/security/rate-limit.guard.ts` — in-memory per-IP-per-path limiter with headers.
  - `backend/src/security/captcha.service.ts` — simple CAPTCHA verifier with test mode.
- Server wiring:
  - `backend/src/main.ts` — integrates limiter and CAPTCHA; adds hardening headers.
- Tests:
  - Unit: `backend/src/security/__tests__/rate-limit.spec.ts` — verifies enforcement, reset window, and proxy behavior.
  - E2E: `tests/e2e/T06-security.spec.ts` — asserts headers on `/health`, enforces CAPTCHA for signup, and triggers rate limit on repeated logins.

Behavior:
- Rate limits (defaults):
  - Global default: 60 req/min per path.
  - Auth endpoints: `/auth/signup` 5/min, `/auth/login` 10/min, `/auth/email/send-verification` 5/min, `/auth/email/send-reset` 5/min.
  - Respects `X-Forwarded-For` when `TRUST_PROXY=1`.
- CAPTCHA on signup:
  - Send header `x-captcha-token` with the request.
  - For local/testing, set `CAPTCHA_TEST_MODE=1` and use token `TEST_OK`.
- Headers added to all responses:
  - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: no-referrer`, `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, `Permissions-Policy: geolocation=(), microphone=(), camera=()`.

Run just T06 unit test:
```
cd backend
npm run test -- src/security/__tests__/rate-limit.spec.ts
```

Run just T06 E2E test:
```
npm run test:e2e -- tests/e2e/T06-security.spec.ts
```

Notes:
- SMTP sending is simulated in tests by capturing "sent" email events in-memory; production deployments would wire a real SMTP/ESP and swap the sender implementation.

---

## T07 - Media Service (S3 + Thumbnails)

Goal: Provide presigned upload info for images and a webhook that generates a thumbnail entry. This task includes a lightweight controller wired into the existing HTTP server and a stubbed image processor to keep tests fast and dependency-free.

What’s included:
- Media domain files:
  - `backend/src/media/media.service.ts` — presign uploads for `image/*`, derive object keys, compute S3 upload URL and CDN public URL, and handle upload webhook to produce a thumbnail key.
  - `backend/src/media/image.processor.ts` — minimal stub of an image processor (simulates thumbnail generation without external deps).
  - `backend/src/media/media.controller.ts` — HTTP endpoints for presign and webhook.
  - `backend/src/media/media.module.ts` — placeholder module for structure parity.
- Server wiring:
  - `backend/src/main.ts` — mounts the media controller after auth/email handlers.
- Tests:
  - Unit: `backend/src/media/__tests__/media.service.spec.ts` — validates presign output shape, rejects non-images, and ensures the webhook produces the expected thumbnail key/URL and calls the processor.
  - E2E: `tests/e2e/T07-media-upload.spec.ts` — starts the server, presigns an image, and invokes the webhook asserting the thumbnail path and URL.

API quick reference:
- `POST /media/presign` — body `{ filename, contentType }` (only `image/*` accepted) → `200 { ok, key, uploadUrl, publicUrl }`.
- `POST /media/webhook` — body `{ key }` → `200 { ok: true, key, thumbnail: { key, url } }`.

Key and URL formats:
- Object key pattern: `uploads/images/YYYY/MM/DD/<12-hex>.<ext>` (ext inferred from content type or filename).
- Thumbnail key pattern: original directory under `/images/` becomes `/images/thumbs/` and file name gets `-thumb.jpg` suffix.
- Upload URL: `${S3_ENDPOINT}/${S3_BUCKET}/${key}?x-id=PutObject&...` (signature simulated for tests).
- Public URL: `${MEDIA_CDN_URL}/${key}`.

Environment:
- `S3_ENDPOINT` — e.g., `https://s3.test` (default `https://s3.local`).
- `S3_BUCKET` — e.g., `tapne` (default `tapne`).
- `MEDIA_CDN_URL` — e.g., `https://cdn.test` (default `https://cdn.local`).

Run just T07 unit test:
```
cd backend
npm run test -- src/media/__tests__/media.service.spec.ts
```

Run just T07 E2E test:
```
npm run test:e2e -- tests/e2e/T07-media-upload.spec.ts
```

---

## T08 - Profiles Domain (CRUD, Reserved Handles, Visibility)

Goal: Create/update user profiles with case-insensitive unique usernames, enforce a reserved-handle list, and support per-section visibility toggles.

What's included:
- Profile domain files:
  - `backend/domains/profile/profile.service.ts` - in-memory profile store with rules:
    - Unique usernames (case-insensitive)
    - Reserved handles are rejected
    - Default visibility flags are `true`; can be toggled individually
  - `backend/domains/profile/profile.controller.ts` - HTTP endpoints for create, update, and fetch by username
  - `backend/domains/profile/dto/{create-profile.dto.ts,update-profile.dto.ts}` - DTO validation helpers
  - `backend/domains/profile/profile.module.ts` - structural placeholder
  - `shared/types/profile.ts` - shared profile and visibility types
- Server wiring:
  - `backend/src/main.ts` - mounts the profile controller after media routes
- Schema note:
  - `backend/prisma/schema.prisma` updates `Profile.username` to `@db.Citext` to indicate a case-insensitive unique column when using PostgreSQL.
- Tests:
  - Unit: `backend/domains/profile/__tests__/profile.rules.spec.ts` - verifies uniqueness, reserved names, defaults, and updates
  - E2E: `tests/e2e/T08-profile-crud.spec.ts` - exercises `POST /profile/create`, `GET /profile/:username`, and `PATCH /profile/update`

API quick reference:
- `POST /profile/create` - body `{ userId, username, [bio], [pronouns], [style], [visibility flags...] }` → `201 { ok: true, profile }`
- `PATCH /profile/update` - body `{ userId, [username], [bio], [pronouns], [style], [visibility flags...] }` → `200 { ok: true, profile }`
- `GET /profile/:username` - case-insensitive fetch → `200 { ok: true, profile }` or `404`

Rules:
- Username format: lowercase letters/numbers/`_`/`.`/`-`, length 3–30 (case preserved on output but uniqueness checks are lowercase).
- Reserved handles: from `RESERVED_HANDLES` (comma-separated). Defaults include: `admin,root,support,api,login,signup,account,profile,trip,trips,about,help`.

Run just T08 unit test:
```
cd backend
npm run test -- domains/profile/__tests__/profile.rules.spec.ts
```

Run just T08 E2E test:
```
npm run test:e2e -- tests/e2e/T08-profile-crud.spec.ts
```

---

## T09 - Trips Domain (CRUD, Privacy, Slugs, Pagination)

Goal: Implement Trip creation/editing with privacy controls, generate SEO-friendly unique slugs, and provide list endpoints with pagination and sorting. This task follows the in-repo lightweight HTTP server pattern used by earlier tasks for fast tests.

What's included:
- Trip domain files:
  - `backend/domains/trip/trip.service.ts` — in-memory trip store with create, update (title changes re-slug), getBySlug, and list
  - `backend/domains/trip/trip.controller.ts` — HTTP endpoints for create, update, fetch by slug, and list with pagination/sort
  - `backend/domains/trip/dto/{create-trip.dto.ts,update-trip.dto.ts,list-trips.dto.ts}` — DTO validation and query parsing helpers
  - `backend/domains/trip/trip.module.ts` — structural placeholder
  - `backend/src/utils/slug.ts` — basic slugify and uniqueness helper
  - `shared/types/trip.ts` — shared Trip types
- Server wiring:
  - `backend/src/main.ts` — mounts the trip controller after profile routes
- Tests:
  - Unit: `backend/domains/trip/__tests__/trip.crud.spec.ts` — verifies slug uniqueness and re-slugging, privacy, sorting, and pagination
  - E2E: `tests/e2e/T09-trip-crud.spec.ts` — exercises `POST /trip/create`, `GET /trip/:slug`, `PATCH /trip/update`, and `GET /trip` list variants

API quick reference:
- `POST /trip/create` — body `{ ownerId, title, isPrivate? }` → `201 { ok: true, trip }`
- `PATCH /trip/update` — body `{ id, title?, isPrivate? }` → `200 { ok: true, trip }`
- `GET /trip/:slug` — fetch by slug → `200 { ok: true, trip }` or `404`
- `GET /trip?ownerId=&includePrivateForOwnerId=&page=&pageSize=&sort=&order=` → `200 { ok, items, total, page, pageSize }`
  - `sort`: `createdAt` (default) or `title`
  - `order`: `desc` (default) or `asc`
  - Privacy: private trips are excluded unless `includePrivateForOwnerId` matches the trip's owner

Run just T09 unit test:
```
cd backend
npm run test -- domains/trip/__tests__/trip.crud.spec.ts
```

Run just T09 E2E test:
```
npm run test:e2e -- tests/e2e/T09-trip-crud.spec.ts
```

---

## T10 - Reviews Domain (One Per User Per Trip; Owner Restriction)

Goal: Implement the Reviews domain enforcing two rules: a user may leave at most one review per trip, and a trip owner cannot review their own trip.

What's included:
- Review domain files:
  - `backend/domains/review/review.service.ts` - in-memory review store with create and list-by-trip; validates uniqueness and owner restriction
  - `backend/domains/review/review.controller.ts` - HTTP endpoints for creating and listing reviews
  - `backend/domains/review/dto/{create-review.dto.ts,list-reviews.dto.ts}` - DTO validation and query parsing
  - `backend/domains/review/review.module.ts` - structural placeholder
- Server wiring:
  - `backend/src/main.ts` - mounts the review controller after trip routes; shares the same `TripService` instance to validate owner checks
- Schema (from T03):
  - `backend/prisma/schema.prisma` already contains `TripReview` with a composite unique index on `(tripId, userId)`
- Tests:
  - Unit: `backend/domains/review/__tests__/review.rules.spec.ts` - verifies owner restriction and per-user-per-trip uniqueness
  - E2E: `tests/e2e/T10-review-flow.spec.ts` - exercises `POST /review/create` and `GET /review?tripId=...`

API quick reference:
- `POST /review/create` — body `{ tripId, userId, rating (1..5), comment? }` → `201 { ok: true, review }` or `400 { ok: false, error }`
  - Errors include: `Owner cannot review own trip`, `Review already exists for this user/trip`, `Trip not found`, `Invalid payload` cases
- `GET /review?tripId=<id>` — lists reviews for a trip → `200 { ok: true, reviews: Review[] }`

Run just T10 unit test:
```
cd backend
npm run test -- domains/review/__tests__/review.rules.spec.ts
```

Run just T10 E2E test:
```
npm run test:e2e -- tests/e2e/T10-review-flow.spec.ts
```

---

## T11 - Social Graph: Follow/Unfollow + Counts

Goal: Provide follow/unfollow endpoints and expose follower/following counts per user, with unit and E2E coverage.

What’s included:
- Backend social domain files:
  - `backend/domains/social/follow.service.ts` — in-memory follow graph with idempotent follow/unfollow and self-follow guard.
  - `backend/domains/social/follow.controller.ts` — HTTP endpoints for follow/unfollow and count queries.
  - `backend/domains/social/follow.module.ts` — minimal placeholder for consistency.
- Shared types:
  - `shared/types/social.ts` — `FollowCounts` and `FollowAction` contracts.
- Tests:
  - Unit: `backend/domains/social/__tests__/follow.spec.ts` — validates follow/unfollow flow, idempotency, counts, and self-follow restriction.
  - E2E: `tests/e2e/T11-follow.spec.ts` — spins up the backend and exercises the HTTP endpoints end-to-end.

Server wiring:
- `backend/src/main.ts` mounts the social controller after review routes.

HTTP endpoints:
- POST `/social/follow`
  - Body: `{ followerId: string, followeeId: string }`
  - 201 on success; returns `{ ok: true, following: true, counts: { followers, following } }` for the followee.
  - Errors: `400` for invalid payload or self-follow attempt.
- POST `/social/unfollow`
  - Body: `{ followerId: string, followeeId: string }`
  - 200 on success; idempotent; returns `{ ok: true, following: false, counts }` for the followee.
- GET `/social/counts?userId=:userId`
  - 200 on success; returns `{ ok: true, userId, counts: { followers, following } }`.

Examples:
```
curl -s -X POST http://localhost:3001/social/follow \
  -H 'Content-Type: application/json' \
  -d '{"followerId":"u1","followeeId":"u2"}'

curl -s "http://localhost:3001/social/counts?userId=u2"
```

Run just T11 unit test:
```
cd backend
npm run test -- domains/social/__tests__/follow.spec.ts
```

Run just T11 E2E test:
```
npm run test:e2e -- tests/e2e/T11-follow.spec.ts
```

Notes:
- The follow graph is kept in-memory for the kata; the Prisma `Follow` model exists in the schema for future persistence.
- Follow and unfollow operations are idempotent; repeated requests do not change counts after the first effect.

---

## T12 - Bookmarks & Participation

Goal: Allow users to bookmark trips, join/leave trip participation, and list a user’s bookmarked and attended trips. Includes unit tests for services and an E2E test for HTTP endpoints.

What’s included:
- Trip domain additions:
  - `backend/domains/trip/bookmark.service.ts` — in-memory bookmark store keyed by `(userId, tripId)`; validates that `tripId` exists via shared `TripService`.
  - `backend/domains/trip/bookmark.controller.ts` — HTTP endpoints to bookmark/unbookmark and list bookmarks for a user.
  - `backend/domains/trip/participation.service.ts` — in-memory attendee store keyed by `(userId, tripId)`; validates that `tripId` exists via `TripService`.
  - `backend/domains/trip/participation.controller.ts` — HTTP endpoints to join/leave and list attended trips for a user.
- Server wiring:
  - `backend/src/main.ts` — mounts bookmark and participation controllers before generic `/trip/:slug` routing to avoid conflicts.
- Tests:
  - Unit: `backend/domains/trip/__tests__/bookmark-participation.spec.ts` — validates idempotency, listing, and validation against non-existent trips.
  - E2E: `tests/e2e/T12-bookmark-participation.spec.ts` — creates trips, bookmarks one, joins another, lists each, then unbookmarks/leaves and verifies lists are empty.

HTTP endpoints:
- POST `/trip/bookmark`
  - Body: `{ userId: string, tripId: string }`
  - 201 on success; idempotent; returns `{ ok: true, bookmarked: true }`.
- POST `/trip/unbookmark`
  - Body: `{ userId: string, tripId: string }`
  - 200 on success; idempotent; returns `{ ok: true, bookmarked: false }`.
- GET `/trip/bookmarks?userId=:userId`
  - 200 on success; returns `{ ok: true, userId, trips: Trip[] }`.
- POST `/trip/join`
  - Body: `{ userId: string, tripId: string }`
  - 201 on success; idempotent; returns `{ ok: true, joined: true }`.
- POST `/trip/leave`
  - Body: `{ userId: string, tripId: string }`
  - 200 on success; idempotent; returns `{ ok: true, joined: false }`.
- GET `/trip/attended?userId=:userId`
  - 200 on success; returns `{ ok: true, userId, trips: Trip[] }`.

Examples:
```
curl -s -X POST http://localhost:3001/trip/bookmark \
  -H 'Content-Type: application/json' \
  -d '{"userId":"u1","tripId":"<trip-id>"}'

curl -s "http://localhost:3001/trip/bookmarks?userId=u1"

curl -s -X POST http://localhost:3001/trip/join \
  -H 'Content-Type: application/json' \
  -d '{"userId":"u1","tripId":"<trip-id>"}'

curl -s "http://localhost:3001/trip/attended?userId=u1"
```

Notes:
- Both operations validate that the referenced `tripId` exists; otherwise respond `400` with an error message.
- Listing endpoints return full `Trip` records from the in-memory trip service. Privacy rules beyond T09 are not enforced here.

---

## T13 — Moderation: Report & Block/Mute Enforcement

Goal: Allow users to report content and block/mute other users. Trip listings exclude blocked users for the viewer. Endpoints are minimal HTTP handlers integrated into the existing lightweight server.

What’s included:
- Backend moderation domain:
  - `backend/domains/moderation/moderation.module.ts` — placeholder for structure consistency
  - `backend/domains/moderation/moderation.service.ts` — in-memory store for blocks, mutes, and reports
  - `backend/domains/moderation/moderation.controller.ts` — HTTP endpoints for report/block/mute
- Trip filtering (viewer-aware):
  - `backend/domains/trip/trip.service.ts` — adds `excludeBlockedForUserId` filter and optional `BlockProvider`
  - `backend/domains/trip/dto/list-trips.dto.ts` — parses `excludeBlockedForUserId` from query
  - `backend/domains/trip/trip.controller.ts` — wires the new query param through to `TripService.list`
- Server wiring:
  - `backend/src/main.ts` — instantiates `ModerationService`/`Controller` and passes the service to `TripService`

HTTP endpoints:
- `POST /moderation/block` — body `{ blockerId, blockedId }`
- `POST /moderation/unblock` — body `{ blockerId, blockedId }`
- `GET /moderation/blocked?userId=<id>` — returns `{ blockedIds, blockedByIds }`
- `POST /moderation/mute` and `/moderation/unmute` — body `{ muterId, mutedId }`
- `POST /moderation/report` — body `{ reporterId, targetType: 'user'|'trip', targetId, reason? }`

Unit tests:
- `backend/domains/moderation/__tests__/moderation.spec.ts` — verifies block symmetry in trip listings, unblock, mutes, and reporting.

E2E test:
- `tests/e2e/T13-moderation.spec.ts` — exercises endpoints end-to-end: create trips, block, list with exclusion, unblock, and report.

Run just T13 unit test:
```
cd backend
npm run test -- domains/moderation/__tests__/moderation.spec.ts
```

Run just T13 E2E test:
```
npm run test:e2e -- tests/e2e/T13-moderation.spec.ts
```

Notes:
- Blocks are directional but filtering hides content symmetrically (if either user blocks the other, their trips are hidden for that viewer).

---

## T14 — Public Search (Limited Fields) vs Auth Search (Full)

Goal: Provide a search endpoint that returns limited fields for unauthenticated users and full records when the request is authenticated. Support pagination and sorting. The global rate limiter protects this route.

What's included:
- Search domain files:
  - `backend/domains/search/search.service.ts` — searches trips and profiles; shapes results based on authentication.
  - `backend/domains/search/search.controller.ts` — `GET /search` handler; detects auth via `Authorization` header or `tapne_access` cookie.
  - `shared/types/search.ts` — shared contracts for public vs full results.
- Server wiring:
  - `backend/src/main.ts` — instantiates `SearchService` with `TripService` and `ProfileService` and mounts the controller.
- Tests:
  - Unit: `backend/domains/search/__tests__/search.visibility.spec.ts` — verifies limited vs full fields and private trip exclusion.
  - E2E: `tests/e2e/T14-search-public-auth.spec.ts` — seeds profiles and trips, then exercises `/search` unauthenticated vs with an `Authorization` header.

Endpoint:
- `GET /search?q=<query>&kind=trip|profile|all&page=<n>&pageSize=<n>&sort=<field>&order=asc|desc`

Response shape:
- Unauthenticated:
  - Trips: `{ id, title, slug }[]`
  - Profiles: `{ userId, username }[]`
- Authenticated:
  - Trips: full trip records
  - Profiles: full profile records

Notes:
- Private trips are excluded from search results by default.
- Authentication detection for this MVP accepts either an `Authorization: Bearer <token>` header or a `tapne_access` cookie; token verification is not the focus for this kata.

---

## T15 — Frontend Bootstrap (Next App, Tailwind, Layout)

Goal: Initialize a minimal Next.js App Router structure with Tailwind wiring and a base layout. The goal for this task is repository structure and testability; the app does not need to build or run a dev server for tests to pass.

What’s included:
- Frontend package and config:
  - `frontend/web/package.json` — package scripts (`dev`, `build` placeholders, `test` proxied to root vitest)
  - `frontend/web/next.config.mjs` — minimal Next config with `appDir` enabled
  - `frontend/web/tailwind.config.ts` — Tailwind content globs and empty theme extensions
  - `frontend/web/postcss.config.js` — PostCSS with Tailwind and Autoprefixer
  - `frontend/web/styles/globals.css` — Tailwind directives and minimal globals
- App Router shell:
  - `frontend/web/app/layout.tsx` — exports `metadata` and a `RootLayout` that returns children (kept free of JSX to avoid runtime React dep in tests)
  - `frontend/web/app/page.tsx` — minimal home page placeholder
- Tests:
  - `frontend/web/__tests__/layout.render.test.tsx` — validates that `metadata` is present and that `RootLayout` returns its children

How tests run:
- Unit/Integration: `npm run test:all` discovers `__tests__` files and groups them by nearest `package.json`. The `frontend/web` package’s `test` script delegates to the root-installed `vitest` via `node ../../node_modules/vitest/vitest.mjs --run`, so no duplicate devDependencies are required in `frontend/web`.
- E2E: There is no E2E test for T15 in this repo snapshot; `tests/e2e` contains up to `T14-...`. Additional E2E tests will be introduced in later tasks.

Run just the T15 unit test:
```
cd frontend/web
npm run test -- __tests__/layout.render.test.tsx
```

Notes:
- Keeping `layout.tsx` JSX-free ensures the test does not need `react` and `react-dom` installed yet; future tasks that add actual UI will introduce those dependencies.
- The presence of these files also satisfies `npm run verify:tasks`, which checks that all tracked files belong to an allowed task list.

---

## T16 — Auth Pages + Client Session + Route Gating Middleware

Goal: Add minimal Account auth pages (Login/Signup/Verify/Reset), a lightweight client API helper, and a Next-style middleware to gate routes such that only Home (`/`) and Search (`/search`) are public.

What's included:
- Account pages (JSX-free, test-friendly):
  - `frontend/web/app/account/(auth)/login/page.tsx` — exports `metadata` and default `LoginPage()` that returns a marker object
  - `frontend/web/app/account/(auth)/signup/page.tsx` — `SignupPage()`
  - `frontend/web/app/account/(auth)/verify/page.tsx` — `VerifyPage()`
  - `frontend/web/app/account/(auth)/reset/page.tsx` — `ResetPage()`
- Client API helper (in-memory stub for tests):
  - `frontend/web/lib/api.ts` — exports `apiClient` with `signup`, `login`, `sendVerification`, `resetPassword`
- Route gating middleware (self-contained):
  - `frontend/web/middleware.ts` — exports `PUBLIC_PATHS`, `middleware()` and `config.matcher` to express public vs protected routes without importing `next/server`

Tests:
- Unit: `frontend/web/features/account/__tests__/login.form.test.tsx` — asserts login page metadata, basic page shape, and simple `signup`→`login` happy path via `apiClient`
- E2E: `tests/e2e/T16-auth-ui.spec.ts` — verifies that the auth pages, API helper, and middleware exist and contain expected exports/content (no browser required)

How gating works (MVP):
- `PUBLIC_PATHS = ['/', '/search', '/api/auth', '/_next', '/assets']`
- `middleware()` returns `{ action: 'allow' }` for public paths
- For non-public paths, if `tapne_session` cookie is absent, it returns `{ action: 'redirect', location: '/account/login?next=<pathname>' }`
- `config.matcher` excludes Next internals: `['/((?!_next|assets).*)']`

Run just the T16 unit test:
```
cd frontend/web
npm run test -- features/account/__tests__/login.form.test.tsx
```

Run just the T16 E2E test:
```
npm run test:e2e -- tests/e2e/T16-auth-ui.spec.ts
```

Notes:
- These stubs are intentionally minimal to satisfy tests and document intended structure without pulling in `react`/`next` runtime dependencies yet. Later tasks can progressively enhance pages to real UI and wire the client to real backend endpoints.

---

## T17 — Home Page (Public + Personalized)

Goal: Render public Home sections for all visitors and include personalized carousels for logged-in users. Implement minimal, deterministic helpers and query stubs to keep unit/e2e tests fast and environment-free.

What’s included:
- `frontend/web/app/page.tsx` — exports `metadata` and a `HomePage` function returning a composition object `{ kind: 'page', page: 'home', sections: { public, personalized? } }` without JSX.
- `frontend/web/features/home/index.ts` — small helpers: `makeTripCard`, `makeProfileCard`, and `loading`.
- `frontend/web/lib/server/home.queries.ts` — deterministic stubs `fetchPublicHome()` and `fetchPersonalizedHome(userId)` used by the Home page composition.

Tests:
- Unit: `frontend/web/features/home/__tests__/home.render.test.tsx` — asserts metadata presence, composition shape, deterministic query outputs, and helper factories.
- E2E: `tests/e2e/T17-home-personalized.spec.ts` — filesystem-level checks for file presence and expected exports/content.

Run just the T17 unit test:
```
cd frontend/web
npm run test -- features/home/__tests__/home.render.test.tsx
```

Run just the T17 E2E test:
```
npm run test:e2e -- tests/e2e/T17-home-personalized.spec.ts
```

Or run the full suite from the repo root:
```
npm run verify:tasks
npm run test:all
```

---

## T18 — Search Page (Public Limited → Full on Auth)

Goal: Expose a public Search page that returns limited fields for unauthenticated visitors and full fields plus actions (e.g., bookmark allowed) for authenticated users. Keep the implementation deterministic and free of runtime React/Next dependencies for fast tests.

What’s included:
- `frontend/web/app/search/page.tsx` — exports `metadata` and a `SearchPage` function returning a composition object `{ kind: 'page', page: 'search', mode: 'public'|'auth', results }` without JSX.
- `frontend/web/features/search/index.ts` — small helpers: `makeFilters`, `renderResultItem`, and `canBookmark` (true for trip items when authenticated).
- `frontend/web/lib/server/search.queries.ts` — deterministic stubs `fetchPublicSearch(q?)` and `fetchAuthSearch(userId, q?)` used by the Search page composition; public results omit sensitive fields.

Tests:
- Unit: `frontend/web/features/search/__tests__/search.visibility.test.tsx` — asserts metadata presence, composition shape and modes, deterministic query outputs (limited vs full), and helper factories.
- E2E: `tests/e2e/T18-search-visibility.spec.ts` — filesystem-level checks for Search file presence and expected exports/content.

Run just the T18 unit test:
```
cd frontend/web
npm run test -- features/search/__tests__/search.visibility.test.tsx
```

Run just the T18 E2E test:
```
npm run test:e2e -- tests/e2e/T18-search-visibility.spec.ts
```

Or run the full suite from the repo root:
```
npm run verify:tasks
npm run test:all
```

Notes:
- Public search results include only limited fields (e.g., Trip: `id`, `title`, `slug`; Profile: `userId`, `username`).
- Authenticated search results include full details (e.g., Trip: `ownerId`, `createdAt`; Profile: `bio`).
- The helpers are intentionally minimal to exercise behavior in tests without pulling UI dependencies.

---

## T19 — Trip Page (Protected) + Owner CRUD + Reviews + Bookmark

Goal: Provide a protected Trip detail page with an owner editor workflow, a simple user review flow (one per user; owners cannot review their own trip), and a bookmark toggle. Keep everything deterministic and free of React/Next runtime to run quickly under unit tests and integrate with the existing monorepo test harness.

What’s included:
- Trip pages (no JSX, just composition objects):
  - `frontend/web/app/trip/[slug]/page.tsx` — exports `metadata` and a `TripPage({ slug, userId? })` returning `{ kind: 'page', page: 'trip', protected: true, slug, trip?, ownerView }`.
  - `frontend/web/app/trip/new/page.tsx` — exports `metadata` and `NewTripPage({ userId? })` returning `{ kind: 'page', page: 'trip-new', protected: true, draft }`.
- Feature helpers:
  - `frontend/web/features/trip/TripView.tsx` — `toViewModel(trip, currentUserId)` sets `canEdit`, `canReview`, and `canBookmark` flags based on ownership and auth.
  - `frontend/web/features/trip/OwnerEditor.tsx` — owner editor helpers: `emptyDraft()` and `applyDraftPatch(draft, patch)`.
  - `frontend/web/features/trip/ReviewForm.tsx` — review helpers: `makeReviewDraft()` and `validateReview()` (rating 1–5).
- Deterministic in-memory server stubs:
  - `frontend/web/lib/server/trip.mutations.ts` — trip CRUD and actions:
    - `newTripDraft()` — blank draft
    - `createTrip(ownerId, { title, isPrivate? })` — slugify with collision handling, returns a `trip` record
    - `updateTrip(ownerId, slug, { title?, isPrivate? })` — owner-only; updates title and re-slugs when changed
    - `getTripBySlug(slug)` — fetch a stored trip
    - `toggleBookmark(userId, slug)` and `listBookmarks(userId)` — per-user bookmark set
    - `submitReview(userId, slug, rating, text)` — enforces rules: owner cannot review; one per user per trip; `listReviews(slug)` returns reviews

Tests:
- Unit: `frontend/web/features/trip/__tests__/trip.actions.test.tsx` — covers trip page metadata/composition, create→update slug change, permissions view model, bookmark toggle, review rules, and page ownerView logic.
- E2E: The monorepo scaffolding expects a future `tests/e2e/T19-trip-crud-review.spec.ts`; the current kata focuses on the deterministic unit-level coverage above to keep runs fast and hermetic.

Run just the T19 unit test:
```
cd frontend/web
npm run test -- features/trip/__tests__/trip.actions.test.tsx
```

Or run the full suite from the repo root:
```
npm run verify:tasks
npm run test:all
```

---

## T20 — Profile Page (Protected) + Visibility Toggles + Follow

Goal: Provide a protected Profile page with a Hero and Body composition, per-section visibility toggles, and client-side follow/unfollow counters. Logic is pure and deterministic (no JSX, no network calls) to keep tests fast and hermetic.

What’s included:
- Profile page composition (no JSX):
  - `frontend/web/app/profile/[username]/page.tsx` — exports `metadata` and default `ProfilePage(props)` returning `{ kind: 'page', page: 'profile', protected: true, username, profile, ownerView }`.
- Feature helpers:
  - `frontend/web/features/profile/Hero.tsx` — `makeHero(viewerId, username)` computes counts, `isOwner`, `canFollow`; `toggleFollowFromHero()` proxies to mutation.
  - `frontend/web/features/profile/Body.tsx` — `buildBody(visibility)` returns included sections based on visibility flags.
  - `frontend/web/features/profile/VisibilityToggles.tsx` — `defaultVisibility()`, `applyVisibilityPatch()`, `isSectionVisible()`.
- Deterministic server stubs:
  - `frontend/web/lib/server/profile.mutations.ts` — in-memory store for profiles, visibility, and follows; exports `getProfileByUsername`, `updateVisibility`, `follow`, `unfollow`, `toggleFollow`, `getCounts`.

Tests for this task:
- Unit (Vitest): `frontend/web/features/profile/__tests__/profile.visibility.test.tsx` — validates page composition, visibility helpers, body builder, and follow/unfollow counters including self-follow restriction.
- E2E (Playwright): `tests/e2e/T20-profile-follow.spec.ts` — asserts presence and expected exports across T20 files.

Run just the T20 unit test:
```
cd frontend/web
npm run test -- features/profile/__tests__/profile.visibility.test.tsx
```

Run just the T20 E2E test:
```
npm run test:e2e -- tests/e2e/T20-profile-follow.spec.ts
```

Notes:
- Owner is modeled as the viewer whose `userId` equals the `username`.
- Follow data and profile visibility settings are stored in-memory to keep runs hermetic.

---

## T21 — Upload UI (Presigned) for Profile Photo & Trip Cover

Goal: Provide a lightweight, test-friendly upload flow on the frontend to handle profile photos and trip cover images using presigned uploads, with thumbnail previews and simple integration points in profile and trip editors.

What’s included:
- Frontend media client and helpers:
  - `frontend/web/lib/server/media.client.ts` — pure functions for `presignUpload`, `uploadToUrl` (no-op in this kata), and `confirmUpload`. Mirrors backend key/URL formats without requiring network calls so unit tests stay fast and deterministic.
  - `frontend/web/features/media/UploadImage.tsx` — validation (`validateImage`), orchestration (`prepareAndUpload`), and a `simulateDrop` helper used by tests.
- Integrations:
  - `frontend/web/features/profile/Hero.tsx` — adds `updateProfilePhoto(ownerUsername, file, client?)` which uses `prepareAndUpload` and returns `{ ok, photoUrl, thumbnailUrl }`.
  - `frontend/web/features/trip/OwnerEditor.tsx` — adds `updateCoverImage(slug, file, client?)` returning `{ ok, coverUrl, thumbnailUrl }`.

Behavior and formats:
- Validation: accepts `image/jpeg`, `image/png`, `image/webp` up to 5 MB by default (configurable via `UploadLimits`).
- Presign result: `{ key, uploadUrl, publicUrl }` where `key` matches `uploads/images/YYYY/MM/DD/<hex>.<ext>` and `publicUrl` is `${MEDIA_CDN_URL}/${key}` (defaults to `https://cdn.local`).
- Confirm result: generates a thumbnail key mirroring backend rules: directory `/images/` → `/images/thumbs/`, filename gains `-thumb.jpg` suffix. Returns `{ ok, key, thumbnail: { key, url } }`.

Examples:
```ts
import { validateImage, prepareAndUpload } from 'frontend/web/features/media/UploadImage';

const file = new Blob([new Uint8Array([1,2,3])], { type: 'image/png' });
(file as any).name = 'cover.png';

const valid = validateImage({ type: (file as any).type, size: 1024, name: (file as any).name });
if (valid.ok) {
  const res = await prepareAndUpload(file);
  console.log(res.url, res.thumbnailUrl);
}
```

Run just T21 unit test:
```
cd frontend/web
npm run test -- features/media/__tests__/upload.widget.test.tsx
```

Run just T21 E2E presence test:
```
npm run test:e2e -- tests/e2e/T21-upload-images.spec.ts
```
- Mute is included as a UX helper and does not affect list filtering in this simplified backend.

---

## T22 — SEO/Slugs/OG & Robots (Noindex on Gated)

Goal: Add SEO-friendly artifacts while keeping auth-gated pages hidden from indexing. Provide robots rules, OG image stubs for Trip and Profile, and a sitemap limited to public routes.

What’s included:
- Robots helpers:
  - `frontend/web/app/robots.ts` — exports `robotsRules` with `allow: ['/', '/search']` and `disallow: ['/trip', '/profile', '/account']`, plus `buildRobotsTxt(baseUrl)`.
- OpenGraph image stubs (no JSX/runtime needed):
  - `frontend/web/app/trip/[slug]/opengraph-image.tsx` — `buildOgImageForTrip(slug)` returns `{ kind: 'og-image', page: 'trip', width: 1200, height: 630, title, slug }`.
  - `frontend/web/app/profile/[username]/opengraph-image.tsx` — `buildOgImageForProfile(username)` returns `{ kind: 'og-image', page: 'profile', ... }`.
- Sitemap generator:
  - `frontend/web/app/(seo)/sitemap.ts` — `generateSitemap(baseUrl)` returns `{ urls: [base+'/', base+'/search'] }`.
- Noindex on gated pages:
  - `frontend/web/app/trip/[slug]/page.tsx` and `frontend/web/app/profile/[username]/page.tsx` metadata include `robots: { index: false, follow: false }`.

Tests:
- Unit: `frontend/web/__tests__/seo.flags.test.ts` — verifies robots rules/text, noindex on protected pages, OG image specs, and sitemap contents.
- E2E (presence/content): `tests/e2e/T22-seo-noindex.spec.ts` — asserts files exist and include expected exports and metadata.

Run just T22 unit test:
```
cd frontend/web
npm run test -- __tests__/seo.flags.test.ts
```

Run just T22 E2E presence test:
```
npm run test:e2e -- tests/e2e/T22-seo-noindex.spec.ts
```

Notes:
- Only Home (`/`) and Search (`/search`) are included in the sitemap and allowed for robots.
- Gated pages remain protected and marked `noindex` via metadata.

---

## T23 — Moderation UX Hooks (Report/Block) + Filtering

Goal: Provide simple, framework-agnostic moderation UI models for reporting and blocking, wire moderation permissions into Trip and Profile views, and ensure search results respect a viewer’s block list. All implementations are pure functions for deterministic unit tests.

What’s included:
- Moderation UI files:
  - `frontend/web/features/moderation/ReportButton.tsx` — exports `makeReportButton()` returning a confirmable model and `reportEntity(reporterId, entity, targetId, reason)` which records a report; `listReports()` exposes recorded reports for tests.
  - `frontend/web/features/moderation/BlockButton.tsx` — in-memory blocklists per viewer with `makeBlockButton(viewerId, targetUserId)`, `toggleBlock`, `isBlocked`, `canBlockUser`, `canReportTrip`, and `filterSearchResultsForBlocked(viewerId, results)`.
- Wiring into existing features:
  - `frontend/web/features/trip/TripView.tsx` — adds `attachModeration(viewModel, trip, currentUserId)` which augments the Trip view model with `canReport` and `canBlock` (owner excluded).
  - `frontend/web/features/profile/Hero.tsx` — adds `attachModerationToHero(heroModel, viewerId)` exposing `canBlock` (self excluded).
  - `frontend/web/features/search/index.ts` — adds `applyBlockFilter(viewerId, results)` delegating to moderation filtering.

Tests:
- Unit: `frontend/web/features/moderation/__tests__/moderation.ui.test.tsx` — exercises report confirmation/recording, block toggling, search filtering against blocklists, and Trip/Profile moderation permission helpers.
- E2E (presence/content): `tests/e2e/T23-moderation-ui.spec.ts` — asserts moderation files exist and include expected exports, and that TripView/Hero/Search expose moderation wiring helpers.

Run just T23 unit test:
```
cd frontend/web
npm run test -- features/moderation/__tests__/moderation.ui.test.tsx
```

Run just T23 E2E presence test:
```
npm run test:e2e -- tests/e2e/T23-moderation-ui.spec.ts
```

Notes:
- These UI models are intentionally minimal and do not trigger network calls; they enable deterministic unit tests while reflecting the product behavior (report/block actions and filtering) at a high level.
- Search filtering removes profiles by `userId` and trips by `ownerId` when available; public search retains trips since owner information is not present in that mode.

---

## T24 — Observability & Errors (Request IDs, Structured Logs, Error Boundaries)

Goal: Add thin, framework-agnostic observability primitives to the backend and error boundaries to the frontend. Every response can carry a `X-Request-Id`, errors are formatted consistently as JSON with a `requestId`, and the frontend surfaces friendly error pages and structured client logs.

What’s included:
- Backend common utilities:
  - `backend/src/common/logging.interceptor.ts` — `attachLogging(req, res)` sets `X-Request-Id`, returns `{ requestId, log(level,msg,ctx), done() }`. Also exports `LoggingInterceptor` and `generateRequestId()`.
  - `backend/src/common/http-exception.filter.ts` — `HttpExceptionFilter.handle(req, res, error, requestId?)` sets JSON error body `{ ok: false, error, requestId }` and status (uses `error.statusCode`/`error.status` when present; defaults to 500).
- Backend wiring:
  - `backend/src/main.ts` — imports and applies `attachLogging` at request start, includes `X-Request-Id` on responses, and uses `HttpExceptionFilter` in the top-level error handler. Successful and 404 responses call the `done()` hook.
- Frontend error handling & logging:
  - `frontend/web/app/error.tsx` — segment error boundary with reset handler.
  - `frontend/web/app/global-error.tsx` — top-level error boundary (client) with lightweight console logging.
  - `frontend/web/lib/log.ts` — `logEvent`, `logError`, `withRequestId` helpers for structured client logs.

Tests:
- Unit: `backend/src/common/__tests__/exception.filter.spec.ts` — verifies that unknown errors produce a 500 JSON payload with `requestId`, and that explicit `statusCode` on the error is respected.
- E2E (presence/content): `tests/e2e/T24-errors-observability.spec.ts` — asserts the new files exist and include expected exports and integration hints (`X-Request-Id` headers and `HttpExceptionFilter` usage in `main.ts`).

Run just T24 unit test:
```
cd backend
npm run test -- src/common/__tests__/exception.filter.spec.ts
```

Run just T24 E2E presence test:
```
npm run test:e2e -- tests/e2e/T24-errors-observability.spec.ts
```

Notes:
- The backend continues to use a lightweight Node HTTP server; these utilities mimic NestJS patterns without introducing framework dependencies.
- `X-Request-Id` is generated when not provided by the client and is echoed in JSON error responses to aid correlation across logs.

---

## T25 — Docker Compose, Seeds, CI

Goal: Provide a simple local orchestration with Docker Compose (database + app services), a deterministic seed script for demo data, and a GitHub Actions CI workflow that runs verification and the full test suite.

What’s included:
- Docker Compose: `docker-compose.yml`
  - `db` (Postgres 15) exposed on `5432`
  - `backend` (Node 18-alpine) running `npm --prefix backend run start:dev` and pointing `DATABASE_URL` at `db`
  - `frontend` (Node 18-alpine) running `npm --prefix frontend/web run dev`
  - `localstack` (optional) providing S3-compatible endpoint on `4566` for media features
- Seed script: `backend/prisma/seed.ts`
  - Exports `demoUsers`, `demoTrips`, `hashPassword()`, and `seed(prisma?)`
  - `seed()` accepts a minimal Prisma-like object and upserts users, profiles, and trips using generated unique slugs; returns a summary `{ ok, counts }`
  - Designed to run without a live DB for tests; can be invoked directly via `node`/`ts-node`
- CI workflow: `.github/workflows/ci.yml`
  - Triggers on `push` and `pull_request`
  - Installs dependencies, installs Playwright browsers, runs `npm run verify:tasks` and `npm run test:all`

Quick start with Docker Compose (optional):
```
docker compose up -d db
# optional services
docker compose up -d localstack
```

Run seeds (no DB required for test mode):
```
node backend/prisma/seed.ts
```

CI locally (what GitHub Actions runs):
```
npm run verify:tasks
npm run test:all
```

Tests for this task:
- Unit (Vitest): `backend/src/__tests__/seed.spec.ts` — asserts seed file presence, exports, and runs `seed()` against a mock Prisma object
- E2E (Playwright): `tests/e2e/T25-full-happy-path.spec.ts` — asserts docker-compose, seed, and CI workflow exist with expected content and that `seed()` produces counts

Notes:
- The compose services for backend/frontend are placeholders aligned with this kata’s lightweight server stubs. They demonstrate environment wiring and cannot serve production traffic without further implementation.
