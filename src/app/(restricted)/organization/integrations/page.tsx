import type { Metadata } from 'next';

import { t } from '@/locales';

import { IntegrationsView } from './components/IntegrationsView';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return {
    title: t.integrations.title,
    description: t.integrations.description,
  };
}

export default function IntegrationsPage() {
  return <IntegrationsView />;
}
