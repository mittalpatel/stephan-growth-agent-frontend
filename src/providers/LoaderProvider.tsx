'use client';

import NextTopLoader from 'nextjs-toploader';

export default function LoaderProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader color="var(--th-loader)" showSpinner={false} />
      {children}
    </>
  );
}
