import * as Sentry from '@sentry/nextjs';
import { scrubAuthorizationBreadcrumb, scrubAuthorizationHeader } from '@/lib/sentryScrub';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Replay captures 10% of sessions, 100% of sessions with errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
    beforeSend: scrubAuthorizationHeader,
    beforeBreadcrumb: scrubAuthorizationBreadcrumb,
  });
}
