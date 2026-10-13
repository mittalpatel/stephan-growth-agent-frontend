import type { Metadata } from 'next';
import CreateOrganizationView from './components/CreateOrganizationView';
import { t } from '@/locales';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.organizations.create.title };
}

export default function CreateOrganizationPage() {
  return <CreateOrganizationView />;
}
