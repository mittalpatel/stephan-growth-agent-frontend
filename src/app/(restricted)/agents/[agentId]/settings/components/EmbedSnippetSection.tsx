'use client';

import { Card, CardContent } from '@/components/ui/card';
import { t } from '@/locales';

const copy = t.agents.settings.embed;

const SNIPPET = `fetch('https://your-domain.example.com/widget/config/', {
  headers: { 'X-Widget-Key': 'YOUR_DEPLOYMENT_KEY' },
})`;

/**
 * Informational only, no API calls of its own. `WIDGET_KEY_HEADER` in
 * `apps/widgetgw/constants.py` maps to the `X-Widget-Key` header shown here;
 * the config endpoint alone also accepts the key as a `?key=` query param.
 */
export function EmbedSnippetSection() {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-bold">{copy.title}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{copy.description}</p>
        </div>
        <pre className="bg-muted overflow-x-auto rounded-md p-4 text-xs">
          <code>{SNIPPET}</code>
        </pre>
        <p className="text-muted-foreground text-xs">{copy.queryParamNote}</p>
      </CardContent>
    </Card>
  );
}
