/**
 * The backend origin for calls made from the Next.js *server* (route handlers,
 * NextAuth's `authorize()`), as opposed to the browser.
 *
 * Prefers `BACKEND_INTERNAL_API` when set, falling back to the public
 * `NEXT_PUBLIC_BACKEND_API` otherwise — so behavior is unchanged wherever the
 * new var isn't configured (e.g. local dev). This split exists for a NAT
 * hairpin: on some hosts the server cannot route back to its own public
 * domain, so a server-side call using the public URL hangs until it's killed
 * by a proxy timeout. `BACKEND_INTERNAL_API` lets ops point server-to-server
 * calls at a local/internal address (e.g. `http://127.0.0.1:8000/`) instead.
 * The browser has no such loopback problem and always uses the public URL —
 * see `src/lib/backendOrigins.ts`.
 */
export function serverBackendOrigin(): string {
  return (
    process.env.BACKEND_INTERNAL_API ??
    process.env.NEXT_PUBLIC_BACKEND_API ??
    'http://localhost:8000/'
  );
}
