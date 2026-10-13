import type { Metadata } from 'next';

import { t } from '@/locales';

import { LeadsListView } from './components/LeadsListView';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.leads.title, description: t.leads.description };
}

export default function LeadsPage() {
  return <LeadsListView />;
}
