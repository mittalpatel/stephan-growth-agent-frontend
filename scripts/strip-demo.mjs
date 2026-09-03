#!/usr/bin/env node
/**
 * Permanently remove the `widgets` demo module.
 *
 * Run by `npm run strip-demo`. The mirror of the backend's `make strip-demo` —
 * run both, or the frontend keeps calling an API that no longer exists.
 *
 * Deliberately a script rather than a documented `rm -rf`: roughly half the work
 * is *editing* surviving files (the nav, the route permissions, the proxy
 * allowlist, the locale index, the breadcrumb resolver), and a checklist in a
 * README is a checklist someone does three quarters of.
 *
 * Every edit is an exact-match removal that **fails loudly** when the text is
 * not found. A silent no-op is the failure mode worth preventing: it leaves a
 * dangling reference that surfaces later as a build error in a file nobody
 * connects to the strip.
 *
 * Irreversible by design, but it only touches tracked files — `git checkout .`
 * undoes it if you run it by accident before committing.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Removed wholesale. */
const PATHS = [
  'src/app/(restricted)/widgets',
  'src/services/widgets.ts',
  'src/services/__tests__/widgets.test.ts',
  'src/types/widget.ts',
  'src/lib/schemas/widget.ts',
  'src/locales/en/widgets.ts',
  'e2e/authenticated/widgets.spec.ts',
  'context/app/(restricted)/widgets',
  'docs/topics/99-demo-module.md',
];

/** file → exact substrings to delete. */
const EDITS = {
  'src/locales/en/index.ts': [
    "import { widgets } from './widgets';\n",
    '  // Demo module — removed by `npm run strip-demo`.\n  widgets,\n',
  ],
  'src/locales/en/common.ts': [
    "  // Demo module — removed by `npm run strip-demo`.\n  widgets: 'Widgets',\n",
  ],
  'src/constants/navItems.ts': [
    "  // Demo module — removed by `npm run strip-demo`.\n  '/widgets',\n",
    `  // Demo module — removed by \`npm run strip-demo\`.
  {
    section: t.navigation.sections.main,
    label: t.navigation.widgets,
    href: '/widgets',
    icon: Boxes,
    requiredFunction: 'widget',
  },

`,
  ],
  'src/constants/roles.ts': [
    "  // Demo module — removed by `npm run strip-demo`.\n  { prefix: '/widgets', resources: ['widget'] },\n",
  ],
  'src/proxy.ts': [
    "  // Demo module — removed by `npm run strip-demo`.\n  '/widgets',\n",
    "    // Demo module — removed by `npm run strip-demo`.\n    '/widgets',\n    '/widgets/:path*',\n",
  ],
  // Docs and rule files cite the demo as their worked example. Once it is gone the
  // citations are broken paths, and `check-doc-paths.mjs` rightly fails on them —
  // which is how this gap was found in the first place.
  'docs/checklists/new-feature.md': [
    ' Copy `src/app/(restricted)/widgets/` as the starting point.',
  ],
  'docs/topics/02-api-contract.md': ['\n\nReference: `src/services/widgets.ts`.'],
  'context/api.md': [
    '\n## Reference implementation\n\n`src/services/widgets.ts` plus `src/app/(restricted)/widgets/hooks/useWidgetsList.ts`.\n',
  ],
  'src/components/common/RestrictedBreadcrumb.tsx': [
    "import { widgetDetailEndpoint, widgetDetailKey } from '@/services/widgets';\n",
    '  widgets: t.navigation.widgets,\n',
    // `unwrap` has no caller once the only resolver is gone. Removing the
    // resolver but keeping its helper leaves an unused export that fails lint —
    // the shape to write is documented in the RESOLVERS comment instead.
    `// The detail hooks cache the raw API response, which is the standard envelope
// (\`{ success, data, meta, ... }\`), while direct-URL fetches here return the same.
// Unwrap one level so a resolver's \`getLabel\` reads the record fields whether the
// cached value is the envelope or an already-unwrapped object.
function unwrap<T>(data: unknown): T | undefined {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: T }).data;
  }
  return data as T | undefined;
}

`,
    `  // Demo module — removed by \`npm run strip-demo\`.
  widgets: {
    endpoint: widgetDetailEndpoint,
    // Imported, not hand-written. The detail hook builds its key from the same
    // function, so the two cannot drift. A mismatch here is invisible — the
    // breadcrumb just misses the cache and refetches a record the page already
    // has, which nobody notices until someone profiles the network tab.
    queryKey: widgetDetailKey,
    getLabel: (data) => unwrap<{ name?: string }>(data)?.name,
  },
`,
  ],
};

/**
 * file → [exact substring, replacement]. For edits that rewrite rather than delete.
 *
 * Applied after the deletions above, so a replacement must not target text that a
 * deletion already removed — an earlier version of this script deleted the whole
 * lucide import and then tried to rewrite it, which left `Settings` unimported
 * and the tree broken.
 */
const REPLACEMENTS = {
  // `Boxes` was the demo nav entry's icon; `Settings` still has a user.
  'src/constants/navItems.ts': [
    ["import { Boxes, Settings } from 'lucide-react';", "import { Settings } from 'lucide-react';"],
  ],
  // Reword rather than delete: the rule still stands, only its example is gone.
  'docs/topics/06-forms.md': [
    [
      '`src/lib/schemas/widget.ts`, `src/app/(public)/components/LoginForm.tsx`.',
      '`src/app/(public)/components/LoginForm.tsx`.',
    ],
  ],
  '.claude/skills/component-architecture/SKILL.md': [
    [
      '`src/app/(restricted)/widgets/hooks/useWidgetsList.ts` — and only moves to `src/hooks/`',
      'colocated under its own route — and only moves to `src/hooks/`',
    ],
  ],
  'AGENTS.md': [
    ['  `src/lib/schemas/widget.ts`.', '  the backend serializer.'],
    [
      '`src/app/(restricted)/widgets/hooks/useWidgetsList.ts`, which returns a flat props bag,',
      'a list hook that returns a flat props bag,',
    ],
  ],
  'README.md': [
    [
      '`src/app/(restricted)/widgets/` is a complete list-and-detail feature. Read it first —',
      'The demo module was a complete list-and-detail feature. It has been removed —',
    ],
  ],
};

const edited = [];
let failures = 0;
const fail = (message) => {
  failures += 1;
  console.error(`  FAIL  ${message}`);
};

function removePaths() {
  for (const relative of PATHS) {
    const target = path.join(ROOT, relative);
    if (!existsSync(target)) {
      // Not an error: the path may legitimately not exist yet (docs and context
      // are optional), and re-running the script must stay safe.
      console.log(`  skip  ${relative} (absent)`);
      continue;
    }
    rmSync(target, { recursive: true, force: true });
    console.log(`  rm    ${relative}`);
  }
}

function applyEdits() {
  // The union of both maps: a file may need only a rewrite and no deletion, and an
  // earlier version of this loop iterated EDITS alone — so those files were silently
  // skipped and their stale references survived the strip.
  const targets = new Set([...Object.keys(EDITS), ...Object.keys(REPLACEMENTS)]);

  for (const relative of targets) {
    const fragments = EDITS[relative] ?? [];
    const target = path.join(ROOT, relative);
    if (!existsSync(target)) {
      fail(`${relative} is missing — cannot edit it`);
      continue;
    }

    let contents = readFileSync(target, 'utf8');
    for (const fragment of fragments) {
      if (!contents.includes(fragment)) {
        fail(
          `${relative}: expected fragment not found — ${JSON.stringify(fragment.slice(0, 60))}…`
        );
        continue;
      }
      contents = contents.replace(fragment, '');
    }

    for (const [from, to] of REPLACEMENTS[relative] ?? []) {
      if (!contents.includes(from)) {
        fail(
          `${relative}: expected text to rewrite not found — ${JSON.stringify(from.slice(0, 60))}…`
        );
        continue;
      }
      contents = contents.replace(from, to);
    }

    writeFileSync(target, contents);
    edited.push(relative);
    console.log(`  edit  ${relative}`);
  }
}

/**
 * Format what we edited.
 *
 * Removing a fragment reliably leaves a doubled blank line or a dangling comma, and
 * `npm run validate` runs `prettier --check` — so without this the very first command
 * the script tells you to run fails on whitespace it caused itself.
 */
function formatEdited() {
  if (!edited.length) return;
  try {
    execFileSync('npx', ['prettier', '--write', '--log-level', 'warn', ...edited], {
      cwd: ROOT,
      stdio: 'inherit',
    });
    console.log(`  fmt   ${edited.length} file(s)`);
  } catch {
    // Not fatal: the strip itself succeeded, and `npm run format` fixes it.
    console.warn('  warn  prettier failed — run `npm run format` before validating.');
  }
}

console.log('\nStripping the widgets demo module\n' + '-'.repeat(60));
removePaths();
applyEdits();
formatEdited();

// Next generates route types under .next/types that still import the deleted
// pages. Leaving them makes the very next `tsc --noEmit` fail on files the user
// did not write, which reads as the strip having broken something.
const nextDir = path.join(ROOT, '.next');
if (existsSync(nextDir)) {
  rmSync(nextDir, { recursive: true, force: true });
  console.log('  rm    .next (stale route types reference the removed pages)');
}
console.log('-'.repeat(60));

if (failures) {
  console.error(
    `\n${failures} problem(s). The tree is now partially stripped — ` +
      'run `git checkout .` and fix the script before retrying.\n'
  );
  process.exit(failures);
}

console.log('\nDone. Run `npm run validate` to confirm nothing dangles.');
console.log('Remember to run `make strip-demo` in the backend too.\n');
