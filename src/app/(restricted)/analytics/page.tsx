import type { Metadata } from 'next';

import { t } from '@/locales';

import { AnalyticsView } from './components/AnalyticsView';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return {
    title: t.analytics.title,
    description: t.analytics.description,
  };
}

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
