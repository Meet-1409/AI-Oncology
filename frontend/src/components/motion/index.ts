/**
 * Motion primitives.
 *
 * Components declare what animates; presets in design/motion.ts define how, so
 * motion stays coherent across the environment [04 §27].
 */

export { useReducedMotion } from './use-reduced-motion'
export { useOnApproach } from './use-on-approach'
export { Reveal } from './reveal'
export type { RevealProps } from './reveal'
export { SpaceTransition } from './space-transition'
export type { SpaceTransitionProps } from './space-transition'
