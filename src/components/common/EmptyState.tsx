import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

/**
 * The "nothing here" state for a list, table, or panel.
 *
 * Takes an optional `action` because an empty state without one is a dead end:
 * the user is told there is nothing and given no way to change that. The two
 * cases worth distinguishing are "no records exist yet" (action: create one) and
 * "your filters matched nothing" (action: clear filters) — the caller decides
 * which by passing different copy, since only it knows whether filters are on.
 */
type EmptyStateProps = Readonly<{
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}>;

export function EmptyState({ title, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-8 text-center">
      <div className="bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-full">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        {description && (
          <p className="text-muted-foreground max-w-sm text-sm text-balance">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
