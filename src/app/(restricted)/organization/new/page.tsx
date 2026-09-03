import type { Metadata } from 'next';
import CreateOrganizationView from './components/CreateOrganizationView';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.organizations.create.title };

export default function CreateOrganizationPage() {
  return <CreateOrganizationView />;
}
