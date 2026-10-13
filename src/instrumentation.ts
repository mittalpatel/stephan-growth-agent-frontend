/**
 * Runs once when the Next server starts.
 *
 * Registers how the server finds the viewer's language for the request being
 * rendered (`src/locales/serverLanguage.ts`). Without it the server renders
 * every request in the default language. See ADR-0019.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { registerRequestLanguage } = await import('./locales/serverLanguage');
  registerRequestLanguage();
}
