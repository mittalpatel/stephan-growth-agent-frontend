'use client';

import { useAuthQuery } from '@/hooks/useAuthQuery';
import {
  organizationAuditDetailEndpoint,
  organizationAuditDetailKey,
} from '@/services/organizations';
import type { AuditEventDetail } from '@/services/organizations';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDateTime } from '@/lib/i18n';
import { t } from '@/locales';

const copy = t.organizations.audit.detail;

type Props = Readonly<{
  organizationId: string;
  eventId: string | null;
  onOpenChange: (open: boolean) => void;
}>;

/**
 * One audit entry in full: what changed, plus the context and IP the list omits.
 *
 * Fetched per row rather than carried in the list payload. `changes` and
 * `context` are unbounded JSON and `ip_address` is personal data — putting all
 * three in every page of 50 rows would bloat the response and spread the IP
 * across any cache or log that touches a list, to render four columns that never
 * show them.
 */
export default function AuditDetailSheet({ organizationId, eventId, onOpenChange }: Props) {
  const { data, isLoading, isError } = useAuthQuery<{ data: AuditEventDetail }>(
    organizationAuditDetailKey(organizationId, eventId ?? ''),
    organizationAuditDetailEndpoint(organizationId, eventId ?? ''),
    { enabled: Boolean(organizationId && eventId) }
  );

  const event = data?.data;

  return (
    <Sheet open={Boolean(eventId)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>
            {event ? event.event_label || event.action_label : copy.title}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-3 p-4" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-muted h-4 animate-pulse rounded" />
            ))}
          </div>
        ) : isError || !event ? (
          <p className="text-destructive p-4 text-sm">{copy.loadFailed}</p>
        ) : (
          <div className="space-y-6 p-4">
            <section>
              <h3 className="mb-2 text-sm font-medium">{copy.metadata}</h3>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <Row label={copy.when} value={formatDateTime(event.created_at)} />
                <Row label={copy.actor} value={event.actor_email} />
                <Row label={copy.event} value={event.event_label || event.action_label} />
                <Row label={copy.target} value={event.target_label} />
                {/* The raw type:id pair is kept, in monospace and secondary, for
                    the case the label cannot serve: correlating this entry with
                    a database row during an incident. */}
                <Row
                  label={copy.targetId}
                  value={
                    event.target_id ? `${event.target_type}:${event.target_id}` : event.target_type
                  }
                  mono
                />
                <Row label={copy.ipAddress} value={event.ip_address ?? ''} mono />
              </dl>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-medium">{copy.whatChanged}</h3>
              {Object.keys(event.changes ?? {}).length === 0 ? (
                <p className="text-muted-foreground text-sm">{copy.noChanges}</p>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(event.changes).map(([field, value]) => (
                    <li key={field} className="border-border rounded-md border p-3 text-sm">
                      <p className="font-mono text-xs font-medium">{field}</p>
                      <ChangeValue value={value} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {Object.keys(event.context ?? {}).length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-medium">{copy.context}</h3>
                <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
                  {JSON.stringify(event.context, null, 2)}
                </pre>
              </section>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono text-xs break-all' : 'break-words'}>
        {value || <span className="text-muted-foreground">{copy.notRecorded}</span>}
      </dd>
    </>
  );
}

/**
 * Renders one entry from `changes`.
 *
 * The backend's convention is `{"field": {"from": x, "to": y}}`, which is worth
 * rendering as a before/after pair rather than raw JSON — that diff is the whole
 * reason anyone opens this panel. Anything not matching the shape falls back to
 * JSON rather than guessing, because `changes` is deliberately free-form and a
 * wrong guess would silently hide a value.
 */
function ChangeValue({ value }: { value: unknown }) {
  const isFromTo =
    typeof value === 'object' && value !== null && ('from' in value || 'to' in value);

  if (!isFromTo) {
    return <pre className="mt-1 overflow-x-auto text-xs">{JSON.stringify(value, null, 2)}</pre>;
  }

  const { from, to } = value as { from?: unknown; to?: unknown };
  return (
    <div className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
      <span className="text-muted-foreground">{copy.from}</span>
      <span className="break-words line-through opacity-70">{stringify(from)}</span>
      <span className="text-muted-foreground">{copy.to}</span>
      <span className="break-words font-medium">{stringify(to)}</span>
    </div>
  );
}

function stringify(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  return typeof value === 'string' ? value : JSON.stringify(value);
}
