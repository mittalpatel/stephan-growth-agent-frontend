import type { Metadata } from 'next';

import { t } from '@/locales';

import { DashboardView } from './components/DashboardView';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.dashboard.title };
}

export default function DashboardPage() {
  return <DashboardView />;
}
