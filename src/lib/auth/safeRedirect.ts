import { DEFAULT_LANDING } from '@/constants/navItems';

const ALLOWED_HOSTS = [process.env.NEXTAUTH_URL ?? 'http://localhost:3000'];

/**
 * Reduce a caller-supplied `next=` target to something safe to navigate to.
 *
 * The rule is a single one: **decide using the parsed URL, never the raw string.**
 * A previous version tested `url.startsWith('/') && !url.startsWith('//')` against
 * the raw input and, when that passed, returned the input unexamined — so
 * `/\/evil.com` slipped through, because it starts with one slash and its second
 * character is a backslash rather than a slash. Both the WHATWG URL parser and
 * every browser treat `\` as `/` in that position, so the string that looked
 * relative resolved to `http://evil.com/`. Any check of this shape is a guess at
 * what the parser will do; asking the parser is not.
 *
 * Returns the resolved same-origin path (never the caller's raw string), or
 * `fallback` for anything cross-origin, malformed, or non-HTTP.
 */
export function safeRedirect(url: string | null | undefined, fallback = DEFAULT_LANDING): string {
  if (!url) return fallback;

  const base = ALLOWED_HOSTS[0];
  let parsed: URL;
  try {
    parsed = new URL(url, base);
  } catch {
    return fallback; // malformed
  }

  // `javascript:` and `data:` parse successfully and are not navigable targets.
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return fallback;

  const isAllowedOrigin = ALLOWED_HOSTS.some((h) => {
    try {
      return new URL(h).origin === parsed.origin;
    } catch {
      return false;
    }
  });
  if (!isAllowedOrigin) return fallback;

  // Hand back the normalized path, not `url`: returning the raw string would
  // reintroduce the gap between what was validated and what is navigated to.
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
