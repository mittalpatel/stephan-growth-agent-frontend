import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

// Load e2e-specific env vars (credentials per role).
// File is gitignored — copy .env.e2e.example → .env.e2e and fill in.
config({ path: '.env.e2e', override: false });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }], ['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // ── Auth setup projects (one per role) ──────────────────────────────
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',
    },
    {
      name: 'setup:read-only',
      testMatch: '**/auth.setup.read-only.ts',
    },
    {
      name: 'setup:no-access',
      testMatch: '**/auth.setup.no-access.ts',
    },

    // ── Browser projects (full-access user — Executive/Admin) ───────────
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
      },
      dependencies: ['setup'],
      testMatch: '**/authenticated/**/*.spec.ts',
      testIgnore: ['**/authenticated/rbac/**', '**/authenticated/regression/**', '**/authenticated/projects/**'],
    },

    // ── Cross-org / regression specs that log in as seeded demo-org and
    // acme-corp accounts themselves (DEBUG-only `seed_demo_users`), rather
    // than depending on the single-tenant storage states above ────────────
    {
      name: 'rbac',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        '**/authenticated/rbac/**/*.spec.ts',
        '**/authenticated/regression/**/*.spec.ts',
        '**/authenticated/projects/**/*.spec.ts',
      ],
    },

    // ── Read-only role (Digital Sales / Operations / Finance) ───────────
    {
      name: 'chromium:read-only',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/read-only.json',
      },
      dependencies: ['setup:read-only'],
      testMatch: '**/roles/read-only.spec.ts',
    },

    // ── No-access role (Extranet / CXO / Servicios al Cliente) ──────────
    {
      name: 'chromium:no-access',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/no-access.json',
      },
      dependencies: ['setup:no-access'],
      testMatch: '**/roles/no-access.spec.ts',
    },

    // ── Unauthenticated (public pages) ──────────────────────────────────
    {
      name: 'unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/unauthenticated/**/*.spec.ts',
    },

    // ── Phase 2 auth-hardening journey (signup → MFA → sessions → password
    // policy) as one continuous new-user story ───────────────────────────
    // Runs standalone: creates its own account via public signup rather than
    // depending on the seeded storage states above, and records everything
    // (not just failures) — see e2e/journey/README.md for the one
    // prerequisite (the backend's console email backend) this needs.
    {
      name: 'journey',
      use: {
        ...devices['Desktop Chrome'],
        screenshot: 'on',
        video: 'on',
        trace: 'on',
      },
      testMatch: '**/journey/**/*.spec.ts',
      timeout: 180_000,
      outputDir: 'e2e/journey/artifacts/test-results',
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
