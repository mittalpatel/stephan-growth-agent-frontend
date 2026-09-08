'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { clearQueryCache } from '@/lib/queryClientRef';
import { t } from '@/locales';
import type { ImpersonationSummary } from '@/types/next-auth';

const copy = t.organizations.impersonation.banner;

/**
 * The always-visible reminder that you are not yourself right now.
 *
 * This is the highest-value control in the whole feature and the cheapest to
 * build. Every other safeguard bounds what a session *can* do; this one addresses
 * what actually goes wrong in practice — an engineer forgetting which tab is which
 * and acting on a customer's data believing it is their own. Not dismissible, and
 * deliberately loud.
 *
 * The countdown is not decoration either. A visible timer is what makes a
 * time-boxed grant feel time-boxed; without it "ends in 4 minutes" is a surprise
 * rather than an expectation.
 */
export default function ImpersonationBanner({ session }: { session: ImpersonationSummary }) {
  const router = useRouter();
  const [isEnding, setIsEnding] = useState(false);
  const [remaining, setRemaining] = useState(() => msUntil(session.expires_at));

  useEffect(() => {
    const id = setInterval(() => setRemaining(msUntil(session.expires_at)), 1000);
    return () => clearInterval(id);
  }, [session.expires_at]);

  const end = useCallback(async () => {
    setIsEnding(true);
    try {
      await axios.post('/api/auth/impersonation-end');
      // Every cached query holds the customer's data, keyed without any notion of
      // whose session fetched it. Leaving it would render their rows under the
      // admin's own restored identity — the exact confusion this banner exists to
      // prevent, produced at the moment of leaving.
      clearQueryCache();
      router.refresh();
    } catch {
      toast.error(copy.endFailed);
      setIsEnding(false);
    }
  }, [router]);

  const expired = remaining <= 0;

  return (
    <div
      role="status"
      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-amber-500 bg-amber-500/15 px-4 py-2 text-sm"
    >
      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" aria-hidden />
      <span>
        {copy.actingAs} <strong>{session.target_email}</strong>
        {session.organization ? (
          <>
            {' '}
            {copy.inOrganization} <strong>{session.organization.name}</strong>
          </>
        ) : null}
      </span>

      <span
        className={
          session.write_enabled
            ? 'rounded-full bg-red-600/15 px-2 py-0.5 text-xs font-medium text-red-700'
            : 'rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-medium'
        }
      >
        {session.write_enabled ? copy.writesEnabled : copy.readOnly}
      </span>

      <span className="text-muted-foreground tabular-nums">
        {expired ? copy.expired : `${copy.expiresIn} ${formatRemaining(remaining)}`}
      </span>

      <Button
        size="sm"
        variant="outline"
        className="ml-auto"
        onClick={() => void end()}
        disabled={isEnding}
      >
        {isEnding ? copy.ending : copy.end}
      </Button>
    </div>
  );
}

function msUntil(iso: string): number {
  return new Date(iso).getTime() - Date.now();
}

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
