import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth/authOptions';
import { DEFAULT_LANDING } from '@/constants/navItems';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (session) redirect(DEFAULT_LANDING);
  return <>{children}</>;
}
