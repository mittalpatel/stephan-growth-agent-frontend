/**
 * Server-only config for social login (generic OIDC), read from `OIDC_PROVIDERS`
 * + per-provider `OIDC_<NAME>_ISSUER`/`OIDC_<NAME>_CLIENT_ID`/`OIDC_<NAME>_CLIENT_SECRET`.
 *
 * Deliberately not exported for client use — `clientSecret` must never reach the
 * browser bundle. The client-side button list is a *separate*, non-secret env var
 * (`NEXT_PUBLIC_SOCIAL_PROVIDERS`, names only) read directly where the buttons
 * render — see `src/app/(public)/components/SocialLoginButtons.tsx`. The two
 * lists are expected to be kept in sync by whoever configures `.env`, but they
 * are read independently: this file must never be imported from client code.
 */

export interface OidcProviderConfig {
  /** Also the NextAuth provider id, and the path segment in the backend's
   *  `/api/v1/auth/oauth/<provider>/exchange/`. */
  id: string;
  label: string;
  issuer: string;
  clientId: string;
  clientSecret: string;
}

function providerNames(): string[] {
  return (process.env.OIDC_PROVIDERS ?? '')
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
}

function labelFor(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/** Only providers with every required env var set — a partially configured
 * name (e.g. issuer set, secret forgotten) is silently dropped rather than
 * crashing the whole app at boot, since this runs at NextAuth request time. */
export function getOidcProviders(): OidcProviderConfig[] {
  return providerNames().flatMap((name) => {
    const upper = name.toUpperCase();
    const issuer = process.env[`OIDC_${upper}_ISSUER`];
    const clientId = process.env[`OIDC_${upper}_CLIENT_ID`];
    const clientSecret = process.env[`OIDC_${upper}_CLIENT_SECRET`];
    if (!issuer || !clientId || !clientSecret) return [];
    return [{ id: name, label: labelFor(name), issuer: issuer.replace(/\/$/, ''), clientId, clientSecret }];
  });
}
