/**
 * The translation catalog.
 *
 * Static and typed: every locale is a TypeScript object that must satisfy
 * `Translations` (derived from English), so a missing, misspelled, or extra
 * key is a compile error rather than a blank string found in production. See
 * `docs/adr/0013-static-typed-locales.md`.
 *
 * ## Per-user language (ADR-0019)
 *
 * `t` is not one catalog object. It is a read-through view that looks up the
 * active language (`getLanguage()`) each time a value is read, so one server
 * process can render one request in English and the next in French. Nested
 * objects come back as views too, which is what keeps the common
 * `const copy = t.agents.detail` at module scope working: it captures a path,
 * not one language's strings. Only reading a *string* at module scope freezes
 * it, which is why page `metadata` is built in `generateMetadata`.
 *
 * ## Adding a language
 *
 *   1. `cp -r src/locales/en src/locales/xx`, translate the values (keys stay).
 *   2. Add `'xx'` to `SUPPORTED_LANGUAGES`, `LOCALE_TAGS` and `LANGUAGE_NAMES`
 *      in `src/config/language.ts`, and to `translations` below.
 *   3. `npx tsc --noEmit`.
 *
 * The language selector appears by itself once more than one is supported.
 */
import { type Language } from '@/config/language';

import { getLanguage } from './activeLanguage';
import { en } from './en';
import { fr } from './fr';

export type { Language };

/** English's literal strings widened to `string`, keys and nesting kept. */
type Widen<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : { readonly [K in keyof T]: Widen<T[K]> };

/**
 * The shape every locale must satisfy, derived from English. Widened because
 * the catalog is `as const` (keys must be exact) while another language's
 * values naturally differ.
 */
export type Translations = Widen<typeof en>;

export const translations: Record<Language, Translations> = { en, fr };

type Node = Record<PropertyKey, unknown>;

// One view per catalog path, keyed by that path's English node, so a view
// keeps its identity across reads (stable for React dependency arrays).
const views = new WeakMap<object, object>();

function resolve(path: readonly PropertyKey[]): Node {
  let node: unknown = translations[getLanguage()];
  for (const key of path) node = (node as Node)[key];
  return node as Node;
}

function view<T extends object>(shape: T, path: readonly PropertyKey[]): T {
  const cached = views.get(shape);
  if (cached) return cached as T;

  const read = (key: PropertyKey) => {
    const value = resolve(path)[key];
    const child = (shape as Node)[key];
    // Objects and arrays stay views; strings and numbers are returned as is.
    return typeof value === 'object' && value !== null && typeof child === 'object' && child
      ? view(child, [...path, key])
      : value;
  };

  const proxy = new Proxy(shape, {
    get: (_target, key) => (typeof key === 'symbol' ? Reflect.get(resolve(path), key) : read(key)),
    getOwnPropertyDescriptor: (target, key) => {
      const own = Reflect.getOwnPropertyDescriptor(target, key);
      return own && { ...own, value: read(key) };
    },
  });
  views.set(shape, proxy);
  return proxy;
}

/** The active catalog. Import this: `import { t } from '@/locales'`. */
export const t: Translations = view(en, []);
