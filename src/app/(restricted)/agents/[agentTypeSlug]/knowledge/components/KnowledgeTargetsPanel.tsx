'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { t } from '@/locales';

import { useAllKnowledgeSources } from '../hooks/useAllKnowledgeSources';
import { useKnowledgeTargets } from '../hooks/useKnowledgeTargets';

type Props = Readonly<{ agentId: string }>;

/**
 * Which of the organization's shared sources this agent reads.
 *
 * Two states, not one list with a zero case: "all sources" (no target rows,
 * the backend's fallback) and "selected sources". They are presented as an
 * explicit choice because the difference matters going forward — an agent on
 * "all" picks up sources added later, a narrowed one does not. Clearing every
 * checkbox is deliberately not the same as choosing "all", so the save button
 * stays disabled on an empty selection rather than silently un-narrowing the
 * agent behind the operator's back.
 */
export function KnowledgeTargetsPanel({ agentId }: Props) {
  const { selectedIds, isNarrowed, canManage, isLoading, isError, refetch, save, isSaving } =
    useKnowledgeTargets(agentId);
  const {
    sources,
    isTruncated,
    total,
    isLoading: isSourcesLoading,
    isError: isSourcesError,
    refetch: refetchSources,
  } = useAllKnowledgeSources();

  // Server state is the default; local state exists only once the operator
  // has actually edited something, and is dropped again on a successful save.
  // Deriving the unedited case rather than copying it into state via an
  // effect means a refetch cannot leave the two out of sync, and there is no
  // render where the panel shows a stale copy of what the server just
  // returned.
  const [edit, setEdit] = useState<{ mode: 'all' | 'selected'; draft: string[] } | null>(null);

  const mode = edit?.mode ?? (isNarrowed ? 'selected' : 'all');
  const draft = edit?.draft ?? selectedIds;
  const setMode = (next: 'all' | 'selected') => setEdit({ mode: next, draft });

  if (isLoading || isSourcesLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (isError || isSourcesError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.knowledge.targets.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">{t.knowledge.targets.error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refetch();
              void refetchSources();
            }}
          >
            {t.buttons.tryAgain}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const toggle = (sourceId: string, checked: boolean) => {
    setEdit({
      mode,
      draft: checked ? [...draft, sourceId] : draft.filter((id) => id !== sourceId),
    });
  };

  const isDirty =
    mode !== (isNarrowed ? 'selected' : 'all') ||
    (mode === 'selected' &&
      draft.slice().sort().join(',') !== selectedIds.slice().sort().join(','));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.knowledge.targets.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{t.knowledge.targets.description}</p>

        <RadioGroup
          value={mode}
          onValueChange={(value) => setMode(value as 'all' | 'selected')}
          disabled={!canManage}
          className="gap-2"
        >
          {(
            [
              ['all', t.knowledge.targets.modeAll, t.knowledge.targets.modeAllDescription],
              [
                'selected',
                t.knowledge.targets.modeSelected,
                t.knowledge.targets.modeSelectedDescription,
              ],
            ] as const
          ).map(([value, label, description]) => (
            <Label
              key={value}
              className={cn(
                'border-border flex cursor-pointer items-start gap-3 rounded-lg border p-3 font-normal',
                mode === value && 'border-primary bg-primary/5'
              )}
            >
              <RadioGroupItem value={value} className="mt-0.5" />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium">{label}</span>
                <span className="text-muted-foreground block text-xs">{description}</span>
              </span>
            </Label>
          ))}
        </RadioGroup>

        {mode === 'selected' && sources.length > 0 && (
          <p className="text-muted-foreground text-xs">
            {format(t.knowledge.targets.selectedCount, {
              selected: draft.length,
              total: sources.length,
            })}
          </p>
        )}

        {mode === 'selected' && (
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
            {sources.length === 0 ? (
              <p className="text-muted-foreground p-2 text-sm">{t.knowledge.targets.noSources}</p>
            ) : (
              sources.map((source) => (
                <label
                  key={source.id}
                  className="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
                >
                  <Checkbox
                    checked={draft.includes(source.id)}
                    disabled={!canManage}
                    onCheckedChange={(checked) => toggle(source.id, checked === true)}
                  />
                  <span className="truncate">{source.display_name}</span>
                </label>
              ))
            )}
          </div>
        )}

        {mode === 'selected' && isTruncated && (
          <p className="text-muted-foreground text-xs">
            {format(t.knowledge.targets.truncated, { shown: sources.length, total })}
          </p>
        )}

        {canManage && isDirty && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isSaving || (mode === 'selected' && draft.length === 0)}
              onClick={() => save(mode === 'all' ? [] : draft, () => setEdit(null))}
            >
              {t.knowledge.targets.saveChanges}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isSaving}
              onClick={() => setEdit(null)}
            >
              {t.knowledge.targets.discard}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
