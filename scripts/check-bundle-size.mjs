#!/usr/bin/env node
// Bundle-size budget guard.
//
// Measures two stable, version-independent signals from the production build:
//   1. sharedFirstLoadJs — gzipped size of the chunks every App Router route loads
//      (build-manifest rootMainFiles + polyfills). Regressions here hit every page.
//   2. totalClientJs — gzipped size of all client chunks. Catches overall bloat and
//      guards the code-splitting wins (lazy-loaded modals) from quietly creeping back.
//
// Compares against committed baselines in bundle-budget.json with a tolerance.
// Exits non-zero when a metric exceeds baseline * (1 + tolerancePct), so CI fails.
// Run with `--update` to rewrite the baselines from the current build (review the diff).
//
// Prereq: a production build must already exist in .next/ (run `next build` first).

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const budgetPath = path.join(root, 'bundle-budget.json');
const buildManifestPath = path.join(root, '.next', 'build-manifest.json');
const chunksDir = path.join(root, '.next', 'static', 'chunks');

const UPDATE = process.argv.includes('--update');

function fail(msg) {
  console.error(`\n✗ ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(buildManifestPath)) {
  fail('No .next/build-manifest.json found. Run `next build` before checking the bundle budget.');
}

// Paths come from our own build manifest, not from user input, and cannot be
// literals — Next content-hashes the filenames at build time.
const gzipBytes = (relFromDotNext) =>
  zlib.gzipSync(fs.readFileSync(path.join(root, '.next', relFromDotNext))).length;

const manifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
const sharedFiles = [...(manifest.rootMainFiles ?? []), ...(manifest.polyfillFiles ?? [])];
if (sharedFiles.length === 0) {
  fail('build-manifest.json has no rootMainFiles/polyfillFiles — unexpected build output.');
}
const sharedFirstLoadJs = sharedFiles.reduce((sum, f) => sum + gzipBytes(f), 0);

const allChunks = fs
  .readdirSync(chunksDir, { recursive: true })
  .filter((f) => typeof f === 'string' && f.endsWith('.js'))
  .map((f) => path.join('static', 'chunks', f));
const totalClientJs = allChunks.reduce((sum, f) => sum + gzipBytes(f), 0);

const measured = { sharedFirstLoadJs, totalClientJs };
const kb = (b) => `${(b / 1024).toFixed(1)} KB`;

const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));

if (UPDATE) {
  for (const key of Object.keys(budget.baselines)) {
    budget.baselines[key].bytes = measured[key];
  }
  fs.writeFileSync(budgetPath, JSON.stringify(budget, null, 2) + '\n');
  console.log('Updated bundle-budget.json baselines:');
  for (const key of Object.keys(measured)) console.log(`  ${key}: ${kb(measured[key])}`);
  console.log('\nReview and commit the diff so the new sizes are an explicit decision.');
  process.exit(0);
}

const tolerance = (budget.tolerancePct ?? 0) / 100;
let failed = false;

console.log(`\nBundle budget (tolerance ${budget.tolerancePct ?? 0}%)\n`);
for (const [key, { label, bytes: baseline }] of Object.entries(budget.baselines)) {
  const actual = measured[key];
  const limit = Math.round(baseline * (1 + tolerance));
  const deltaPct = (((actual - baseline) / baseline) * 100).toFixed(1);
  const sign = actual >= baseline ? '+' : '';
  const over = actual > limit;
  if (over) failed = true;
  console.log(
    `${over ? '✗' : '✓'} ${label}\n` +
      `    baseline ${kb(baseline)} · limit ${kb(limit)} · actual ${kb(actual)} (${sign}${deltaPct}%)`
  );
}

if (failed) {
  fail(
    'Bundle size exceeded budget.\n' +
      '  If this growth is intentional, run `npm run bundle:update` and commit the new baseline.'
  );
}
console.log('\n✓ Within budget.');
