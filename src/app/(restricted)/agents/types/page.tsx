import type { Metadata } from 'next';

import { t } from '@/locales';

import { AgentTypesView } from './components/AgentTypesView';

export const metadata: Metadata = {
  title: t.agents.types.title,
  description: t.agents.types.description,
};

export default function AgentTypesPage() {
  return <AgentTypesView />;
}
