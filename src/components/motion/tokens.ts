import type { Transition } from 'motion/react';

/**
 * Shared motion tokens so every animation in the app reads from one refined set
 * instead of scattered magic numbers. Keeping these consistent is most of what
 * makes motion feel "designed" rather than ad-hoc.
 */

// easeOutExpo-style curve: a fast start that decelerates hard into place. Reads as
// crisp and premium, versus the soft, generic feel of the built-in `easeOut`.
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

// Durations (seconds). Short and consistent — professional motion is restrained.
export const DURATION = {
  /** Page-level content settling in. */
  page: 0.45,
  /** A single list/grid item entering. */
  item: 0.4,
  /** Modal panel enter/exit — quick and clean, no lingering. */
  modal: 0.2,
  /** Backdrop / overlay fade — quick, stays behind the panel. */
  overlay: 0.15,
} as const;

// Subtle travel distances (px). Small offsets read as polish; large ones as bounce.
export const OFFSET = {
  page: 10,
  item: 8,
} as const;

export const pageTransition: Transition = { duration: DURATION.page, ease: EASE_OUT };
export const itemTransition: Transition = { duration: DURATION.item, ease: EASE_OUT };

// Tight, physical spring for modal panels — high damping so it settles crisply with
// no overshoot/bounce (a bouncy modal reads as toy-like). This is what gives the
// open a "designed", premium feel vs. a flat duration tween.
export const modalSpring: Transition = { type: 'spring', stiffness: 380, damping: 32, mass: 0.9 };

// Exit stays a quick tween — springs are slow to "arrive" at an exit target, which
// makes dismissal feel laggy. A short ease-in snaps it away.
export const modalExitTransition: Transition = { duration: 0.14, ease: 'easeIn' };

// Popovers (filter dropdown, calendar, hand-rolled menus). A menu should feel
// instant and light — a quick scale+fade from its trigger corner, not the weighty
// rise of a modal. Faster than the modal so it reads as "attached" to the trigger.
export const popoverTransition: Transition = { duration: 0.16, ease: EASE_OUT };
export const popoverExitTransition: Transition = { duration: 0.12, ease: 'easeIn' };

// Small UI elements appearing/leaving in place — filter chips, badges. Just a
// quick scale+fade; AnimatePresence handles the reflow as siblings shift.
export const chipTransition: Transition = { duration: 0.15, ease: EASE_OUT };

/**
 * Per-item stagger delay, capped so the whole cascade lands within ~`window`
 * seconds no matter how long the list is. A fixed per-item delay makes a 50-row
 * table ripple for 2s+ (the amateur tell); this keeps long lists snappy while a
 * short list still gets a lively cascade.
 */
export function staggerFor(count: number, perItem = 0.05, window = 0.4): number {
  if (count <= 1) return 0;
  return Math.min(perItem, window / count);
}
