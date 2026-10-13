import { plural } from '@/lib/i18n';
import { t } from '@/locales';
import type { SourceProgress } from '@/types/knowledge';

/**
 * One plain sentence for where a source is, plus how far through reading it
 * is (`null` outside reading, which has no total to measure against).
 *
 * Client review (13 Oct 2026) found the step trail ("Finding pages - Choose
 * pages - Reading pages - Ready") with a separate count beside it hard to
 * read at a glance. A sentence says the same thing in one place, and the bar,
 * the add-website dialog and the list all use it so they always agree.
 */
export function progressLine(
  progress: SourceProgress | null | undefined,
  fallback: SourceProgress['stage']
): { text: string; percent: number | null } {
  const copy = t.knowledge.processing.line;
  const stage = progress?.stage ?? fallback;
  const found = progress?.pages_found ?? 0;
  const total = progress?.pages_total ?? 0;
  const done = progress?.pages_done ?? 0;
  switch (stage) {
    case 'waiting':
      return { text: copy.waiting, percent: null };
    case 'finding':
      return { text: found ? plural(found, copy.findingCount) : copy.finding, percent: null };
    case 'choosing':
      return { text: found ? plural(found, copy.choosing) : copy.choosingNoCount, percent: null };
    case 'reading':
      return total
        ? {
            text: plural(total, copy.reading, { done }),
            percent: Math.round((done / total) * 100),
          }
        : { text: copy.readingNoCount, percent: null };
  }
}

/** "https://www.example.com/" reads as "example.com": the address a person would say. */
export function siteName(displayName: string): string {
  try {
    const url = new URL(displayName);
    return url.hostname.replace(/^www\./, '') + url.pathname.replace(/\/$/, '');
  } catch {
    return displayName;
  }
}
