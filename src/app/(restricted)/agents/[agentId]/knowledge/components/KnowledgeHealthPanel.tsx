'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/i18n';
import { t } from '@/locales';

import { useKnowledgeHealth } from '../hooks/useKnowledgeHealth';

type Props = Readonly<{ agentId: string }>;

/** Live health snapshot: score, source/chunk counts, last successful index build. */
export function KnowledgeHealthPanel({ agentId }: Props) {
  const { health, isLoading } = useKnowledgeHealth(agentId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.knowledge.health.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || !health ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-xs">{t.knowledge.health.score}</p>
              <p className="text-lg font-semibold">{health.score}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t.knowledge.health.sources}</p>
              <p className="text-lg font-semibold">{health.sources}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t.knowledge.health.indexedChunks}</p>
              <p className="text-lg font-semibold">{health.indexed_chunks}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">{t.knowledge.health.lastUpdated}</p>
              <p className="text-lg font-semibold">
                {health.last_updated ? formatDate(health.last_updated) : '–'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
