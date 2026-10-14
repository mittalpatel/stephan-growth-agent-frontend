import type { Metadata } from 'next';
import { UserProfileClient } from './components/UserProfileClient';
import { t } from '@/locales';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return {
    title: t.userProfile.title,
    description: t.userProfile.subtitle,
  };
}

const TABS = ['profile', 'security', 'sessions'] as const;

type Props = Readonly<{ searchParams: Promise<{ tab?: string }> }>;

/** `?tab=security` opens that tab, so a link can land on it (the dashboard's
 * two-step verification tip used to open Profile). */
export default async function UserProfilePage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const initialTab = TABS.find((name) => name === tab) ?? 'profile';
  return <UserProfileClient initialTab={initialTab} />;
}
