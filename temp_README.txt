# Tapne Platform

This repository hosts the Tapne monorepo. Tasks are implemented sequentially per `strictly_sequential_task_list.txt` with accompanying unit/integration and E2E tests.

This README documents Task T01–T05 completion and how to run verification and tests.

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

