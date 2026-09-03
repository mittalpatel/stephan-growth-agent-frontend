import type { Metadata } from 'next';
import { UserProfileClient } from './components/UserProfileClient';
import { t } from '@/locales';

export const metadata: Metadata = {
  title: t.userProfile.title,
  description: t.userProfile.subtitle,
};

export default function UserProfilePage() {
  return <UserProfileClient />;
}
