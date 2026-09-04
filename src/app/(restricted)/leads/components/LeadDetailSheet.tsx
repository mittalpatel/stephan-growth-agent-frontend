'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/i18n';
import { t } from '@/locales';

import { useLeadDetail } from '../hooks/useLeadDetail';

type Props = Readonly<{ leadId: string | null; onOpenChange: (open: boolean) => void }>;

export function LeadDetailSheet({ leadId, onOpenChange }: Props) {
  const { lead, isLoading } = useLeadDetail(leadId);

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
