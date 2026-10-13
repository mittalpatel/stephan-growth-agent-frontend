import type { ReactNode } from 'react';

interface PageHeaderProps {
  /**
   * Small uppercase kicker above the title, in the gold brand accent. This is
   * what `--brand-accent` was declared for in `globals.css`; before this prop
   * existed the token had no caller.
   */
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

/**
 * Standard list/detail page header: optional eyebrow, title and description on
 * the left, optional actions (buttons) on the right. Extracted from
 * Dashboard's original inline markup so every page shares one title scale
 * instead of drifting toward stock shadcn `font-semibold` headings — see
 * `context/components.md`.
 *
 * The scale (28px display title, 15px description, `max-w-2xl` measure)
 * matches `components/common/PageHeader` in the `ai-agents-platform`
 * reference. The measure is deliberate: a description that runs the full width
 * of a wide screen is measurably harder to read than one capped near 70
 * characters.
 */
export function PageHeader({ eyebrow, title, description, actions }: Readonly<PageHeaderProps>) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div className="max-w-2xl">
        {eyebrow && (
          <span className="text-brand-accent-strong mb-2 block text-xs font-semibold tracking-wider uppercase">
            {eyebrow}
          </span>
        )}
        <h1 className="font-display text-[28px] leading-tight font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-2 text-[15px] leading-relaxed">{description}</p>
        )}
      </div>
      {actions && <div className="flex max-w-full flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}
