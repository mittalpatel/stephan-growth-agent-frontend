'use client';

import { useRouter } from 'next/navigation';
import { t } from '@/locales';

export function NotFoundBackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/80 hover:shadow-lg"
    >
      {t.errors.goBack}
    </button>
  );
}
