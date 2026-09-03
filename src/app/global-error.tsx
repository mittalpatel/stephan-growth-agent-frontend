'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { DEFAULT_LANGUAGE } from '@/config/language';
import { t } from '@/locales';

interface Props {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

// Catches errors thrown in the root layout/providers themselves — those escape
// the route-level error.tsx boundaries. It replaces the whole document, so it
// renders its own <html>/<body> and stays independent of app providers.
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    Sentry.captureException(error);
    if (process.env.NODE_ENV !== 'production') console.error(error);
  }, [error]);

  return (
    <html lang={DEFAULT_LANGUAGE}>
      <body>
        {/*
          The one sanctioned exception to "colours live only in globals.css".

          This boundary catches failures in the root layout itself, which is what
          imports the stylesheet — so by the time it renders, the app's tokens may
          never have loaded. Referencing `bg-background` here would risk showing
          the user unstyled black-on-white at the exact moment something has
          already gone wrong. Hence literals, inline, with no dependencies.

          A <style> tag rather than a style attribute, because `prefers-color-scheme`
          cannot be expressed inline, and a stark white flash on a dark-mode
          machine is its own small insult after a crash.
        */}
        <style>{`
          .global-error {
            display: flex; flex-direction: column; align-items: center;
            justify-content: center; gap: 1rem; min-height: 100vh;
            text-align: center; font-family: system-ui, sans-serif; padding: 2rem;
            background: #ffffff; color: #111111;
          }
          .global-error p { color: #666666; }
          .global-error button {
            padding: 0.5rem 1.25rem; border-radius: 0.5rem; border: none;
            background: #111111; color: #ffffff; cursor: pointer; font-weight: 600;
          }
          @media (prefers-color-scheme: dark) {
            .global-error { background: #111111; color: #fafafa; }
            .global-error p { color: #a1a1a1; }
            .global-error button { background: #fafafa; color: #111111; }
          }
        `}</style>
        <div className="global-error">
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{t.errors.somethingWentWrong}</h2>
          <p>{t.common.somethingWentWrong}</p>
          {process.env.NODE_ENV !== 'production' && (
            <pre style={{ maxWidth: '100%', overflow: 'auto', fontSize: '0.75rem' }}>
              {error.message}
            </pre>
          )}
          <button type="button" onClick={reset}>
            {t.buttons.tryAgain}
          </button>
        </div>
      </body>
    </html>
  );
}
