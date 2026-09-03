import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      // Count every source file in `include`, not just those a test happened to
      // import, so untested logic shows as 0% instead of being invisible.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        'src/app/api/**',
        'src/components/ui/**', // shadcn primitives — not our code
        // Imports `server-only`, which the v8 provider's parser chokes on. It
        // was already being dropped from the report with a stack trace on every
        // run; excluding it explicitly keeps CI output readable. The module is a
        // server-side fetch with no branching worth asserting in jsdom — cover it
        // through the Playwright RBAC specs instead.
        'src/lib/auth/getMyPermissions.ts',
      ],
      // Ratchet floors on the business-logic directories, set just under the
      // current measured coverage. They can only be raised — a drop fails CI,
      // so untested logic can't be merged into these paths. Presentational
      // components are intentionally left ungated.
      thresholds: {
        'src/services/**': { statements: 70, branches: 66, functions: 70, lines: 73 },
        'src/lib/**': { statements: 45, branches: 30, functions: 54, lines: 44 },
        'src/client/**': { statements: 95, branches: 84, functions: 100, lines: 95 },
      },
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // `server-only` is a build-time guard: importing it in a module that ends
      // up in a client bundle is a Next.js build error. That guard is worth
      // keeping on modules that hold token-handling code, but the package has no
      // runtime implementation for vitest to resolve, so it is stubbed here.
      // Aliasing rather than dropping the import keeps the real protection in the
      // build while letting the routes be unit-tested.
      'server-only': path.resolve(__dirname, './src/test/serverOnlyStub.ts'),
    },
  },
});
