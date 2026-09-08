import { Badge } from '@/components/ui/badge';
import { t } from '@/locales';

/**
 * A visible marker on a Sprint 1 static-preview page: static mock data laid
 * out in the app's real shell, built ahead of the backend per
 * frontend-plan-v3.md so the layout and navigation can be reviewed now. No
 * hook, no service call — the data is inline in the page.
 *
 * Every page that renders this must lose it in the same change that wires the
 * page to a real endpoint, not before.
 */
export function PreviewBanner({ note }: Readonly<{ note: string }>) {
  return (
    <div className="border-border bg-muted/40 flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm">
      <Badge
        variant="outline"
        className="border-brand-accent-strong/40 text-brand-accent-strong shrink-0"
      >
        {t.common.previewBadge}
      </Badge>
      <p className="text-muted-foreground">{note}</p>
    </div>
  );
}
