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

export default function UserProfilePage() {
  return <UserProfileClient />;
}
