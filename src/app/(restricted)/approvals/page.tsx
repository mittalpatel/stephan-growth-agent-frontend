import type { Metadata } from 'next';

import { t } from '@/locales';

import { ApprovalsListView } from './components/ApprovalsListView';

export const metadata: Metadata = {
  title: t.approvals.title,
  description: t.approvals.description,
};

export default function ApprovalsPage() {
  return <ApprovalsListView />;
}
