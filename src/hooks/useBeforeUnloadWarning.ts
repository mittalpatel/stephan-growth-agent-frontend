'use client';

import { useEffect } from 'react';

/**
 * Ask the browser to confirm before unloading the page while `enabled`.
 *
 * Covers the leaves this app cannot intercept itself: a refresh, a closed tab,
 * a typed URL, the back button. In-app navigation is not one of them — the
 * browser never fires `beforeunload` for a client-side route or tab change, so
 * anything guarding those has to do it at the point of the change.
 *
 * The prompt's wording belongs to the browser and cannot be set, which is why
 * this takes no message: modern engines ignore any string given here and show
 * their own. Returning a value is still what arms the dialog at all.
 */
export function useBeforeUnloadWarning(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy engines arm the prompt off the assigned string rather than
      // `preventDefault`; harmless where it's ignored.
      event.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled]);
}
