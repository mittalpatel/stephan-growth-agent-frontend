'use client';

import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { DURATION, EASE_OUT, modalExitTransition, modalSpring } from './tokens';

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  /** Classes for the modal panel (size, radius, background, etc.). */
  panelClassName?: string;
  children: React.ReactNode;
}>;

/**
 * Animated shell for hand-rolled (non-Radix) modals. The panel rises into place on
 * a tight, no-overshoot spring (`modalSpring`) while the backdrop frosts in — a
 * "designed" feel versus the snap-in these custom overlays had before. Exit is a
 * quick tween so dismissal stays crisp. Both directions run via `AnimatePresence`.
 *
 * Keep the component mounted (don't `return null` when closed) and pass `open` —
 * `AnimatePresence` needs to see the element leave to play the exit animation.
 * Honours `prefers-reduced-motion` (opacity only, no movement).
 */
export function MotionModal({ open, onClose, panelClassName, children }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <m.div
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            transition={{ duration: DURATION.overlay, ease: EASE_OUT }}
          />
          <m.div
            className={cn('relative z-10 mx-4', panelClassName)}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0, transition: modalExitTransition }
                : { opacity: 0, y: 8, transition: modalExitTransition }
            }
            transition={reduceMotion ? { duration: DURATION.modal } : modalSpring}
          >
            {children}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
