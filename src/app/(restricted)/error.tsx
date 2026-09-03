'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { t } from '@/locales';

interface Props {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function RestrictedError({ error, reset }: Props) {
  useEffect(() => {
    Sentry.captureException(error);
    if (process.env.NODE_ENV !== 'production') console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <h2 className="text-2xl font-normal">{t.errors.somethingWentWrong}</h2>
      <p className="text-muted-foreground">{t.common.somethingWentWrong}</p>
      {process.env.NODE_ENV !== 'production' && (
        <pre className="text-destructive max-w-full overflow-auto text-xs">{error.message}</pre>
      )}
      <Button onClick={reset}>{t.buttons.tryAgain}</Button>
    </div>
  );
}
