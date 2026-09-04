import { Skeleton } from '@/components/ui/skeleton';

/** The loading state, shaped like the real table — see `ProjectsTableSkeleton`. */
export function AgentsTableSkeleton({ rows = 10 }: Readonly<{ rows?: number }>) {
  return (
    <div className="bg-card overflow-hidden rounded-lg border">
      <div className="bg-muted/50 flex items-center gap-4 border-b px-4 py-3 sm:px-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="hidden h-4 w-40 lg:block" />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 border-b px-4 py-3.5 last:border-0 sm:px-6"
        >
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="hidden h-4 w-40 lg:block" />
        </div>
      ))}
    </div>
  );
}
