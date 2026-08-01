import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { staggerDelay } from '@/design/motion'
import { useReducedMotion } from './use-reduced-motion'

/**
 * Progressive revelation.
 *
 * Content is revealed progressively; detail appears on approach [04 §10]. This is
 * what keeps information density high without overwhelming the user [00 §10.10].
 *
 * Implemented with CSS transitions on transform and opacity only — compositor
 * friendly, which is what makes the 60fps target achievable [00 §13.5].
 *
 * Under reduced motion the content appears immediately with no transform. No
 * information is lost, only the movement [00 §11.9].
 */

export interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether the content is currently revealed. */
  show?: boolean
  /** Position in a sequence, for ordered reveal. */
  index?: number
}

export function Reveal({
  show = true,
  index = 0,
  className,
  style,
  children,
  ...props
}: RevealProps) {
  const reduced = useReducedMotion()
  const delay = staggerDelay(index, reduced)

  return (
    <div
      className={cn(
        'transition-[opacity,transform] duration-[var(--motion-reveal)]',
        'ease-[var(--motion-ease-enter)] motion-reduce:transition-none',
        show ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
        className,
      )}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}
