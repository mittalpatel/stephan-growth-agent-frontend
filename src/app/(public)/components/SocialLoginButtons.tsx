'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { t } from '@/locales';
import { safeRedirect } from '@/lib/auth/safeRedirect';

/**
 * "Continue with <Provider>" buttons, one per name in `NEXT_PUBLIC_SOCIAL_PROVIDERS`
 * (empty by default — renders nothing). This is a *display* list only: the
 * actual providers NextAuth accepts are configured server-side in
 * `authOptions.ts` from the separate, secret-bearing `OIDC_<NAME>_*` vars. A
 * name here with no matching server config would fail at the provider's own
 * `/api/auth/signin/<id>` step, not silently — nothing to guard against here.
 *
 * Unlike the credentials form, this always does a real (`redirect: true`,
 * the default) full-page redirect — NextAuth's OAuth client needs to send the
 * browser to the IdP itself, so there is no `response.ok` to branch on the
 * way `useLoginForm.ts` does.
 */
export default function SocialLoginButtons() {
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl');

  const providerNames = (process.env.NEXT_PUBLIC_SOCIAL_PROVIDERS ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  if (providerNames.length === 0) return null;

  async function handleClick(name: string) {
    try {
      setPendingProvider(name);
      await signIn(name, { callbackUrl: safeRedirect(callbackUrl) });
    } catch {
      toast.error(t.auth.socialSignInError.replace('{provider}', name));
      setPendingProvider(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {providerNames.map((name) => (
          <Button
            key={name}
            type="button"
            variant="outline"
            className="h-11 w-full rounded-lg text-base font-medium"
            disabled={pendingProvider !== null}
            onClick={() => handleClick(name)}
          >
            {pendingProvider === name && <Spinner />}
            {t.auth.socialContinueWith.replace(
              '{provider}',
              name.charAt(0).toUpperCase() + name.slice(1)
            )}
          </Button>
        ))}
      </div>
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <span className="bg-border h-px flex-1" aria-hidden />
        {t.auth.socialDividerText}
        <span className="bg-border h-px flex-1" aria-hidden />
      </div>
    </div>
  );
}
