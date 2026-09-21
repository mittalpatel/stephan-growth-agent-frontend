import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="border-border divide-border divide-y rounded-md border" aria-busy="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
        </div>
      ))}
    </div>
  );
}
