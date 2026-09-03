import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * A status pill.
 *
 * ## Tone is the caller's decision, not a lookup on the status string
 *
 * The obvious implementation keys a colour off the raw status
 * (`{ shipped: 'green', cancelled: 'red' }`) — and that map then lives here,
 * accumulating every domain's vocabulary until one shared component knows about
 * orders, invoices, and jobs at once. It also breaks the moment text is
 * translated, because `t.projects.status.active` is not the string `'active'`.
 *
 * So the caller passes `tone` explicitly, mapping its own statuses in its own
 * module, and `label` is already-translated display text. This component knows
 * only how a tone looks.
 *
 * Tones resolve to tokens in `globals.css`, so both themes are covered. Never
 * rely on the pill's colour alone to convey state — the label must say it too,
 * or the distinction is invisible to a colour-blind reader.
 */
const statusBadge = cva(
  'inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        neutral: 'bg-muted text-muted-foreground border-transparent',
        success: 'bg-success text-success-foreground border-transparent',
        warning: 'bg-warning text-warning-foreground border-transparent',
        danger: 'bg-destructive/10 text-destructive border-transparent',
        info: 'bg-info text-info-foreground border-transparent',
      },
    },
    defaultVariants: { tone: 'neutral' },
  }
);

export type StatusTone = NonNullable<VariantProps<typeof statusBadge>['tone']>;

type StatusBadgeProps = Readonly<{
  /** Display text. Must come from the catalog — never a raw API value. */
  label: string;
  tone?: StatusTone;
  className?: string;
}>;

export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  return <span className={cn(statusBadge({ tone }), className)}>{label}</span>;
}
