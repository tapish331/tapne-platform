#!/usr/bin/env node
/**
 * scripts/run-all-tests.mjs
 *
 * Runs ALL tests located in any `tests` or `__tests__` folders:
 *  - Unit/Integration: grouped by nearest package.json (e.g., backend, frontend/web)
 *  - E2E: Playwright suite under tests/e2e (run once)
 *
 * Assumptions:
 *  - Each package (e.g., backend, frontend/web) has a "test" npm script.
 *  - E2E uses Playwright with config at tests/e2e/playwright.config.ts.
 */

import { execSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import url from "node:url";

process.env.CI = process.env.CI || "true";

const repoRoot = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(repoRoot, "..");

const TEST_FILE_RE = /\.(test|spec)\.(ts|tsx|js|jsx|mjs|cjs)$/i;
const IS_TEST_DIR = (p) => /(^|\/)(tests|__tests__)(\/|$)/.test(p);

// Utilities
const run = (cmd, opts = {}) => {
  const res = spawnSync(cmd[0], cmd.slice(1), {
    stdio: "inherit",
    cwd: opts.cwd || ROOT,
    env: { ...process.env, ...opts.env },
    shell: process.platform === "win32",
  });
  return res.status ?? 1;
};

const gitTrackedFiles = () =>
  execSync("git ls-files", { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((f) => f.replace(/\\/g, "/"));

const findNearestPkg = (filePath) => {
  let cur = path.dirname(path.resolve(ROOT, filePath));
  const rootVol = path.parse(ROOT).root;
  while (true) {
    const pkg = path.join(cur, "package.json");
    if (existsSync(pkg)) return cur;
    if (cur === ROOT || cur === rootVol) break;
    const next = path.dirname(cur);
    if (next === cur) break;
    cur = next;
  }
  return null;
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// 1) Discover all test files under `tests` or `__tests__`
const files = gitTrackedFiles();
const allTestFiles = files.filter(
  (f) => IS_TEST_DIR(f) && TEST_FILE_RE.test(f)
);

// Separate out E2E tests (anything under tests/e2e)
const e2eTests = allTestFiles.filter((f) => /(^|\/)tests\/e2e(\/|$)/.test(f));
const nonE2eTests = allTestFiles.filter((f) => !e2eTests.includes(f));

// 2) Group non-e2e test files by nearest package.json directory
const groups = new Map(); // pkgDir -> [files]
for (const f of nonE2eTests) {
  const pkgDir = findNearestPkg(f);
  if (!pkgDir) continue; // Skip anything without a package.json
  const key = pkgDir.replace(/\\/g, "/");
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(path.relative(key, path.resolve(ROOT, f)));
}

// 3) Run unit/integration tests per package (chunked to avoid arg limits)
let exitCode = 0;

for (const [pkgDir, testList] of groups.entries()) {
  const pkgJson = JSON.parse(
    readFileSync(path.join(pkgDir, "package.json"), "utf8")
  );
  if (!pkgJson.scripts || !pkgJson.scripts.test) {
    console.warn(
      `⚠️  Skipping ${pkgDir} — no "test" script in package.json (found ${testList.length} tests).`
    );
    continue;
  }
  console.log(`\n▶︎ Running ${testList.length} tests in ${pkgDir} ...`);
  const chunks = chunk(testList, 80); // pass files in manageable batches
  for (const c of chunks) {
    const status = run(["npm", "run", "test", "--", ...c], { cwd: pkgDir });
    if (status !== 0) exitCode = status;
  }
}

// 4) Run E2E tests once via Playwright if present
const pwConfig = path.join(ROOT, "tests/e2e/playwright.config.ts");
if (e2eTests.length && existsSync(pwConfig)) {
  // Verify playwright is resolvable
  try {
    // Prefer local bin
    execSync("npx --no playwright --version", { cwd: ROOT, stdio: "ignore" });
  } catch {
    console.error(
      "❌ Playwright not found. Add it as a devDependency and ensure tests/e2e/playwright.config.ts exists."
    );
    process.exit(1);
  }
  console.log(`\n▶︎ Running E2E tests with Playwright (${e2eTests.length} files) ...`);
  const status = run(["npx", "--no", "playwright", "test", "-c", pwConfig], {
    cwd: ROOT,
  });
  if (status !== 0) exitCode = status;
} else {
  console.log("\nℹ️  No E2E test run (no files under tests/e2e or missing config).");
}

// 5) Final status
if (exitCode === 0) {
  console.log("\n✅ All tests passed.");
} else {
  console.error(`\n❌ Test run failed with exit code ${exitCode}.`);
}
process.exit(exitCode);
