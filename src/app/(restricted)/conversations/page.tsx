import type { Metadata } from 'next';

import { t } from '@/locales';

import { ConversationsListView } from './components/ConversationsListView';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return {
    title: t.conversations.title,
    description: t.conversations.description,
  };
}

export default function ConversationsPage() {
  return <ConversationsListView />;
}
