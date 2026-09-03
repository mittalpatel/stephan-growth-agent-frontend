'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import HeaderOne from '@/components/header/HeaderOne';
import Sidebar from '@/components/sidebar/Sidebar';
import RestrictedBreadcrumb from '@/components/common/RestrictedBreadcrumb';
import { PageTransition } from '@/components/motion/PageTransition';
import { useRealtimeSocket } from '@/hooks/useRealtimeSocket';
import { t } from '@/locales';

export default function LayoutWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  // Mounted here, not on the Active Sessions page or the notification bell
  // alone, so a revocation/notification push is discovered from any
  // authenticated page — this is the one client component every restricted
  // route renders through.
  useRealtimeSocket();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <HeaderOne onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label={t.common.closeMenu}
            className="fixed inset-0 z-40 w-full bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <RestrictedBreadcrumb />
          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-background">
            {/* This inner div is itself still a `flex-1`/`min-h-0` flex item (needed so
                pages using h-full, e.g. /chatbot, get a definite-height ancestor chain),
                so `padding-bottom` on it hits the same Chromium bug as `main` would: a
                flex container's bottom padding isn't included in the scrollable area
                once its content overflows. Top/side padding is fine as padding (they
                aren't affected); the bottom gap is a real spacer element below instead,
                since an actual box always contributes to scroll height regardless of
                the flex-1/min-h-0 quirk on its sibling. */}
            <div className="flex min-h-0 flex-1 flex-col px-4 pt-4 sm:px-6 sm:pt-6 md:px-10">
              {/* Global page-entrance motion: keyed by route so every restricted page
                  fades + lifts in on each navigation — wired once, here, instead of
                  per page. Honours prefers-reduced-motion via PageTransition.
                  `flex-1 min-h-0` keeps a definite-height chain so pages that fill the
                  viewport (e.g. /chatbot via h-full) size correctly instead of
                  collapsing to content height. */}
              <PageTransition key={pathname} className="min-h-0 flex-1">
                {children}
              </PageTransition>
              <div aria-hidden className="h-4 shrink-0 sm:h-6" />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
