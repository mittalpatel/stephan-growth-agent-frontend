import type { Metadata } from 'next';

import { t } from '@/locales';

import { ApprovalsListView } from './components/ApprovalsListView';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return {
    title: t.approvals.title,
    description: t.approvals.description,
  };
}

export default function ApprovalsPage() {
  return <ApprovalsListView />;
}
