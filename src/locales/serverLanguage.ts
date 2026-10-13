import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external';

import { LANGUAGE_COOKIE } from '@/config/language';

import { registerServerLanguageResolver } from './activeLanguage';

type CookieReader = { get: (name: string) => { value: string } | undefined };

/**
 * Teaches `getLanguage()` to read the current request's language cookie on the
 * server, synchronously, wherever a string is read during a render.
 *
 * `cookies()` is async-only in Next 16, and the catalog is read synchronously
 * from code that cannot await (zod schemas, helpers, client components during
 * SSR). Next keeps the request in `workUnitAsyncStorage`, the store
 * `cookies()` itself reads; this reads the same store. It is an internal
 * module, so it is confined to this file and fails safe: if a Next upgrade
 * moves it, `getLanguage()` falls back to the default language rather than
 * throwing. `src/locales/__tests__/serverLanguage.test.ts` pins the shape.
 * See ADR-0019.
 */
export function readRequestLanguage(): string | undefined {
  try {
    const store = workUnitAsyncStorage.getStore() as { cookies?: unknown } | undefined;
    const cookies = store?.cookies as CookieReader | Promise<unknown> | undefined;
    if (!cookies || cookies instanceof Promise || typeof cookies.get !== 'function') {
      return undefined;
    }
    return cookies.get(LANGUAGE_COOKIE)?.value;
  } catch {
    return undefined;
  }
}

export function registerRequestLanguage() {
  registerServerLanguageResolver(readRequestLanguage);
}
