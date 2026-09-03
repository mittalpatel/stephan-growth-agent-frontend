import { Skeleton } from '@/components/ui/skeleton';

export default function OrganizationSettingsSkeleton() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="space-y-4 rounded-lg border border-border p-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
