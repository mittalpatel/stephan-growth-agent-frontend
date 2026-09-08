import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors `AgentDetailView`'s layout so the page does not reflow on load. */
export function AgentDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64" />
      </div>
      <Skeleton className="h-9 w-72" />
      <div className="bg-card space-y-4 rounded-lg border p-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex justify-between gap-4 border-b pb-3 last:border-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
