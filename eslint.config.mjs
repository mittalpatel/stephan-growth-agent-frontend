import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';
import security from 'eslint-plugin-security';

/**
 * Attributes whose value a user reads.
 *
 * Restricting JSX *text* alone is the common half-measure: it catches
 * `<p>Save</p>` and misses `placeholder="Search"`, `aria-label="Close"`, and
 * `alt="Company logo"` — which is how a codebase ends up with the visible copy
 * translated and the accessible copy stuck in English.
 */
const USER_FACING_ATTRIBUTES = ['placeholder', 'title', 'alt', 'aria-label', 'aria-placeholder'];

const hardcodedTextRules = [
  {
    selector: 'JSXText[value=/[a-zA-Z]{3,}/]',
    message: 'Hardcoded UI text — use t.* from @/locales instead.',
  },
  ...USER_FACING_ATTRIBUTES.map((attribute) => ({
    selector: `JSXAttribute[name.name='${attribute}'] > Literal[value=/[a-zA-Z]{3,}/]`,
    message: `Hardcoded "${attribute}" — use t.* from @/locales instead.`,
  })),
  {
    // toast.success('Saved') and friends. The message a toast shows is as
    // user-facing as anything rendered in JSX.
    selector:
      "CallExpression[callee.object.name='toast'] > Literal:first-child[value=/[a-zA-Z]{3,}/]",
    message: 'Hardcoded toast message — use t.* from @/locales instead.',
  },
  {
    // Em-dashes and their lookalikes read as machine-written. This is the rule
    // from AGENTS.md, enforced rather than asked for politely.
    selector: 'JSXText[value=/[—–]/]',
    message: 'No em/en-dash in user-facing text — rewrite the sentence.',
  },
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // SAST-style rules (eval, ReDoS, child_process, non-literal fs paths, etc.).
  // Fast local layer that complements the Semgrep scan in CI/pre-push.
  security.configs.recommended,
  prettierConfig,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
    'src/components/ui/**', // shadcn generated — not our code
  ]),
  {
    rules: {
      // An **error**, not a warning. As a warning this rule was advisory, and
      // hardcoded strings accumulated behind it anyway. `npm run lint` runs with
      // `--max-warnings 0`, so both are fatal — but the severity states the
      // intent, and a warning invites a `// eslint-disable-next-line` habit.
      'no-restricted-syntax': ['error', ...hardcodedTextRules],

      // One component library. Radix is allowed only as shadcn's transitive
      // dependency inside `src/components/ui/**` (globally ignored above), and
      // `@base-ui/react` is gone entirely. Two systems competing over the same
      // widgets is what the template exists to prevent.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@base-ui/react',
              message: 'Removed from this template — use the shadcn/ui primitive instead.',
            },
          ],
          patterns: [
            {
              group: ['radix-ui', '@radix-ui/*'],
              message:
                'Import the shadcn/ui wrapper from @/components/ui/* instead of Radix directly.',
            },
          ],
        },
      ],

      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      // Bracket-access heuristic — too noisy for a TS codebase (flags every
      // obj[key]); Semgrep's taint rules cover real injection sinks instead.
      'security/detect-object-injection': 'off',
    },
  },
  {
    // Build and setup scripts read and write paths they compute themselves.
    //
    // `security/detect-non-literal-fs-filename` exists to catch a *request-derived*
    // path reaching the filesystem. Nothing here is request-derived: these run on a
    // developer's machine or in CI, over paths built from this repo's own layout,
    // and they cannot be literals because that is the entire job. Leaving the rule
    // on would mean a dozen inline disables, which is how a real finding ends up
    // scrolling past unnoticed.
    files: ['scripts/**/*.mjs'],
    rules: {
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-non-literal-regexp': 'off',
    },
  },
  {
    // Tests and e2e specs are exempt from the hardcoded-string rule.
    //
    // A test's literals are fixtures and expectations, not UI copy — and a spec
    // that asserted only on `t.*` could not catch a catalog key pointing at the
    // wrong string, because both sides would move together. The rest of the
    // rules still apply.
    files: ['**/__tests__/**', '**/*.{test,spec}.{ts,tsx}', 'e2e/**'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]);

export default eslintConfig;
