import { Skeleton } from '@/components/ui/skeleton';

/**
 * The loading state, shaped like the thing it is loading.
 *
 * A skeleton whose rows match the real table's height and column count means the
 * page does not jump when data arrives. A centred spinner is easier to write and
 * guarantees a layout shift on every load, which is why there isn't one here —
 * see `docs/topics/15-ui-design.md`.
 *
 * `rows` should match the caller's page size so the skeleton is the same height
 * as the result.
 */
export function ProjectsTableSkeleton({ rows = 10 }: Readonly<{ rows?: number }>) {
  return (
    <div className="bg-card overflow-hidden rounded-lg border">
      <div className="bg-muted/50 flex items-center gap-4 border-b px-4 py-3 sm:px-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="hidden h-4 w-24 md:block" />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b px-4 py-3.5 last:border-0 sm:px-6"
        >
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="hidden h-4 w-20 sm:block" />
          <Skeleton className="hidden h-4 w-16 md:block" />
        </div>
      ))}
    </div>
  );
}

export function ProjectsGridSkeleton({ cards = 8 }: Readonly<{ cards?: number }>) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: cards }, (_, index) => (
        <div key={index} className="space-y-3 rounded-lg border p-4">
          <div className="flex items-start justify-between gap-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}
