import type { Metadata } from 'next';

import { t } from '@/locales';

import { ConversationsListView } from './components/ConversationsListView';

export const metadata: Metadata = {
  title: t.conversations.title,
  description: t.conversations.description,
};

export default function ConversationsPage() {
  return <ConversationsListView />;
}
