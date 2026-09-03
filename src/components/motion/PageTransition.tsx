'use client';

import { m, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { OFFSET, pageTransition } from './tokens';

type Props = Readonly<{
  children: React.ReactNode;
  className?: string;
}>;

/**
 * Fades + lifts page content in once on mount, so a route's content arrives with
 * a brief, intentional transition instead of snapping in when its data resolves.
 *
 * Wrap the page's CLIENT child (e.g. <OrdersList />), not the Server Component
 * `page.tsx` itself — this keeps the page a Server Component.
 *
 * Honours `prefers-reduced-motion`: when the user opts out, the content renders
 * with no movement at all.
 */
export function PageTransition({ children, className }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <m.div
      initial={reduceMotion ? false : { opacity: 0, y: OFFSET.page }}
      animate={{ opacity: 1, y: 0 }}
      transition={pageTransition}
      className={cn(className)}
    >
      {children}
    </m.div>
  );
}
