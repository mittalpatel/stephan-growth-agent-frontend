'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { usePathname } from 'next/navigation';

import NotificationBell from '@/app/(restricted)/components/NotificationBell';
import { getPageMeta } from '@/lib/pageMeta';
import { t } from '@/locales';

import ProfilePopup from './ProfilePopup';

export default function HeaderOne({ onMenuClick }: Readonly<{ onMenuClick?: () => void }>) {
  const pathname = usePathname();
  const { title, subtitle } = getPageMeta(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-[72px] shrink-0 items-center border-b border-border bg-background px-4 shadow-sm md:h-[92px] md:px-10">
      {/* Left: hamburger (mobile) + wordmark.

          A wordmark rather than an <Image>: a template that ships a placeholder
          logo gets a placeholder logo in production. Swap this Link's contents
          for your own <Image> when you brand the app. */}
      <div className="flex w-auto shrink-0 items-center gap-3 lg:w-48">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label={t.common.openMenu}
            className="flex items-center justify-center rounded-md p-2 text-foreground hover:bg-accent lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
          {t.common.appName}
        </Link>
      </div>

      {/* Center: always a flex-1 spacer; shows title/subtitle on sm+.
          h2/h3 (not h1 — the page body already has its own h1) for correct
          document structure; font-sans pins the body font explicitly so
          converting from <span> doesn't pull in the global h1-h6 heading
          rule (font-heading/Anton) and change how these render. */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {title && (
          <h2 className="hidden font-sans text-lg font-bold uppercase leading-tight text-primary sm:block">
            {title}
          </h2>
        )}
        {subtitle && (
          <h3 className="mt-0.5 hidden font-sans text-md font-medium leading-tight text-foreground sm:block">
            {subtitle}
          </h3>
        )}
      </div>

      {/* Right: divider (desktop only) + profile */}
      <div className="flex w-auto shrink-0 items-center justify-end gap-2 lg:w-48">
        <NotificationBell />
        <div className="hidden h-8 w-px bg-border sm:block" />
        <ProfilePopup />
      </div>
    </header>
  );
}
