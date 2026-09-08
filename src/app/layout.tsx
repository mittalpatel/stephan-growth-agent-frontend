import type { Metadata } from 'next';
import { JetBrains_Mono, Poppins, Work_Sans } from 'next/font/google';
import { headers } from 'next/headers';
import { Toaster } from 'sonner';

import { DEFAULT_LANGUAGE } from '@/config/language';
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
// Rebranding means changing these three lines and nothing else.
//
// Poppins is the display face, used for headings and metric values only (see
// `--font-display` in globals.css); Work Sans carries body and all UI text;
// JetBrains Mono carries labels, CTAs and data — the YB Inspire brand system's
// own three-family split (brandbook v1.0, p.16). Weights are pinned to the
// ones the design actually uses rather than shipping the full variable range.
// Poppins has no variable-font axis on Google Fonts, so its weight array is
// required rather than a nicety — omitting it is a build error. Mono gains 700
// here, which the brand's capsule CTAs and labels need and the previous theme
// never used.
const workSans = Work_Sans({
  variable: '--font-work-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});
const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});
const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: { default: t.common.appName, template: `%s | ${t.common.appName}` },
  description: t.common.appDescription,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // `proxy.ts` forwards the per-request CSP nonce as `x-nonce` so any inline
  // script rendered from a server component can be allow-listed under the
  // strict-dynamic policy. next-themes injects its own inline script (to set
  // the theme class before paint, avoiding a flash of the wrong theme) —
  // without this it silently fails under CSP and every load shows a flash
  // of the SSR default ("light") before the client-side effect corrects it.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
    <html
      // Driven by the language config, so adding a locale updates the document
      // language (and therefore screen-reader pronunciation and hyphenation)
      // without touching this file.
      lang={DEFAULT_LANGUAGE}
      className={`${workSans.variable} ${poppins.variable} ${jetbrainsMono.variable} h-full`}
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
