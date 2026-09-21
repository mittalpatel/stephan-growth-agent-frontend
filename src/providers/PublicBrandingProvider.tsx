'use client';

import { createContext, useContext, useMemo } from 'react';

import {
  PLATFORM_BRANDING,
  resolvePublicBranding,
  type PublicBrandingValue,
} from '@/lib/publicBranding';
import type { PublicBranding } from '@/types/settings';

const PublicBrandingContext = createContext<PublicBrandingValue>(PLATFORM_BRANDING);

/**
 * Carries the custom-domain organization's branding (resolved on the server from the
 * request host) to the client components of the signed-out pages. Without it, or
 * with `null`, every consumer gets the platform's own name and mark.
 */
export function PublicBrandingProvider({
  branding,
  children,
}: Readonly<{ branding: PublicBranding | null; children: React.ReactNode }>) {
  const value = useMemo(() => resolvePublicBranding(branding), [branding]);
  return <PublicBrandingContext.Provider value={value}>{children}</PublicBrandingContext.Provider>;
}

export function usePublicBranding(): PublicBrandingValue {
  return useContext(PublicBrandingContext);
}
