import type { Metadata } from 'next';

import { t } from '@/locales';

import { BillingView } from './components/BillingView';

export const metadata: Metadata = { title: t.billing.title, description: t.billing.description };

export default function BillingPage() {
  return <BillingView />;
}
