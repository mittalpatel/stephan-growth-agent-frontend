import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors `AgentSettingsView`'s layout so the page does not reflow on load. */
export function AgentSettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-56" />
      </div>
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="bg-card space-y-3 rounded-lg border p-6">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  );
}
