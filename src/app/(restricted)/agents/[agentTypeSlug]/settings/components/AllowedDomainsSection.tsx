'use client';

import { useState } from 'react';
import { Globe, X } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RHFTextField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { agentDomainCreateSchema, type AgentDomainCreateFormValues } from '@/lib/schemas/agent';
import { format, formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import type { AllowedDomain } from '@/types/agent';

import { useAgentDomains } from '../hooks/useAgentDomains';

const copy = t.agents.settings.domains;

type Props = Readonly<{ agentId: string }>;

export function AllowedDomainsSection({ agentId }: Props) {
  const {
    domains,
    canManage,
    isLoading,
    isError,
    refetch,
    addDomain,
    isAdding,
    removeDomain,
    removingId,
  } = useAgentDomains(agentId);
  const [confirming, setConfirming] = useState<AllowedDomain | null>(null);

  const form = useForm<AgentDomainCreateFormValues>({
    resolver: zodResolver(agentDomainCreateSchema),
    defaultValues: { hostname: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    const ok = await addDomain(values.hostname, form.setError);
    if (ok) form.reset();
  });

  function renderList() {
    if (isLoading) return <Skeleton className="h-16 w-full" />;

    if (isError) {
      return (
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm">{copy.loadError}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t.buttons.tryAgain}
          </Button>
        </div>
      );
    }

    if (domains.length === 0) {
      return (
        <p className="border-border text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
          {copy.empty}
        </p>
      );
    }

    return (
      <ul className="border-border divide-border divide-y rounded-lg border">
        {domains.map((domain) => (
          <li key={domain.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-3">
              <Globe className="text-muted-foreground size-4 shrink-0" aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{domain.hostname}</p>
                <p className="text-muted-foreground text-xs">
                  {format(copy.addedAt, { date: formatDate(domain.created_at) })}
                </p>
              </div>
            </div>
            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={copy.remove}
                disabled={removingId === domain.id}
                onClick={() => setConfirming(domain)}
              >
                <X className="size-4" aria-hidden />
              </Button>
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold">{copy.title}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{copy.description}</p>
        </div>

        {canManage && (
          <FormProvider {...form}>
            <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
              <div className="min-w-48 flex-1">
                <RHFTextField<AgentDomainCreateFormValues>
                  name="hostname"
                  label={copy.hostnameLabel}
                  placeholder={copy.hostnamePlaceholder}
                />
              </div>
              <Button type="submit" disabled={isAdding}>
                {copy.add}
              </Button>
            </form>
          </FormProvider>
        )}

        {renderList()}
      </CardContent>

      <ConfirmDialog
        open={confirming !== null}
        destructive
        title={copy.removeConfirmTitle}
        message={copy.removeConfirmDescription}
        loading={removingId !== null}
        onConfirm={() => {
          if (confirming) void removeDomain(confirming.id);
          setConfirming(null);
        }}
        onOpenChange={(open) => {
          if (!open) setConfirming(null);
        }}
      />
    </Card>
  );
}
