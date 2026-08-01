/**
 * Design system primitives.
 *
 * These encode the visual language and know nothing domain-specific. Behavioural
 * components built on Radix (dialog, select, table, pagination) arrive with the
 * shared component library in Feature 7.
 */

export { Text, VisuallyHidden } from './text'
export type { TextProps } from './text'

export { Surface, Panel } from './surface'
export type { SurfaceProps } from './surface'

export { Control } from './control'
export type { ControlProps } from './control'

export { Icon } from './icon'
export type { IconProps, IconComponent, IconSize } from './icon'

export { StatusIndicator } from './status-indicator'
export type { StatusIndicatorProps, StatusTone } from './status-indicator'
