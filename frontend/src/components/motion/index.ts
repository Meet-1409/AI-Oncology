/**
 * Motion primitives.
 *
 * Components declare what animates; presets in design/motion.ts define how, so
 * motion stays coherent across the environment [04 §27].
 *
 * SpatialTransition and SharedElement arrive with the spatial shell in Feature 3,
 * where there are depth levels for them to move between.
 */

export { useReducedMotion } from './use-reduced-motion'
export { Reveal } from './reveal'
export type { RevealProps } from './reveal'
