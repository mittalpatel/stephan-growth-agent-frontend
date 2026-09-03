import type { Metadata } from 'next';

import { t } from '@/locales';

import { LeadsListView } from './components/LeadsListView';

export const metadata: Metadata = { title: t.leads.title, description: t.leads.description };

export default function LeadsPage() {
  return <LeadsListView />;
}
