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
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      nonce={nonce}
    >
      {children}
    </NextThemesProvider>
  );
}
