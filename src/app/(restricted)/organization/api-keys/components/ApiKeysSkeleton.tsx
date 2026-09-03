import { Skeleton } from '@/components/ui/skeleton';

/**
 * Shaped like the table it replaces, not a single grey block — see
 * `AuditSkeleton`, which this mirrors.
 */
export default function ApiKeysSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="border-border divide-border divide-y rounded-md border" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-36 shrink-0" />
          <Skeleton className="h-4 w-24 shrink-0" />
          <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}
