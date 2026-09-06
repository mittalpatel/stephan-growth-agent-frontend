'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import HeaderOne from '@/components/header/HeaderOne';
import Sidebar from '@/components/sidebar/Sidebar';
import RestrictedBreadcrumb from '@/components/common/RestrictedBreadcrumb';
import { PageTransition } from '@/components/motion/PageTransition';
import { useRealtimeSocket } from '@/hooks/useRealtimeSocket';
import { t } from '@/locales';

/**
 * The app shell: a full-height sidebar rail (its own scroll region, pinned
 * via `sticky` on desktop) beside a content column whose topbar is `sticky`
 * to that column rather than spanning the whole viewport — the `ai-agents-platform`
 * shell shape, in place of the header-spans-everything layout this replaced.
 * The page scrolls as a whole; nothing here needs its own bounded-height
 * scroll region.
 */
export default function LayoutWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  // Mounted here, not on the Active Sessions page or the notification bell
  // alone, so a revocation/notification push is discovered from any
  // authenticated page — this is the one client component every restricted
  // route renders through.
  useRealtimeSocket();

  return (
    <div className="bg-background flex min-h-screen">
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

      <div className="flex min-w-0 flex-1 flex-col">
        <HeaderOne onMenuClick={() => setSidebarOpen(true)} />
        <RestrictedBreadcrumb />
        <main className="flex-1">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col px-4 py-7">
            {/* Global page-entrance motion: keyed by route so every restricted page
                fades + lifts in on each navigation — wired once, here, instead of
                per page. Honours prefers-reduced-motion via PageTransition. */}
            <PageTransition key={pathname}>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
