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
import { format, formatDate } from '@/lib/i18n';
import { LEAD_STATUS_TRANSITIONS } from '@/services/leads';
import { t } from '@/locales';
import type { LeadStatus } from '@/types/lead';

import { LEAD_STATUS_TONE } from '../leadStatusTone';
import { QUALIFICATION_OUTCOME_TONE } from '../qualificationOutcomeTone';
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

            {/* The rules-computed tier, kept visually apart from the status
                control above because both vocabularies contain "Qualified"
                and they are not the same claim. `score` is a raw point
                total: the serializer omits the `rule_snapshot` its weights
                came from, so there is no denominator to show a percentage
                against. */}
            <div>
              <p className="text-muted-foreground mb-1 text-xs font-semibold tracking-wider uppercase">
                {t.leads.detail.qualificationLabel}
              </p>
              <StatusBadge
                label={t.leads.qualificationOutcome[lead.qualification_outcome]}
                tone={QUALIFICATION_OUTCOME_TONE[lead.qualification_outcome]}
              />
              <p className="text-muted-foreground mt-1.5 text-xs">
                {t.leads.detail.qualificationHelp}
              </p>
            </div>

            <div>
              <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
                {t.leads.detail.qualificationHeading}
              </p>
              {lead.qualification_results.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t.leads.detail.qualificationEmpty}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* The serializer exposes no id, so the key falls back to
                      the timestamp plus position. Safe here: this list is
                      append-only server-side and never reordered or filtered
                      client-side. */}
                  {lead.qualification_results.map((result, index) => (
                    <div
                      key={`${result.created_at}-${index}`}
                      className="border-border flex flex-col gap-1 rounded-md border px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge
                          label={t.leads.qualificationOutcome[result.outcome]}
                          tone={QUALIFICATION_OUTCOME_TONE[result.outcome]}
                        />
                        <span className="text-muted-foreground text-xs">
                          {formatDate(result.created_at)}
                        </span>
                      </div>
                      <p className="text-sm">
                        {format(t.leads.detail.scoreLabel, { score: result.score })}
                      </p>
                      {result.missing_required_fields.length > 0 && (
                        <p className="text-muted-foreground text-xs">
                          {format(t.leads.detail.missingFieldsLabel, {
                            fields: result.missing_required_fields.join(', '),
                          })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
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
