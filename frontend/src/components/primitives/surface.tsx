import type { ElementType, HTMLAttributes } from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

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
  },
  defaultVariants: {
    elevation: 'base',
    radius: 'none',
    border: 'none',
    inset: 'none',
  },
})

type SurfaceVariants = VariantProps<typeof surfaceVariants>

export interface SurfaceProps extends HTMLAttributes<HTMLElement>, SurfaceVariants {
  as?: ElementType
}

export function Surface({
  as,
  elevation,
  radius,
  border,
  inset,
  className,
  ...props
}: SurfaceProps) {
  const Component = as ?? 'div'
  return (
    <Component
      className={cn(surfaceVariants({ elevation, radius, border, inset }), className)}
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
