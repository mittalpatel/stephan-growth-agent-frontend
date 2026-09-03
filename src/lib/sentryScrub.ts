import type { Breadcrumb, ErrorEvent, EventHint } from '@sentry/nextjs';

/**
 * Strips the Authorization header from captured Sentry events/breadcrumbs.
 *
 * `axiosAuth` attaches a live bearer token to every authenticated request, and
 * axios's XHR/fetch instrumentation can capture request headers into both the
 * event's own `request.headers` and HTTP breadcrumbs — Sentry's default
 * scrubbing does not know about this app's custom header usage, so it isn't
 * guaranteed to catch it.
 */
export function scrubAuthorizationHeader(event: ErrorEvent, _hint: EventHint): ErrorEvent {
  if (event.request?.headers) {
    delete event.request.headers['Authorization'];
    delete event.request.headers['authorization'];
  }
  return event;
}

export function scrubAuthorizationBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb {
  if (
    (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch') &&
    breadcrumb.data &&
    typeof breadcrumb.data === 'object'
  ) {
    delete (breadcrumb.data as Record<string, unknown>)['Authorization'];
    delete (breadcrumb.data as Record<string, unknown>)['authorization'];
  }
  return breadcrumb;
}
