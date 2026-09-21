import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { authOptions } from '@/lib/auth/authOptions';
import { getPublicBranding, publicBrandingMetadata } from '@/lib/auth/getPublicBranding';
import { PublicBrandingProvider } from '@/providers/PublicBrandingProvider';
import { DEFAULT_LANDING } from '@/constants/navItems';

export async function generateMetadata(): Promise<Metadata> {
  return publicBrandingMetadata(await getPublicBranding());
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (session) redirect(DEFAULT_LANDING);
  return (
    <PublicBrandingProvider branding={await getPublicBranding()}>{children}</PublicBrandingProvider>
  );
}
