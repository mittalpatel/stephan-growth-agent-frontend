import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/**
 * Standard list/detail page header: title + optional description on the
 * left, optional actions (buttons) on the right. Extracted from Dashboard's
 * original inline markup so every page shares one title scale instead of
 * drifting toward stock shadcn `font-semibold` headings — see
 * `context/components.md`.
 */
export function PageHeader({ title, description, actions }: Readonly<PageHeaderProps>) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
