#!/usr/bin/env node
/**
 * Fail when a doc, skill, or rule file cites a repository path that does not exist.
 *
 * This is the check that keeps the documentation trustworthy. Both source
 * applications accumulated docs indexing roughly a dozen files that had been
 * renamed or deleted, and `TODO Phase 7` comments claiming pages did not exist
 * when they did. The cost is not the stale line itself — it is that a reader,
 * human or otherwise, learns the paths here are approximate and starts inventing
 * them.
 *
 * ## What counts as a path
 *
 * A backticked token rooted at one of this repo's own top-level directories —
 * see REPO_ROOTS. That anchoring is what keeps the check precise; the reasoning
 * is with the constant.
 *
 * A trailing `::symbol` is stripped, so a reference like
 * `src/lib/i18n.ts::plural` checks the file and not the symbol. Fenced code
 * blocks are skipped: the paths in them are illustrative, not claims.
 *
 * ## Deliberately conservative
 *
 * False negatives are fine. A false positive nobody can silence gets the whole
 * check disabled, which is worse than not having it at all.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Files whose backticked paths are checked. */
const SCAN_DIRS = ['docs', '.claude', 'context'];
const SCAN_FILES = ['AGENTS.md', 'CLAUDE.md', 'README.md'];

/**
 * Only tokens rooted at one of this repo's own top-level directories are checked.
 *
 * This is the whole precision story. Anchoring on a known root excludes, without
 * needing a denylist: npm specifiers (`@hookform/resolvers/zod`, `next/image`),
 * Semgrep rulesets (`p/react`), API routes (`me/permissions`), bare basenames
 * (`globals.css`), and paths that belong to the *other* repo — which the docs
 * cite deliberately when describing the cross-repo contract, and which are
 * correct references this checker cannot verify.
 *
 * A doc citing `src/services/widgets.ts` after that file moves is the failure this
 * exists to catch, and an anchored path is exactly the shape that claim takes.
 */
const REPO_ROOTS = [
  'src/',
  'e2e/',
  'docs/',
  'scripts/',
  'context/',
  'contracts/',
  'public/',
  '.claude/',
  '.github/',
  '.husky/',
];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.md')) out.push(full);
  }
  return out;
}

function collectFiles() {
  const files = [];
  for (const dir of SCAN_DIRS) {
    const full = path.join(ROOT, dir);
    if (existsSync(full)) files.push(...walk(full));
  }
  for (const file of SCAN_FILES) {
    const full = path.join(ROOT, file);
    if (existsSync(full)) files.push(full);
  }
  return files;
}

function looksLikePath(token) {
  if (!token || token.length > 200) return false;
  if (token.includes(' ') || token.includes('|')) return false;
  // A glob or a `<placeholder>` is a pattern, not a claim about a specific file.
  if (token.includes('*') || token.includes('<') || token.includes('>')) return false;
  return REPO_ROOTS.some((root) => token.startsWith(root));
}

/** Resolve, tolerating a directory reference and a `::symbol` suffix. */
function resolves(token) {
  const cleaned = token.replace(/::.*$/, '').replace(/\/$/, '');
  return existsSync(path.join(ROOT, cleaned));
}

const failures = [];

for (const file of collectFiles()) {
  const relative = path.relative(ROOT, file);
  const lines = readFileSync(file, 'utf8').split('\n');

  let inFence = false;
  lines.forEach((line, index) => {
    // Skip fenced code blocks: they contain illustrative trees and shell
    // snippets whose paths are examples, not claims about this repo.
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    for (const match of line.matchAll(/`([^`\n]+)`/g)) {
      const token = match[1].trim();
      if (!looksLikePath(token)) continue;
      if (resolves(token)) continue;
      failures.push({ file: relative, line: index + 1, token });
    }
  });
}

if (failures.length) {
  console.error('\nDocumentation references paths that do not exist:\n');
  for (const { file, line, token } of failures) {
    console.error(`  ${file}:${line}  →  ${token}`);
  }
  console.error(`\n${failures.length} broken reference(s). Fix the path, or remove the claim.\n`);
  process.exit(1);
}

console.log('All documented paths resolve.');
