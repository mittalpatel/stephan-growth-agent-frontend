import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type MetricCardProps = Readonly<{
  /** Already-translated label. Sentence case, not uppercase: the reference
      design leans on the display face for emphasis, not on letter-spacing. */
  label: string;
  /** Already-formatted value. Formatting is the caller's job because only it
      knows whether the number is a count, a percentage or a currency. */
  value: string;
  /** Change over the compared period, already formatted (e.g. `+24.6%`). */
  delta?: string;
  deltaDirection?: 'up' | 'down';
  /** Small qualifier beside the delta, e.g. the period it covers. */
  sublabel?: string;
  isLoading?: boolean;
}>;

/**
 * The headline-number card, shared by the dashboard, analytics and an agent's
 * Overview tab so one number reads the same everywhere.
 *
 * Mirrors `components/common/MetricCard` in the `ai-agents-platform`
 * reference: muted label, display-face value, and an optional coloured delta
 * with a directional arrow. The arrow matters — colour alone would carry the
 * up/down distinction, which is invisible to a colour-blind reader.
 */
export function MetricCard({
  label,
  value,
  delta,
  deltaDirection = 'up',
  sublabel,
  isLoading,
}: MetricCardProps) {
  const DeltaIcon = deltaDirection === 'up' ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="hover:ring-foreground/20 py-5 transition-all">
      <CardContent className="flex flex-col gap-3 px-5">
        <span className="text-muted-foreground text-sm font-medium">{label}</span>
        {isLoading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <span className="font-display text-3xl font-bold tracking-tight">{value}</span>
        )}
        {!isLoading && (delta || sublabel) && (
          <div className="flex items-center gap-1.5 text-xs">
            {delta && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-semibold',
                  deltaDirection === 'up' ? 'text-success-foreground' : 'text-destructive'
                )}
              >
                <DeltaIcon className="size-3.5" aria-hidden />
                {delta}
              </span>
            )}
            {sublabel && <span className="text-muted-foreground">{sublabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
