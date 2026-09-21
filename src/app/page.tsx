import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/lib/auth/authOptions';
import { getPublicBranding, publicBrandingMetadata } from '@/lib/auth/getPublicBranding';
import LandingPage from '@/components/marketing/LandingPage';
import { DEFAULT_LANDING } from '@/constants/navItems';
import { t } from '@/locales';

export async function generateMetadata(): Promise<Metadata> {
  // Only the favicon: the landing title is the hero heading on the platform too, with no
  // name suffix, so a branded domain keeps that title rather than swapping in a bare name.
  const { icons } = publicBrandingMetadata(await getPublicBranding());
  return { title: t.marketing.hero.heading, icons };
}

/**
 * The public marketing homepage. `src/proxy.ts` already sends an
 * authenticated request straight to `DEFAULT_LANDING` before this renders;
 * this check is the same defense-in-depth `(public)/layout.tsx` applies to
 * `/login` and its siblings, not the only thing standing between a signed-in
 * user and this page.
 */
export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect(DEFAULT_LANDING);

  return <LandingPage branding={await getPublicBranding()} />;
}
