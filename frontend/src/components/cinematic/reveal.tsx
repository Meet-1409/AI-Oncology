import { createElement } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useOnApproach } from './use-on-approach'

/**
 * The host element a reveal renders as.
 *
 * Deliberately a closed list rather than `ElementType`. An open polymorphic
 * `as` prop makes TypeScript resolve the union of every intrinsic element's
 * props, which either collapses to `never` (rejecting className and ref) or
 * exceeds the compiler's union limit outright. A reveal wraps a heading, a
 * paragraph or a block — naming those is both sufficient and cheaper.
 */
type HostTag = 'div' | 'section' | 'span' | 'p' | 'li' | 'h1' | 'h2' | 'h3' | 'h4'

/**
 * Layered reveals — the Entry only [04 §14].
 *
 * The difference between an ordinary page and a designed one is usually not the
 * animation itself but its ORDER. In both reference compositions, content does
 * not fade in as a block: it arrives in layers, each a beat behind the last, so
 * the eye is led through the composition in the order the designer intended.
 *
 * Two mechanisms:
 *   Rise    — a line lifts into place from behind a mask. Used for headings.
 *   Settle  — content fades and lifts a short distance. Used for supporting text.
 *
 * Both collapse to an instant, fully-visible state under reduced motion. The
 * content is present in the DOM from first paint either way, so nothing depends
 * on JavaScript or on the animation completing [00 §11.9].
 */

export interface RiseProps {
  children: ReactNode
  /** Beats to wait before this layer arrives. One beat is 90ms. */
  beat?: number
  as?: HostTag
  className?: string
}

/**
 * A line rising into place from behind a mask.
 *
 * The mask is the point: the text does not appear, it ARRIVES from somewhere.
 * That reads as physical rather than as a CSS transition, and it is the single
 * most recognisable move in the reference material.
 */
export function Rise({ children, beat = 0, as = 'div', className }: RiseProps) {
  const { ref, approached } = useOnApproach<HTMLElement>()

  return createElement(
    as,
    { ref, className: cn('block overflow-hidden', className) },
    <span
      className={cn(
        'block will-change-transform',
        'transition-[transform,opacity] ease-[var(--motion-ease-enter)]',
        'duration-[var(--cinema-settle)] motion-reduce:transition-none',
        approached ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
      )}
      style={{ transitionDelay: `${beat * 90}ms` }}
    >
      {children}
    </span>,
  )
}

export interface SettleProps {
  children: ReactNode
  beat?: number
  as?: HostTag
  className?: string
}

/** Supporting content, lifting a short distance into place. */
export function Settle({ children, beat = 0, as = 'div', className }: SettleProps) {
  const { ref, approached } = useOnApproach<HTMLElement>()

  return createElement(
    as,
    {
      ref,
      className: cn(
        'transition-[transform,opacity] ease-[var(--motion-ease-enter)]',
        'duration-[var(--cinema-settle)] motion-reduce:transition-none',
        approached ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        className,
      ),
      style: { transitionDelay: `${beat * 90}ms` },
    },
    children,
  )
}
