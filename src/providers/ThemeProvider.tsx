'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export default function ThemeProvider({
  children,
  nonce,
}: {
  children: React.ReactNode;
  nonce?: string;
}) {
  return (
    // YB Inspire is dark-first: the brand's main ground is bleu petrole, not a
    // shade of white, so dark is the canonical theme and the default rather
    // than a derived alternative. Light is kept working (see globals.css) but
    // is the secondary expression. `enableSystem` stays off so the OS
    // preference never overrides that choice.
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      nonce={nonce}
    >
      {children}
    </NextThemesProvider>
  );
}
