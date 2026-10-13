import type { Metadata } from 'next';

import { t } from '@/locales';

import { BillingView } from './components/BillingView';

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return { title: t.billing.title, description: t.billing.description };
}

export default function BillingPage() {
  return <BillingView />;
}
