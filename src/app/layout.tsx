import type { Metadata } from 'next';

import { PLATFORM_FAVICON_HREF, PLATFORM_APPLE_ICON_HREF } from '@/lib/constants/brandAssets';
import { Inter, JetBrains_Mono, Poppins } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import { Toaster } from 'sonner';

import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE, isLanguage } from '@/config/language';
import { t } from '@/locales';
import { ConfirmProvider } from '@/providers/ConfirmProvider';
import LoaderProvider from '@/providers/LoaderProvider';
import MotionProvider from '@/providers/MotionProvider';
import QueryProvider from '@/providers/QueryProvider';
import SessionProvider from '@/providers/SessionProvider';
import ThemeProvider from '@/providers/ThemeProvider';

import './globals.css';

// Three families, all self-hosted by next/font — no external request, no
// render-blocking stylesheet, and no layout shift from a late font swap.
// Rebranding means changing these lines and nothing else.
//
// Inter is the Growth Agents face for body, UI and headings alike (see
// `--font-sans` and `--font-display` in globals.css); weight, not family,
// carries the hierarchy: 700 headings, 600 sub-heads, 500 buttons, 400 body.
// Poppins 500 is the site's accent face for short card titles only
// (`font-accent`), never body text. JetBrains Mono carries numerics and data.
// Weights are pinned to the ones the design actually uses rather than
// shipping the full variable range; Poppins has no variable axis, so its
// weight array is required.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});
const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['500'],
});
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export function generateMetadata(): Metadata {
  // A function, not a constant: built per request, in the viewer's language.
  return {
    title: { default: t.common.appName, template: `%s | ${t.common.appName}` },
    description: t.common.appDescription,
    // Declared here rather than as `src/app/favicon.ico`. The file convention emits its
    // own `<link rel="icon">` on every route and cannot be overridden per segment ("favicons
    // can only be set in the root /app segment" — Next's app-icons reference), so a tenant
    // favicon set by the restricted layout only ever became a second link the browser chose
    // between. As metadata it is an ordinary field a deeper segment can replace. The file
    // now lives in `public/`, which is why the href has no build hash.
    icons: { icon: PLATFORM_FAVICON_HREF, apple: PLATFORM_APPLE_ICON_HREF },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // `proxy.ts` forwards the per-request CSP nonce as `x-nonce` so any inline
  // script rendered from a server component can be allow-listed under the
  // strict-dynamic policy. next-themes injects its own inline script (to set
  // the theme class before paint, avoiding a flash of the wrong theme) —
  // without this it silently fails under CSP and every load shows a flash
  // of the SSR default ("light") before the client-side effect corrects it.
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  // The viewer's language. `<html lang>` is also what the browser-side
  // catalog reads (`getLanguage()`), so client components hydrate in the
  // same language the server rendered.
  const cookieLanguage = (await cookies()).get(LANGUAGE_COOKIE)?.value;
  const language = isLanguage(cookieLanguage) ? cookieLanguage : DEFAULT_LANGUAGE;

  return (
    <html
      // Also drives screen-reader pronunciation and hyphenation.
      lang={language}
      className={`${inter.variable} ${poppins.variable} ${jetbrainsMono.variable} h-full`}
      // next-themes writes `class="dark"` here before paint. Without this
      // React logs a hydration mismatch on every load, and the real warnings
      // get lost in the noise.
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <SessionProvider>
          <QueryProvider>
            <ThemeProvider nonce={nonce}>
              <LoaderProvider>
                <ConfirmProvider>
                  <MotionProvider>
                    {children}
                    <Toaster richColors position="top-right" closeButton />
                  </MotionProvider>
                </ConfirmProvider>
              </LoaderProvider>
            </ThemeProvider>
          </QueryProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
