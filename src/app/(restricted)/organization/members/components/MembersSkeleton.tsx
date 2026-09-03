import { Skeleton } from '@/components/ui/skeleton';

/**
 * Matches the final table's shape, not a generic spinner — a skeleton that lines
 * up with what replaces it avoids the layout jump that makes a page feel slower
 * than it is.
 */
export default function MembersSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="rounded-md border border-border">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-b border-border p-4 last:border-0"
          >
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="ml-auto h-8 w-32" />
          </div>
        ))}
      </div>
    </div>
  );
}
