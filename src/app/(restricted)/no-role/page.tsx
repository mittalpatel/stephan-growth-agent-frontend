'use client';

import Link from 'next/link';
import { useOrganization } from '@/app/(restricted)/context/OrganizationContext';
import { NO_ROLE_ROUTE } from '@/lib/helper';
import { t } from '@/locales';

export default function NoRolePage(): React.JSX.Element {
  const { organization } = useOrganization();
  // Distinct from "has an org but no role in it" (the administrator-contact case
  // below): a null organization means the account belongs nowhere yet, and the
  // fix is creating or joining one, not waiting on an admin.
  const isOrgLess = organization === null;

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <span className="border-brand-accent/20 bg-brand-accent/10 text-foreground inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold uppercase">
        {t.errors.noRole.badge}
      </span>
      <div className="max-w-xl space-y-4">
        <h1 className="text-3xl font-normal text-foreground md:text-4xl">
          {isOrgLess ? t.errors.noRole.orgLessTitle : t.errors.noRole.title}
        </h1>
        <p className="text-base text-muted-foreground md:text-lg">
          {isOrgLess ? t.errors.noRole.orgLessDescription : t.errors.noRole.description}
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        {isOrgLess ? (
          <>
            <Link
              href="/organization/new"
              className="bg-primary text-primary-foreground inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-semibold transition hover:opacity-90"
            >
              {t.errors.noRole.createOrganization}
            </Link>
            <Link
              href="/invites"
              className="inline-flex items-center justify-center rounded-full border border-input px-8 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              {t.errors.noRole.checkInvitations}
            </Link>
          </>
        ) : null}
        <button
          type="button"
          onClick={() => globalThis.location.reload()}
          className="inline-flex items-center justify-center rounded-full border border-input px-8 py-3 text-sm font-semibold text-foreground transition hover:bg-accent"
        >
          {t.errors.noRole.refresh}
        </button>
      </div>
      {isOrgLess ? null : (
        <p className="text-xs text-muted-foreground">
          {t.errors.noRole.hint.replace('{route}', NO_ROLE_ROUTE)}
        </p>
      )}
    </section>
  );
}
