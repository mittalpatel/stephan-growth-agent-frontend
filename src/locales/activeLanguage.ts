import { DEFAULT_LANGUAGE, LOCALE_TAGS, isLanguage, type Language } from '@/config/language';

/**
 * The language the current render is in.
 *
 * In the browser it is `<html lang>`, which the root layout writes from the
 * viewer's cookie; one tab is one viewer, and a language switch reloads the
 * page. On the server many viewers share one process, so it is asked of the
 * resolver `instrumentation.ts` registers, which reads the current request's
 * cookie. Kept on `globalThis` because Next evaluates this module separately
 * in its server-component and SSR layers, and both must see the one resolver.
 */
type ServerLanguageResolver = () => string | undefined;

const RESOLVER_KEY = Symbol.for('yb-inspire.serverLanguageResolver');
type ResolverHost = { [RESOLVER_KEY]?: ServerLanguageResolver };

export function registerServerLanguageResolver(resolver: ServerLanguageResolver) {
  (globalThis as ResolverHost)[RESOLVER_KEY] = resolver;
}

export function getLanguage(): Language {
  const raw =
    typeof document === 'undefined'
      ? (globalThis as ResolverHost)[RESOLVER_KEY]?.()
      : document.documentElement.lang;
  return isLanguage(raw) ? raw : DEFAULT_LANGUAGE;
}

/** The `Intl.*` locale tag for the active language. */
export function getLocaleTag(): string {
  return LOCALE_TAGS[getLanguage()];
}
