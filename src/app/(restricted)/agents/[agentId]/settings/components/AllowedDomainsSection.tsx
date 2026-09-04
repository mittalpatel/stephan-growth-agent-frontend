'use client';

import { useState } from 'react';
import { Globe, X } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { RHFTextField } from '@/components/common/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { agentDomainCreateSchema, type AgentDomainCreateFormValues } from '@/lib/schemas/agent';
import { formatDate } from '@/lib/i18n';
import { t } from '@/locales';
import type { AllowedDomain } from '@/types/agent';

import { useAgentDomains } from '../hooks/useAgentDomains';

const copy = t.agents.settings.domains;

type Props = Readonly<{ agentId: string }>;

export function AllowedDomainsSection({ agentId }: Props) {
  const { domains, addDomain, isAdding, removeDomain, removingId } = useAgentDomains(agentId);
  const [confirming, setConfirming] = useState<AllowedDomain | null>(null);

  const form = useForm<AgentDomainCreateFormValues>({
    resolver: zodResolver(agentDomainCreateSchema),
    defaultValues: { hostname: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    const ok = await addDomain(values.hostname, form.setError);
    if (ok) form.reset();
  });

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-bold">{copy.title}</h2>
          <p className="text-muted-foreground mt-1 text-sm">{copy.description}</p>
        </div>

        <FormProvider {...form}>
          <form onSubmit={submit} className="flex items-end gap-2">
            <div className="flex-1">
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

        {domains.length === 0 ? (
          <p className="text-muted-foreground text-sm">{copy.empty}</p>
        ) : (
          <ul className="divide-border divide-y">
            {domains.map((domain) => (
              <li key={domain.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex items-center gap-2">
                  <Globe className="text-muted-foreground size-4" aria-hidden />
                  <span className="text-sm font-medium">{domain.hostname}</span>
                  <span className="text-muted-foreground text-xs">
                    {formatDate(domain.created_at)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={copy.remove}
                  disabled={removingId === domain.id}
                  onClick={() => setConfirming(domain)}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-muted-foreground text-xs">{copy.sessionOnlyNote}</p>
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
