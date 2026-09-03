'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

interface Props {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-3xl font-normal">{t.errors.somethingWentWrong}</h1>
      <p className="text-muted-foreground">{t.common.somethingWentWrong}</p>
      {process.env.NODE_ENV !== 'production' && (
        <pre className="text-destructive max-w-full overflow-auto text-xs">{error.message}</pre>
      )}
      <Button onClick={reset}>{t.buttons.tryAgain}</Button>
    </div>
  );
}
