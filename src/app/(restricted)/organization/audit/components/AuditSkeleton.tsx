import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shaped like the table it replaces, not a single grey block.
 *
 * The header and toolbar are rendered by `AuditView` before this point, so the
 * skeleton covers only the rows — a full-page skeleton would make the toolbar
 * flicker in and out on every filter change, since the list refetches while the
 * toolbar stays put.
 */
export default function AuditSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="border-border divide-border divide-y rounded-md border" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-36 shrink-0" />
          <Skeleton className="h-4 w-52 shrink-0" />
          <Skeleton className="h-5 w-32 shrink-0 rounded-full" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}
