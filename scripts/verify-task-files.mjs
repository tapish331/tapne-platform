#!/usr/bin/env node
/**
 * scripts/verify-task-files.mjs
 *
 * Fails CI/local if any *git-tracked* file is not covered by the task file list.
 * No deps required. Patterns support **, *, ? globs.
 *
 * Usage:
 *   node scripts/verify-task-files.mjs
 */

import { execSync } from "node:child_process";
import path from "node:path";

// --- Allowed files/patterns derived from tasks T01–T25 ---
const ALLOWED = [
  // Root tooling & docs (T01, T25)
  "package.json",
  ".editorconfig",
  ".gitignore",
  ".gitattributes",
  "tsconfig.base.json",
  ".prettierrc",
  ".eslintrc.cjs",
  "tests/e2e/playwright.config.ts",
  "tests/e2e/fixtures/env.ts",
  // Local harness scripts and docs
  "scripts/run-all-tests.mjs",
  "scripts/verify-task-files.mjs",
  "end_to_end_specifications.txt",
  "strictly_sequential_task_list.txt",
  "codex_prompt_template.txt",
  "codex_prompt_template.txt.bak",
  ".github/workflows/ci.yml",
  "docker-compose.yml",
  // Local temporary artifacts used during kata/exercise runs
  "temp_*.txt",
  "temp_*.mjs",
  "temp_*.json",

  // (Optional but commonly tracked; include if present)
  "README.md",
  "LICENSE",

  // Lockfiles (if tracked in root or packages)
  "**/package-lock.json",
  "package-lock.json",
  "**/pnpm-lock.yaml",
  "**/yarn.lock",

  // Backend bootstrap & health (T02)
  "backend/package.json",
  "backend/src/main.ts",
  "backend/src/app.module.ts",
  "backend/src/health/health.controller.ts",

  // DB & Prisma (T03, T25)
  "backend/.env",
  "backend/prisma/schema.prisma",
  "backend/prisma/migrations/**",
  "backend/prisma/seed.ts",
  "backend/src/prisma/prisma.module.ts",
  "backend/src/prisma/prisma.service.ts",

  // Auth core (T04)
  "backend/domains/auth/auth.module.ts",
  "backend/domains/auth/auth.controller.ts",
  "backend/domains/auth/auth.service.ts",
  "backend/domains/auth/dto/**",
  "backend/domains/auth/strategies/jwt.strategy.ts",
  "backend/domains/auth/guards/jwt.guard.ts",
  "backend/src/config/cookies.ts",

  // Email verify & reset (T05)
  "backend/domains/auth/email/email.service.ts",
  "backend/domains/auth/email/templates/verify.html",
  "backend/domains/auth/email/templates/reset.html",
  "backend/domains/auth/controllers/email.controller.ts",

  // Security (T06)
  "backend/src/security/rate-limit.guard.ts",
  "backend/src/security/captcha.service.ts",

  // Media (T07)
  "backend/src/media/media.module.ts",
  "backend/src/media/media.service.ts",
  "backend/src/media/media.controller.ts",
  "backend/src/media/image.processor.ts",

  // Profile (T08)
  "backend/domains/profile/profile.module.ts",
  "backend/domains/profile/profile.service.ts",
  "backend/domains/profile/profile.controller.ts",
  "backend/domains/profile/dto/**",
  "shared/types/profile.ts",

  // Trips (T09)
  "backend/domains/trip/trip.module.ts",
  "backend/domains/trip/trip.service.ts",
  "backend/domains/trip/trip.controller.ts",
  "backend/domains/trip/dto/**",
  "shared/types/trip.ts",
  "backend/src/utils/slug.ts",

  // Reviews (T10)
  "backend/domains/review/review.module.ts",
  "backend/domains/review/review.service.ts",
  "backend/domains/review/review.controller.ts",
  "backend/domains/review/dto/**",

  // Social follow (T11)
  "backend/domains/social/follow.controller.ts",
  "backend/domains/social/follow.service.ts",
  "backend/domains/social/follow.module.ts",
  "shared/types/social.ts",

  // Bookmarks & participation (T12)
  "backend/domains/trip/bookmark.controller.ts",
  "backend/domains/trip/bookmark.service.ts",
  "backend/domains/trip/participation.controller.ts",
  "backend/domains/trip/participation.service.ts",

  // Moderation (T13)
  "backend/domains/moderation/moderation.module.ts",
  "backend/domains/moderation/moderation.service.ts",
  "backend/domains/moderation/moderation.controller.ts",

  // Search (T14)
  "backend/domains/search/search.controller.ts",
  "backend/domains/search/search.service.ts",
  "shared/types/search.ts",

  // Backend common (T24)
  "backend/src/common/logging.interceptor.ts",
  "backend/src/common/http-exception.filter.ts",

  // Frontend bootstrap (T15)
  "frontend/web/package.json",
  "frontend/web/next.config.mjs",
  "frontend/web/tailwind.config.ts",
  "frontend/web/postcss.config.js",
  "frontend/web/postcss.config.cjs",
  "frontend/web/styles/globals.css",
  "frontend/web/app/layout.tsx",
  "frontend/web/app/page.tsx",

  // Frontend auth & gating (T16)
  "frontend/web/app/account/(auth)/login/page.tsx",
  "frontend/web/app/account/(auth)/signup/page.tsx",
  "frontend/web/app/account/(auth)/verify/page.tsx",
  "frontend/web/app/account/(auth)/reset/page.tsx",
  "frontend/web/lib/api.ts",
  "frontend/web/middleware.ts",

  // Home (T17)
  "frontend/web/features/home/**",
  "frontend/web/lib/server/home.queries.ts",

  // Search (T18)
  "frontend/web/app/search/page.tsx",
  "frontend/web/features/search/**",
  "frontend/web/lib/server/search.queries.ts",

  // Trip (T19)
  "frontend/web/app/trip/[slug]/page.tsx",
  "frontend/web/app/trip/new/page.tsx",
  "frontend/web/features/trip/TripView.tsx",
  "frontend/web/features/trip/ReviewForm.tsx",
  "frontend/web/features/trip/OwnerEditor.tsx",
  "frontend/web/lib/server/trip.mutations.ts",

  // Profile (T20)
  "frontend/web/app/profile/[username]/page.tsx",
  "frontend/web/features/profile/Hero.tsx",
  "frontend/web/features/profile/Body.tsx",
  "frontend/web/features/profile/VisibilityToggles.tsx",
  "frontend/web/lib/server/profile.mutations.ts",

  // Upload UI (T21)
  "frontend/web/features/media/UploadImage.tsx",
  "frontend/web/lib/server/media.client.ts",

  // SEO & robots (T22)
  "frontend/web/app/robots.ts",
  "frontend/web/app/trip/[slug]/opengraph-image.tsx",
  "frontend/web/app/profile/[username]/opengraph-image.tsx",
  "frontend/web/app/(seo)/sitemap.ts",

  // Moderation UI (T23)
  "frontend/web/features/moderation/ReportButton.tsx",
  "frontend/web/features/moderation/BlockButton.tsx",

  // Frontend errors & logs (T24)
  "frontend/web/app/error.tsx",
  "frontend/web/app/global-error.tsx",
  "frontend/web/lib/log.ts",

  // --- Unit/Integration tests named per task ---
  "backend/src/__tests__/repo.smoke.spec.ts",
  "backend/src/health/__tests__/health.controller.spec.ts",
  "backend/src/prisma/__tests__/prisma.service.spec.ts",
  "backend/domains/auth/__tests__/auth.service.spec.ts",
  "backend/domains/auth/__tests__/email-flows.spec.ts",
  "backend/src/security/__tests__/rate-limit.spec.ts",
  "backend/src/media/__tests__/media.service.spec.ts",
  "backend/domains/profile/__tests__/profile.rules.spec.ts",
  "backend/domains/trip/__tests__/trip.crud.spec.ts",
  "backend/domains/review/__tests__/review.rules.spec.ts",
  "backend/domains/social/__tests__/follow.spec.ts",
  "backend/domains/trip/__tests__/bookmark-participation.spec.ts",
  "backend/domains/moderation/__tests__/moderation.spec.ts",
  "backend/domains/search/__tests__/search.visibility.spec.ts",
  "backend/src/common/__tests__/exception.filter.spec.ts",
  "backend/src/__tests__/seed.spec.ts",

  "frontend/web/__tests__/layout.render.test.tsx",
  "frontend/web/features/account/__tests__/login.form.test.tsx",
  "frontend/web/features/home/__tests__/home.render.test.tsx",
  "frontend/web/features/search/__tests__/search.visibility.test.tsx",
  "frontend/web/features/trip/__tests__/trip.actions.test.tsx",
  "frontend/web/features/profile/__tests__/profile.visibility.test.tsx",
  "frontend/web/features/media/__tests__/upload.widget.test.tsx",
  "frontend/web/__tests__/seo.flags.test.ts",
  "frontend/web/features/moderation/__tests__/moderation.ui.test.tsx",

  // --- E2E tests per task ---
  "tests/e2e/T01-bootstrap.spec.ts",
  "tests/e2e/T02-health.spec.ts",
  "tests/e2e/T03-db-migration.spec.ts",
  "tests/e2e/T04-auth-basic.spec.ts",
  "tests/e2e/T05-auth-email.spec.ts",
  "tests/e2e/T06-security.spec.ts",
  "tests/e2e/T07-media-upload.spec.ts",
  "tests/e2e/T08-profile-crud.spec.ts",
  "tests/e2e/T09-trip-crud.spec.ts",
  "tests/e2e/T10-review-flow.spec.ts",
  "tests/e2e/T11-follow.spec.ts",
  "tests/e2e/T12-bookmark-participation.spec.ts",
  "tests/e2e/T13-moderation.spec.ts",
  "tests/e2e/T14-search-public-auth.spec.ts",
  "tests/e2e/T15-frontend-bootstrap.spec.ts",
  "tests/e2e/T16-auth-ui.spec.ts",
  "tests/e2e/T17-home-personalized.spec.ts",
  "tests/e2e/T18-search-visibility.spec.ts",
  "tests/e2e/T19-trip-crud-review.spec.ts",
  "tests/e2e/T20-profile-follow.spec.ts",
  "tests/e2e/T21-upload-images.spec.ts",
  "tests/e2e/T22-seo-noindex.spec.ts",
  "tests/e2e/T23-moderation-ui.spec.ts",
  "tests/e2e/T24-errors-observability.spec.ts",
  "tests/e2e/T25-full-happy-path.spec.ts",
];

// --- glob -> RegExp (supports **, *, ?) ---
function globToRegExp(glob) {
  // Normalize separators within the pattern
  const pat = glob.replace(/\\/g, "/");
  let re = "^";
  for (let i = 0; i < pat.length; i++) {
    const c = pat[i];
    const n = pat[i + 1];

    if (c === "*") {
      if (n === "*") {
        // ** => match anything (including /)
        re += ".*";
        i++; // skip next *
      } else {
        // * => match up to a slash
        re += "[^/]*";
      }
      continue;
    }
    if (c === "?") {
      re += "[^/]";
      continue;
    }
    // Escape regex specials
    if ("\\.[]{}()+-^$|".includes(c)) {
      re += "\\" + c;
    } else {
      re += c;
    }
  }
  re += "$";
  return new RegExp(re);
}

function main() {
  // Get git-tracked files (respects .gitignore)
  const raw = execSync("git ls-files", { encoding: "utf8" });
  const files = raw
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean)
    // Normalize paths to POSIX for matching
    .map((f) => f.replace(/\\/g, "/"));

  const regexes = ALLOWED.map(globToRegExp);

  const unmatched = [];
  const matchedBy = new Map();

  for (const f of files) {
    let ok = false;
    for (let i = 0; i < regexes.length; i++) {
      if (regexes[i].test(f)) {
        ok = true;
        matchedBy.set(f, ALLOWED[i]);
        break;
      }
    }
    if (!ok) unmatched.push(f);
  }

  if (unmatched.length) {
    console.error("❌ Found file(s) not covered by any task file entry:\n");
    for (const f of unmatched) console.error(" - " + f);
    console.error(
      "\nEither add them to a task or update ALLOWED in scripts/verify-task-files.mjs."
    );
    process.exit(1);
  } else {
    console.log("✅ All tracked files are accounted for by task entries.");
    process.exit(0);
  }
}

try {
  main();
} catch (err) {
  console.error("💥 Verification failed to run:", err?.message || err);
  process.exit(2);
}
