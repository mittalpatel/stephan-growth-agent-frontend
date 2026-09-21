'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import HeaderOne from '@/components/header/HeaderOne';
import Sidebar from '@/components/sidebar/Sidebar';
import RestrictedBreadcrumb from '@/components/common/RestrictedBreadcrumb';
import { PageTransition } from '@/components/motion/PageTransition';
import { t } from '@/locales';
import { RealtimeProvider } from '@/providers/RealtimeProvider';
import { useOrgBranding } from '@/app/(restricted)/hooks/useOrgBranding';
import { PLATFORM_FAVICON_HREF } from '@/lib/constants/brandAssets';

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
  const { faviconUrl, isBrandLoaded } = useOrgBranding();

  // Keep the tab icon in step with the organization's branding while the app shell is
  // mounted. The server already renders the right icon (the restricted layout's
  // `generateMetadata`); this is what updates it live when the Brand tab saves or
  // clears one, with no reload.
  //
  // Two details this got wrong before. Any other icon link is detached rather than left
  // alongside: a second `<link rel="icon">` only offers the browser a choice, and Chrome
  // kept the platform `.ico` (it declares `sizes="256x256"` against an unsized PNG), so
  // a saved favicon never appeared. And clearing a favicon has to put the platform icon
  // back explicitly, because the link this displaced is the server-rendered organization
  // one, which is exactly the icon that just stopped being correct.
  //
  // Nothing happens until the summary has actually loaded, so a slow response cannot
  // flash the platform icon over the correct server-rendered one. Same CSP `img-src`
  // caveat as the sidebar logo: a blocked URL leaves the browser showing no icon change.
  useEffect(() => {
    if (!isBrandLoaded) return;

    const displaced = [...document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')].map(
      (node) => ({ node, parent: node.parentNode, before: node.nextSibling })
    );
    displaced.forEach(({ node }) => node.remove());

    const link = document.createElement('link');
    link.rel = 'icon';
    link.href = faviconUrl ?? PLATFORM_FAVICON_HREF;
    document.head.appendChild(link);

    return () => {
      link.remove();
      displaced.forEach(({ node, parent, before }) => parent?.insertBefore(node, before));
    };
  }, [faviconUrl, isBrandLoaded]);

  // The realtime socket is mounted here, not on the Active Sessions page or the
  // notification bell alone, so a revocation/notification push is discovered
  // from any authenticated page: this is the one client component every
  // restricted route renders through.
  return (
    <RealtimeProvider>
      <div className="bg-background flex min-h-screen">
        {/* Mobile backdrop */}
        {sidebarOpen && (
          <button
            type="button"
            aria-label={t.common.closeMenu}
            className="fixed inset-0 z-40 w-full bg-foreground/50 lg:hidden"
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
    </RealtimeProvider>
  );
}
