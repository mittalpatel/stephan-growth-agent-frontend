import type { Metadata } from 'next';

import { t } from '@/locales';

import { AgentsListView } from './components/AgentsListView';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.agents.title, description: t.agents.description };
}

export default function AgentsPage() {
  return <AgentsListView />;
}
