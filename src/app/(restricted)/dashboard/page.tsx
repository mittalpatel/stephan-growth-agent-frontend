import type { Metadata } from 'next';

import { t } from '@/locales';

import { DashboardView } from './components/DashboardView';

export const metadata: Metadata = { title: t.dashboard.title };

export default function DashboardPage() {
  return <DashboardView />;
}
