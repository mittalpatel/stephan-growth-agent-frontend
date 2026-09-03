import type { Metadata } from 'next';

import { t } from '@/locales';

import { AgentsListView } from './components/AgentsListView';

export const metadata: Metadata = { title: t.agents.title, description: t.agents.description };

export default function AgentsPage() {
  return <AgentsListView />;
}
