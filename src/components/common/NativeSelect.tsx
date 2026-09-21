'use client';

import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * A native `<select>` restyled to match the shadcn `Select` trigger.
 *
 * Deliberately still a native select rather than the Radix one: it keeps form
 * registration (`register()` spreads its ref straight through), keyboard behaviour
 * and the platform picker on mobile, which is the better control on a phone. Only
 * the chrome changes, so every existing caller behaves exactly as it did.
 *
 * The chevron is a real element rather than a background image because a data-URI
 * SVG cannot follow `currentColor`, and this one has to read correctly in both
 * themes. `appearance-none` hides the platform arrow it replaces.
 */
export function NativeSelect({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<'select'> & { containerClassName?: string }) {
  return (
    <div className={cn('relative inline-flex', containerClassName)}>
      <select
        className={cn(
          'border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-muted disabled:text-muted-foreground w-full appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
      <ChevronDown
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2"
      />
    </div>
  );
}
