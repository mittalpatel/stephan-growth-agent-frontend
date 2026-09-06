import type { Metadata } from 'next';

import { t } from '@/locales';

import { DataDeleteConfirmView } from './components/DataDeleteConfirmView';

export const metadata: Metadata = { title: t.organizations.settingsTabs.data.deleteConfirmTitle };

export default function DataDeleteConfirmPage() {
  return <DataDeleteConfirmView />;
}
