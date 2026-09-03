'use client';

import { Children, useMemo } from 'react';
import { m, useReducedMotion, type Variants } from 'motion/react';
import { cn } from '@/lib/utils';
import { OFFSET, itemTransition, staggerFor } from './tokens';

// Only the element types our lists actually need: grids render a `<div>` wrapping
// `<article>` cards; tables render a `<tbody>` wrapping `<tr>` rows.
const CONTAINER_ELEMENTS = { div: m.div, tbody: m.tbody } as const;
const ITEM_ELEMENTS = { article: m.article, tr: m.tr, div: m.div } as const;

type ContainerAs = keyof typeof CONTAINER_ELEMENTS;
type ItemAs = keyof typeof ITEM_ELEMENTS;

const itemVariants: Variants = {
  hidden: { opacity: 0, y: OFFSET.item },
  show: { opacity: 1, y: 0, transition: itemTransition },
};

type ContainerProps = Readonly<{
  as?: ContainerAs;
  className?: string;
  children: React.ReactNode;
}>;

/**
 * Staggered entrance container. Wraps a mapped list; pair each mapped child with
 * `<MotionListItem>` so items cascade in. Honours `prefers-reduced-motion` — when
 * the user opts out, children appear instantly with no movement.
 *
 * The per-item delay is capped (see `staggerFor`) so the cascade stays snappy on
 * long lists instead of rippling for seconds.
 *
 * Grid usage:  <MotionList className="grid …">{items.map(… <MotionListItem as="article">)}</MotionList>
 * Table usage: <MotionList as="tbody">{rows.map(… <MotionListItem as="tr">)}</MotionList>
 */
export function MotionList({ as = 'div', className, children }: ContainerProps) {
  const reduceMotion = useReducedMotion();
  const Comp = CONTAINER_ELEMENTS[as];

  const containerVariants = useMemo<Variants>(() => {
    const staggerChildren = staggerFor(Children.count(children));
    return { hidden: {}, show: { transition: { staggerChildren } } };
  }, [children]);

  return (
    <Comp
      className={cn(className)}
      variants={reduceMotion ? undefined : containerVariants}
      initial={reduceMotion ? false : 'hidden'}
      animate="show"
    >
      {children}
    </Comp>
  );
}

type ItemProps = Readonly<{
  as?: ItemAs;
  className?: string;
  children: React.ReactNode;
}>;

export function MotionListItem({ as = 'div', className, children }: ItemProps) {
  const reduceMotion = useReducedMotion();
  const Comp = ITEM_ELEMENTS[as];

  return (
    <Comp className={cn(className)} variants={reduceMotion ? undefined : itemVariants}>
      {children}
    </Comp>
  );
}
