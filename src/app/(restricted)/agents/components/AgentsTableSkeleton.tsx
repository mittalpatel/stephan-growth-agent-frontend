import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** The loading state, shaped like the real card grid (`AgentsGrid`). */
export function AgentsTableSkeleton({ rows = 10 }: Readonly<{ rows?: number }>) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {Array.from({ length: rows }, (_, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <Skeleton className="size-12 rounded-xl" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </div>
            <div className="flex items-center justify-between border-t pt-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-9 w-28 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
