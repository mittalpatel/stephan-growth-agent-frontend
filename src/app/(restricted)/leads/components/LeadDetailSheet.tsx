'use client';

import { usePermissions } from '@/app/(restricted)/context/PermissionsContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/i18n';
import { LEAD_STATUS_TRANSITIONS } from '@/services/leads';
import { t } from '@/locales';
import type { LeadStatus } from '@/types/lead';

import { LEAD_STATUS_TONE } from '../leadStatusTone';
import { useLeadActions } from '../hooks/useLeadActions';
import { useLeadDetail } from '../hooks/useLeadDetail';

type Props = Readonly<{ leadId: string | null; onOpenChange: (open: boolean) => void }>;

export function LeadDetailSheet({ leadId, onOpenChange }: Props) {
  const { lead, isLoading } = useLeadDetail(leadId);
  const { changeStatus, isChangingStatus } = useLeadActions(leadId ?? '');
  const { can } = usePermissions();

  return (
    <Sheet open={Boolean(leadId)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t.leads.detail.title}</SheetTitle>
          {lead && <SheetDescription>{lead.name || lead.email}</SheetDescription>}
        </SheetHeader>

        {isLoading || !lead ? (
          <div className="space-y-3 px-4">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : (
          <div className="flex flex-col gap-5 px-4 pb-6">
            {/* The status is worth showing to everyone who can open this sheet;
                only the ability to change it is gated. `qualified` and
                `disqualified` are terminal, so they render read-only for
                everyone rather than as a picker with no options. */}
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                {t.leads.detail.statusLabel}
              </p>
              {can('lead', 'manage') && LEAD_STATUS_TRANSITIONS[lead.status].length > 0 ? (
                <Select
                  value={lead.status}
                  disabled={isChangingStatus}
                  onValueChange={(value) => changeStatus(value as LeadStatus)}
                >
                  <SelectTrigger className="w-full" aria-label={t.leads.detail.changeStatus}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={lead.status}>{t.leads.status[lead.status]}</SelectItem>
                    {LEAD_STATUS_TRANSITIONS[lead.status].map((status) => (
                      <SelectItem key={status} value={status}>
                        {t.leads.status[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <StatusBadge
                  label={t.leads.status[lead.status]}
                  tone={LEAD_STATUS_TONE[lead.status]}
                />
              )}
            </div>

            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {t.leads.detail.interestNote}
              </p>
              <p className="mt-1 text-sm">{lead.interest_note || '–'}</p>
            </div>

            <div>
              <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                {t.leads.detail.consentNotice}
              </p>
              <p className="mt-1 text-sm">{lead.consent_notice_version || '–'}</p>
            </div>

            <div>
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                {t.leads.detail.fieldsHeading}
              </p>
              {lead.fields.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t.leads.detail.fieldsEmpty}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {lead.fields.map((field) => (
                    <div
                      key={field.field_name}
                      className="border-border flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{field.field_name}</span>
                      <span className="text-muted-foreground text-xs">{field.purpose}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                {t.leads.detail.conversationHeading}
              </p>
              {lead.conversation ? (
                <p className="text-sm">
                  {lead.conversation.status}
                  <span className="text-muted-foreground ml-2 text-xs">
                    {formatDate(lead.conversation.created_at)}
                  </span>
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">{t.leads.detail.noConversation}</p>
              )}
            </div>

            <p className="text-muted-foreground text-xs">{formatDate(lead.created_at)}</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
