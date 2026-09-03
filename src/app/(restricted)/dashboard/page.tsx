import type { Metadata } from 'next';
import { t } from '@/locales';

export const metadata: Metadata = { title: t.dashboard.title };

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-normal">{t.dashboard.title}</h1>
      <p className="mt-2 text-muted-foreground">{t.dashboard.welcome}</p>
    </div>
  );
}
