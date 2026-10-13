import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth/authOptions';
import { DEFAULT_LANDING } from '@/constants/navItems';
import { t } from '@/locales';

import StartImpersonationForm from './components/StartImpersonationForm';
import SessionsTable from './components/SessionsTable';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return {
    title: t.organizations.impersonation.title,
    description: t.organizations.impersonation.description,
  };
}

/**
 * The platform-admin surface, gated on `is_superuser` rather than a permission
 * code — deliberately outside per-org RBAC, or an organization Owner could mint a
 * role that grants impersonation over other tenants.
 *
 * Checked here on the server as well as in the nav and the proxy, because those
 * two only decide what renders. The backend re-checks it on every endpoint
 * regardless; this is what keeps a non-admin who guesses the URL from seeing a
 * form that would only ever 403.
 */
export default async function ImpersonationAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.is_superuser) redirect(DEFAULT_LANDING);

  return (
    <div className="space-y-6">
      <StartImpersonationForm />
      <SessionsTable />
    </div>
  );
}
