'use client';

import { Mail, Monitor, Shield, ShieldCheck, User } from 'lucide-react';

import { useUserProfile } from '@/hooks/useUserProfile';
import { MfaSection } from './MfaSection';
import { SessionsSection } from './SessionsSection';
import { PersonalInfoForm } from './PersonalInfoForm';
import { ChangePasswordForm } from './ChangePasswordForm';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { t } from '@/locales';

const copy = t.userProfile;

function initialsOf(name: string, email: string): string {
  const source = name?.trim() || email.split('@')[0] || '?';
  return source
    .split(/[\s.]+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Thin shell: fetches the profile (for the loading/error/empty states and the
 * hero) and lays out the Profile / Security / Sessions tabs. Every mutation
 * lives in a colocated hook (`useProfileForm`, `useChangePasswordForm`) owned
 * by the presenter that uses it — this component renders no forms itself.
 */
export function UserProfileClient() {
  const { data: profile, isLoading, error } = useUserProfile();

  if (isLoading)
    return <div className="p-6 text-sm text-muted-foreground">{copy.loadingMessage}</div>;
  if (error) return <div className="p-6 text-sm text-error">{copy.loadError}</div>;
  if (!profile)
    return <div className="p-6 text-sm text-muted-foreground">{copy.noProfileData}</div>;

  const initials = initialsOf(profile.full_name, profile.email);

  return (
    // LayoutWrapper already applies the page gutter and max width; padding again
    // here pushed this page's content off the left edge every other page shares.
    <div className="flex flex-col gap-6">
      <PageHeader title={copy.title} description={copy.subtitle} />

      <Tabs defaultValue="profile" orientation="vertical" className="items-start">
        <TabsList className="border-input bg-card w-full shrink-0 gap-1 rounded-lg border p-2 sm:w-56">
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground justify-start gap-2 rounded-md px-3 py-2 font-medium"
          >
            <User className="size-4" aria-hidden />
            {copy.tabs.profile}
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground justify-start gap-2 rounded-md px-3 py-2 font-medium"
          >
            <Shield className="size-4" aria-hidden />
            {copy.tabs.security}
          </TabsTrigger>
          <TabsTrigger
            value="sessions"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground justify-start gap-2 rounded-md px-3 py-2 font-medium"
          >
            <Monitor className="size-4" aria-hidden />
            {copy.tabs.sessions}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="flex flex-col gap-6">
          {/* Profile hero — only shown on the Profile tab, not Security/Sessions. */}
          <section className="elevated p-6 sm:p-7">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-lg">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-normal text-card-foreground">
                  {profile.full_name || profile.email.split('@')[0]}
                </h2>
                {profile.role?.name && (
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary-strong">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {profile.role.name}
                  </span>
                )}
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  {profile.email}
                </p>
              </div>
            </div>
          </section>

          <PersonalInfoForm profile={profile} />
        </TabsContent>

        <TabsContent value="security" className="flex flex-col gap-6">
          <ChangePasswordForm profile={profile} />

          {/* Shown for every account, LOCAL and EXTERNAL alike. TOTP MFA is a
              second factor layered on top of however the *first* factor is
              proven — password (login_local) or a social-login provider
              (OAuthService.exchange_id_token / exchange_github_token) — and the
              backend enforces the step-up identically either way, so there's no
              reason to withhold the ability to enable it from an EXTERNAL
              account. (It used to be LOCAL-only, back when login_local was the
              only path that ever issued an MFA challenge — that stopped being
              true once social login started checking MfaService.is_enabled too.) */}
          <MfaSection />
        </TabsContent>

        <TabsContent value="sessions">
          {/* Sessions are JWT refresh tokens, issued for LOCAL and EXTERNAL logins
              alike — unlike MFA, this applies to every account. */}
          <SessionsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
