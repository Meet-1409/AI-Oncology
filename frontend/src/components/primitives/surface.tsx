import { useCallback } from 'react'
import type { ElementType, HTMLAttributes, PointerEvent as ReactPointerEvent } from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/components/motion'

/**
 * Surfaces and elevation.
 *
 * The interface uses continuous surfaces rather than grids of boxes [04 §10].
 * Elevation has exactly four levels, matching the four depth levels, so elevation
 * and depth always mean the same thing [blueprint 03 §1.3].
 *
 * `Panel` is intentionally a separate export rather than a Surface variant: discrete
 * panels are permitted only when comparing discrete items [04 §10], and making that
 * a deliberate import choice keeps the constraint visible at the call site.
 *
 * Depth, not decoration [00 §12.3], [00 §12.5]: `interactive` and `tilt` are the two
 * opt-in ways a Surface responds to approach, and every card in the app was flat
 * until now regardless of whether it could be acted on. Reach for `interactive` on
 * anything clickable in a list; reach for `tilt` sparingly, on the handful of
 * primary surfaces where a pointer-following depth cue earns its keep. The two are
 * not meant to be combined — tilt's own transform already carries the depth cue
 * interactive's lift would otherwise add.
 */

const surfaceVariants = cva('', {
  variants: {
    elevation: {
      /** The space you are in. No shadow. */
      base: 'bg-[var(--surface-base)]',
      /** Objects that can be entered. */
      raised: 'bg-[var(--surface-raised)] shadow-raised',
      /** Hoverable objects that lift on approach. */
      lifted: 'bg-[var(--surface-raised)] shadow-lifted',
      /** Focus layer above a preserved parent [04 §4]. */
      focus: 'bg-[var(--surface-raised)] shadow-focus',
      /** Intent Bar, Signals, transient system surfaces. */
      overlay: 'bg-[var(--surface-raised)] shadow-overlay',
      /** Recessed regions. */
      sunken: 'bg-[var(--surface-sunken)]',
    },
    radius: {
      none: '',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      full: 'rounded-full',
    },
    /** Borders are the last resort for grouping [blueprint 03 §4.3]. */
    border: {
      none: '',
      subtle: 'border border-[var(--border-subtle)]',
      default: 'border border-[var(--border-default)]',
      strong: 'border border-[var(--border-strong)]',
    },
    inset: {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    },
    /** Hover depth feedback for a Surface that can actually be acted on. */
    interactive: {
      true: [
        'transition-[transform,box-shadow] duration-[var(--motion-quick)] ease-[var(--motion-ease-standard)]',
        'hover:-translate-y-0.5 hover:shadow-lifted',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
      ],
      false: '',
    },
  },
  defaultVariants: {
    elevation: 'base',
    radius: 'none',
    border: 'none',
    inset: 'none',
    interactive: false,
  },
})

type SurfaceVariants = VariantProps<typeof surfaceVariants>

export interface SurfaceProps extends HTMLAttributes<HTMLElement>, SurfaceVariants {
  as?: ElementType
  /**
   * A very slight perspective tilt that follows the pointer — real depth
   * feedback rather than a static card. Ignored for touch input, where hover
   * has no meaning, and under reduced motion. A handful of primary surfaces
   * only, never applied broadly [00 §12.5].
   */
  tilt?: boolean
}

/** Degrees of rotation at the pointer's furthest reach from centre. */
const TILT_MAX_DEGREES = 3

export function Surface({
  as,
  elevation,
  radius,
  border,
  inset,
  interactive,
  tilt = false,
  className,
  onPointerMove,
  onPointerLeave,
  ...props
}: SurfaceProps) {
  const Component = (as ?? 'div') as ElementType<HTMLAttributes<HTMLElement>>
  const reduced = useReducedMotion()
  const active = tilt && !reduced

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      onPointerMove?.(event)
      if (!active || event.pointerType === 'touch') return
      const el = event.currentTarget
      const rect = el.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width
      const y = (event.clientY - rect.top) / rect.height
      const rotateY = (x - 0.5) * TILT_MAX_DEGREES * 2
      const rotateX = (0.5 - y) * TILT_MAX_DEGREES * 2
      el.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    },
    [active, onPointerMove],
  )

  const handlePointerLeave = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      onPointerLeave?.(event)
      event.currentTarget.style.transform = ''
    },
    [onPointerLeave],
  )

  return (
    <Component
      className={cn(
        surfaceVariants({ elevation, radius, border, inset, interactive }),
        active &&
          'transition-transform duration-[var(--motion-quick)] ease-[var(--motion-ease-standard)] motion-reduce:transition-none',
        className,
      )}
      onPointerMove={active ? handlePointerMove : onPointerMove}
      onPointerLeave={active ? handlePointerLeave : onPointerLeave}
      {...props}
    />
  )
}

/**
 * A discrete container.
 *
 * Permitted ONLY for comparing discrete items — side by side clinical dates, or a
 * list of reports [04 §10]. Reach for Surface with space and typography first;
 * grids of cards are prohibited.
 */
export function Panel({ className, ...props }: SurfaceProps) {
  return (
    <Surface
      elevation="raised"
      radius="lg"
      border="subtle"
      inset="md"
      className={className}
      {...props}
    />
  )
}
