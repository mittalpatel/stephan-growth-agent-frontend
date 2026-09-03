import type { Metadata } from 'next';

import { t } from '@/locales';

import { AnalyticsView } from './components/AnalyticsView';

export const metadata: Metadata = {
  title: t.analytics.title,
  description: t.analytics.description,
};

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
