'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDate, formatNumber } from '@/lib/i18n';
import { t } from '@/locales';

import { useKnowledgeHealth } from '../hooks/useKnowledgeHealth';

type Props = Readonly<{ agentId: string }>;

const copy = t.knowledge.health;

function Stat({ label, value, hint }: Readonly<{ label: string; value: string; hint?: string }>) {
  return (
    <div className="border-border bg-card rounded-xl border px-4 py-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-display mt-1 text-xl font-semibold">{value}</p>
      {hint && <p className="text-muted-foreground mt-0.5 text-xs">{hint}</p>}
    </div>
  );
}

/** Live health snapshot: score, source/chunk counts, last successful index build. */
export function KnowledgeHealthPanel({ agentId }: Props) {
  const { health, isLoading, isError, refetch } = useKnowledgeHealth(agentId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((tile) => (
          <Skeleton key={tile} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  // Without this the panel sat on its skeleton forever when the read failed.
  if (isError || !health) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">{copy.error}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t.buttons.tryAgain}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // The backend scores 0-100 and returns 0 when there are no sources at all,
  // which reads as "broken" rather than "nothing added yet".
  const hasSources = health.sources > 0;

  return (
    <section aria-label={copy.title} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat
        label={copy.score}
        value={hasSources ? format(copy.scoreValue, { score: health.score }) : copy.notAvailable}
        hint={hasSources ? undefined : copy.noSourcesHint}
      />
      <Stat label={copy.sources} value={formatNumber(health.sources)} />
      <Stat label={copy.indexedChunks} value={formatNumber(health.indexed_chunks)} />
      <Stat
        label={copy.lastUpdated}
        value={health.last_updated ? formatDate(health.last_updated) : copy.notAvailable}
      />
    </section>
  );
}
