import type { Metadata } from 'next';

import { t } from '@/locales';

import { IntegrationsView } from './components/IntegrationsView';

export const metadata: Metadata = {
  title: t.integrations.title,
  description: t.integrations.description,
};

export default function IntegrationsPage() {
  return <IntegrationsView />;
}
