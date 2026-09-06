'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDate, formatNumber } from '@/lib/i18n';
import { t } from '@/locales';

import { useKnowledgeHealth } from '../hooks/useKnowledgeHealth';

type Props = Readonly<{ agentId: string }>;

/** Live health snapshot: score, source/chunk counts, last successful index build. */
export function KnowledgeHealthPanel({ agentId }: Props) {
  const { health, isLoading, isError, refetch } = useKnowledgeHealth(agentId);

  function renderBody() {
    if (isLoading) return <Skeleton className="h-16 w-full" />;

    // Without this the panel sat on its skeleton forever when the read failed.
    if (isError || !health) {
      return (
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">{t.knowledge.health.error}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t.buttons.tryAgain}
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground text-xs">{t.knowledge.health.score}</p>
          {/* The backend scores 0-100 and returns 0 when there are no sources
              at all, which reads as "broken" rather than "nothing added yet". */}
          <p className="text-lg font-semibold">
            {health.sources === 0
              ? '–'
              : format(t.knowledge.health.scoreValue, { score: health.score })}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{t.knowledge.health.sources}</p>
          <p className="text-lg font-semibold">{formatNumber(health.sources)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{t.knowledge.health.indexedChunks}</p>
          <p className="text-lg font-semibold">{formatNumber(health.indexed_chunks)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">{t.knowledge.health.lastUpdated}</p>
          <p className="text-lg font-semibold">
            {health.last_updated ? formatDate(health.last_updated) : '–'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.knowledge.health.title}</CardTitle>
      </CardHeader>
      <CardContent>{renderBody()}</CardContent>
    </Card>
  );
}
