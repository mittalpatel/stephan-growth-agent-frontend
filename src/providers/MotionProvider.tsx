'use client';

import { LazyMotion, domAnimation } from 'motion/react';

/**
 * Loads Motion's animation feature set ONCE for the whole app. Every animated
 * component uses the lightweight `m` component (from `motion/react`) instead of
 * the full `motion` component; `LazyMotion` + `domAnimation` then supplies the
 * features they need. This keeps the shared JS bundle small (the full `motion`
 * feature bundle is never pulled in) — important because the bundle size is
 * CI-enforced (see bundle-budget.json / scripts/check-bundle-size.mjs).
 *
 * `strict` makes the build throw if any code imports the heavy `motion.*`
 * component instead of `m.*`, so a bundle regression can't slip in unnoticed.
 */
export default function MotionProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
