import { format } from '@/lib/i18n';
import { t } from '@/locales';
import type { DiscoveredUrl } from '@/types/knowledge';

/**
 * Why a page could not be read, in words a site owner can act on. The
 * backend records the HTTP status and a technical `error_message` ("HTTP
 * 404"); client testing (13 Oct 2026) found "1 page could not be read" with
 * no page or reason left people unsure whether their content was missing.
 *
 * Shared by the add-website summary and the pages screen so the same page
 * never gets two different explanations.
 */
export function pageFailureReason(page: Pick<DiscoveredUrl, 'http_status'>): string {
  const copy = t.knowledge.pages.failureReason;
  const status = page.http_status;
  if (status === null) return copy.unknown;
  if (status === 404 || status === 410) return format(copy.notFound, { status });
  if (status === 401 || status === 403) return format(copy.blocked, { status });
  if (status === 429) return copy.rateLimited;
  if (status >= 500) return format(copy.serverError, { status });
  if (status >= 400) return format(copy.httpError, { status });
  return copy.unknown;
}
