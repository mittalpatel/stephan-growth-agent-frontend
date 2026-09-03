'use client';

import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { popoverExitTransition, popoverTransition } from './tokens';

type Align = 'left' | 'right';

type Props = Readonly<{
  open: boolean;
  /**
   * Which trigger corner the panel grows from. Sets the transform-origin so the
   * scale animation reads as "opening from the button", not floating in.
   */
  align?: Align;
  /** Positioning + appearance classes for the panel (absolute, width, bg, etc.). */
  className?: string;
  children: React.ReactNode;
}>;

/**
 * Animated shell for hand-rolled (non-Radix) dropdown panels — the filter menu,
 * the date-range calendar, and similar absolute-positioned popovers that used to
 * snap in/out with `{open && <div>}`. The panel does one clean gesture: a quick
 * scale+fade from its trigger corner. Lighter and faster than `MotionModal` so it
 * reads as attached to the trigger rather than a heavy overlay.
 *
 * Keep the consuming component mounted and drive it with `open` — `AnimatePresence`
 * needs to see the panel leave to play the exit. Outside-click / positioning stay
 * the caller's responsibility (just wrap what was `{open && <div className=…>}`).
 * Honours `prefers-reduced-motion` (opacity only, no scale/move).
 */
export function MotionPopover({ open, align = 'right', className, children }: Props) {
  const reduceMotion = useReducedMotion();
  const origin = align === 'left' ? 'top left' : 'top right';

  return (
    <AnimatePresence>
      {open && (
        <m.div
          className={cn(className)}
          style={{ transformOrigin: origin }}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: popoverTransition }}
          exit={
            reduceMotion
              ? { opacity: 0, transition: popoverExitTransition }
              : { opacity: 0, scale: 0.97, y: -4, transition: popoverExitTransition }
          }
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}
