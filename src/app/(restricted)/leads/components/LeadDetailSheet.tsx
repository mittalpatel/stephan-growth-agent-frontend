'use client';

import type { ReactNode } from 'react';
import { Mail, MessageSquare, Phone } from 'lucide-react';

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
import { format, formatDate, formatDateTime } from '@/lib/i18n';
import { CONVERSATION_STATUS_VALUES } from '@/services/conversations';
import { LEAD_STATUS_TRANSITIONS } from '@/services/leads';
import { t } from '@/locales';
import type { ConversationStatus } from '@/types/conversation';
import type { LeadStatus } from '@/types/lead';

import { LEAD_STATUS_TONE } from '../leadStatusTone';
import { QUALIFICATION_OUTCOME_TONE } from '../qualificationOutcomeTone';
import { useLeadActions } from '../hooks/useLeadActions';
import { useLeadDetail } from '../hooks/useLeadDetail';

type Props = Readonly<{ leadId: string | null; onOpenChange: (open: boolean) => void }>;

const copy = t.leads.detail;

/** `LeadConversationSummary.status` is typed as a bare string by the
 * serializer, so narrow before using it as a locale key. */
function isConversationStatus(value: string): value is ConversationStatus {
  return (CONVERSATION_STATUS_VALUES as readonly string[]).includes(value);
}

/** A lead field key (`interest_note`) as a label, where one exists. */
function fieldLabel(key: string): string {
  const labels: Record<string, string> = t.agents.detail.draft.qualifiableField;
  return labels[key] ?? key;
}

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section className="border-border space-y-2 border-t pt-4">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function LeadDetailSheet({ leadId, onOpenChange }: Props) {
  const { lead, isLoading } = useLeadDetail(leadId);
  const { changeStatus, isChangingStatus } = useLeadActions(leadId ?? '');
  const { can } = usePermissions();

  return (
    <Sheet open={Boolean(leadId)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{lead ? lead.name || lead.email : copy.title}</SheetTitle>
          {lead && (
            <SheetDescription>
              {format(copy.capturedAt, { date: formatDateTime(lead.created_at) })}
            </SheetDescription>
          )}
        </SheetHeader>

        {isLoading || !lead ? (
          <div className="space-y-4 px-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4 pb-6">
            <ul className="bg-muted/40 border-border space-y-2 rounded-lg border p-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="text-muted-foreground size-4 shrink-0" aria-hidden />
                <a
                  href={`mailto:${lead.email}`}
                  className="truncate underline-offset-2 hover:underline"
                >
                  {lead.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="text-muted-foreground size-4 shrink-0" aria-hidden />
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`} className="underline-offset-2 hover:underline">
                    {lead.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{copy.noPhone}</span>
                )}
              </li>
            </ul>

            {/* The status is worth showing to everyone who can open this sheet;
                only the ability to change it is gated. `qualified` and
                `disqualified` are terminal, so they render read-only for
                everyone rather than as a picker with no options. */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {copy.statusLabel}
                </p>
                {can('lead', 'manage') && LEAD_STATUS_TRANSITIONS[lead.status].length > 0 ? (
                  <Select
                    value={lead.status}
                    disabled={isChangingStatus}
                    onValueChange={(value) => changeStatus(value as LeadStatus)}
                  >
                    <SelectTrigger className="w-full" aria-label={copy.changeStatus}>
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
                  control because both vocabularies contain "Qualified" and
                  they are not the same claim. */}
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                  {copy.qualificationLabel}
                </p>
                <StatusBadge
                  label={t.leads.qualificationOutcome[lead.qualification_outcome]}
                  tone={QUALIFICATION_OUTCOME_TONE[lead.qualification_outcome]}
                />
              </div>
            </div>
            <p className="text-muted-foreground -mt-2 text-xs">{copy.qualificationHelp}</p>

            <Section title={copy.interestNote}>
              <p className={lead.interest_note ? 'text-sm' : 'text-muted-foreground text-sm'}>
                {lead.interest_note || copy.notProvided}
              </p>
            </Section>

            <Section title={copy.qualificationHeading}>
              {lead.qualification_results.length === 0 ? (
                <p className="text-muted-foreground text-sm">{copy.qualificationEmpty}</p>
              ) : (
                <ol className="flex flex-col gap-2">
                  {/* No id on the serializer, so the key is timestamp plus
                      position. Safe: append-only server-side and never
                      reordered or filtered client-side. `score` is a raw point
                      total; the rule snapshot it was counted against is not
                      serialized, so there is no percentage to show. */}
                  {lead.qualification_results.map((result, index) => (
                    <li
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
                      <p className="text-sm">{format(copy.scoreLabel, { score: result.score })}</p>
                      {result.missing_required_fields.length > 0 && (
                        <p className="text-muted-foreground text-xs">
                          {format(copy.missingFieldsLabel, {
                            fields: result.missing_required_fields.map(fieldLabel).join(', '),
                          })}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </Section>

            <Section title={copy.fieldsHeading}>
              {lead.fields.length === 0 ? (
                <p className="text-muted-foreground text-sm">{copy.fieldsEmpty}</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {lead.fields.map((field) => (
                    <li
                      key={field.field_name}
                      className="border-border flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                    >
                      <span className="font-medium">{fieldLabel(field.field_name)}</span>
                      <span className="text-muted-foreground text-right text-xs">
                        {field.purpose}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={copy.conversationHeading}>
              {lead.conversation ? (
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="text-muted-foreground size-4" aria-hidden />
                  <span>
                    {isConversationStatus(lead.conversation.status)
                      ? t.conversations.status[lead.conversation.status]
                      : lead.conversation.status}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {format(copy.startedAt, { date: formatDate(lead.conversation.created_at) })}
                  </span>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{copy.noConversation}</p>
              )}
            </Section>

            <Section title={copy.consentNotice}>
              <p className="text-sm">
                {lead.consent_given ? t.leads.consent.given : t.leads.consent.notGiven}
                {lead.consent_notice_version && (
                  <span className="text-muted-foreground ml-2 text-xs">
                    {format(copy.consentVersion, { version: lead.consent_notice_version })}
                  </span>
                )}
              </p>
            </Section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
