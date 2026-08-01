import type { ComponentType, CSSProperties, SVGProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * Iconography.
 *
 * One icon family throughout, matching the single-font-family rule [04 §8] — a
 * mixed icon set reads as inconsistent as a mixed typeface.
 *
 * Icons are decorative by default and hidden from assistive technology. An icon
 * carrying meaning on its own must be given a `label`, because every interactive
 * element needs an accessible name [00 §16.4] and meaning must never rest on a
 * visual alone [00 §16.2].
 *
 * Sizes are constrained to the type scale so icons align optically with the text
 * they sit beside.
 */

export type IconSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZE_CLASS: Record<IconSize, string> = {
  xs: 'size-3.5',
  sm: 'size-4',
  md: 'size-5',
  lg: 'size-6',
}

/** Icon components from the icon library share this shape. */
export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>

export interface IconProps {
  icon: IconComponent
  size?: IconSize
  className?: string
  /** For token-driven colors that cannot be expressed as a utility class. */
  style?: CSSProperties
  /**
   * Accessible name. Provide when the icon carries meaning that is not already
   * present in adjacent text. Omit for purely decorative icons.
   */
  label?: string
}

export function Icon({ icon: Component, size = 'sm', className, style, label }: IconProps) {
  const decorative = label === undefined
  return (
    <Component
      className={cn(SIZE_CLASS[size], className)}
      style={style}
      // Stroke width is fixed so icons keep consistent visual weight at every size.
      strokeWidth={1.9}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={label}
      focusable="false"
    />
  )
}
