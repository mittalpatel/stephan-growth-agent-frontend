'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthQuery } from '@/hooks/useAuthQuery';
import { roleDetailEndpoint, roleDetailKey } from '@/services/organizations';
import { projectDetailEndpoint, projectDetailKey } from '@/services/projects';
import { t } from '@/locales';

// ─── Static segment labels ────────────────────────────────────────────────────
// One entry per route segment whose humanized form is wrong or unhelpful. A
// segment absent from here falls through to `labelForSegment`'s title-casing,
// which is right often enough that adding an entry per route would be noise —
// register a segment only when the derived label is actually unacceptable.
const SEGMENT_LABELS: Record<string, string> = {
  projects: t.navigation.projects,
  'user-profile': t.userProfile.title,
};

function labelForSegment(segment: string): string {
  return (
    SEGMENT_LABELS[segment] ?? segment.replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// ─── Dynamic resolver registry ───────────────────────────────────────────────
//
// A UUID in the URL makes a useless breadcrumb label. A resolver turns it into
// the record's name, keyed by the *parent* route segment:
//
//   things: {
//     endpoint: thingDetailEndpoint,          // builds the API URL from the id
//     queryKey: thingDetailKey,               // MUST equal the detail hook's key
//     getLabel: (data) => unwrap<{ name?: string }>(data)?.name,
//   }
//
// Import `endpoint` and `queryKey` from the service rather than writing them
// inline. The breadcrumb reads the detail page's cache, and it can only do that
// while both sides build the key from the same function.
//
// With no resolver registered, a UUID segment falls back to a shortened id —
// correct, just less useful.
type Resolver = {
  endpoint: (id: string) => string;
  queryKey: (id: string) => string[];
  getLabel: (data: unknown) => string | undefined;
};

// The detail hooks cache the raw API response, which is the standard envelope
// (`{ success, data, meta, ... }`), while direct-URL fetches here return the same.
// Unwrap one level so a resolver's `getLabel` reads the record fields whether the
// cached value is the envelope or an already-unwrapped object.
function unwrap<T>(data: unknown): T | undefined {
  if (data && typeof data === 'object' && 'data' in data) {
    return (data as { data: T }).data;
  }
  return data as T | undefined;
}

const RESOLVERS: Record<string, Resolver> = {
  // Demo module — removed by `npm run strip-demo`.
  projects: {
    endpoint: projectDetailEndpoint,
    // Imported, not hand-written. The detail hook builds its key from the same
    // function, so the two cannot drift. A mismatch here is invisible — the
    // breadcrumb just misses the cache and refetches a record the page already
    // has, which nobody notices until someone profiles the network tab.
    queryKey: projectDetailKey,
    getLabel: (data) => unwrap<{ name?: string }>(data)?.name,
  },
  roles: {
    endpoint: roleDetailEndpoint,
    queryKey: roleDetailKey,
    getLabel: (data) => unwrap<{ name?: string }>(data)?.name,
  },
};

// ─── UUID detection ───────────────────────────────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(s: string) {
  return UUID_RE.test(s);
}
function shortUuid(s: string) {
  return `${s.slice(0, 8)}…`;
}

// ─── Dynamic label component ──────────────────────────────────────────────────
// Separate component so hooks can be called unconditionally.
// - Reads the exact cache key (including platform) so it hits the existing cache
//   from the detail page with zero extra network requests.
// - Falls back to a fresh fetch if the cache is empty (e.g. direct URL load).
function DynamicLabel({
  id,
  parentSegment,
}: Readonly<{
  id: string;
  parentSegment?: string;
}>) {
  const resolver = parentSegment ? RESOLVERS[parentSegment] : undefined;
  const queryClient = useQueryClient();

  const qKey = resolver ? resolver.queryKey(id) : ['_noop_', id];
  const endpoint = resolver ? resolver.endpoint(id) : '';

  // Read from cache first — exact key match (same key the detail page uses)
  const cachedData = queryClient.getQueryData<unknown>(qKey);

  // Only fetch when cache is empty (direct URL load before detail page renders)
  const { data: fetchedData } = useAuthQuery<unknown>(qKey, endpoint, {
    enabled: !!resolver && !cachedData,
    staleTime: 60 * 1000,
  });

  const data = cachedData ?? fetchedData;
  const resolved = resolver && data ? resolver.getLabel(data) : undefined;
  const display = resolved ?? shortUuid(id);

  return <span title={id}>{display}</span>;
}

// ─── Main breadcrumb ──────────────────────────────────────────────────────────
export default function RestrictedBreadcrumb() {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 1) return null;

  return (
    <div className="bg-muted/40 flex min-w-0 items-center gap-2 overflow-x-auto border-b px-4 py-2.5 sm:px-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium transition-colors"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        {t.buttons.back}
      </button>

      <span className="bg-border h-4 w-px" />

      <nav aria-label={t.common.breadcrumb}>
        <ol className="flex items-center gap-1">
          {segments.map((seg, i) => {
            const isLast = i === segments.length - 1;
            const href = '/' + segments.slice(0, i + 1).join('/');
            const parentSegment = i > 0 ? segments[i - 1] : undefined;
            const dynamic = isUuid(seg);

            const content = dynamic ? (
              <DynamicLabel id={seg} parentSegment={parentSegment} />
            ) : (
              <span>{labelForSegment(seg)}</span>
            );

            return (
              <li key={href} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="text-muted-foreground/60 h-3 w-3" />}
                {isLast ? (
                  <span className="text-foreground text-sm font-semibold">{content}</span>
                ) : (
                  <Link
                    href={href}
                    className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
