/**
 * The motion language.
 *
 * Animation is a primary interface element, not decoration [00 §11.1]. Every
 * animation in the product carries exactly one meaning — this is what stops motion
 * accumulating into noise:
 *
 *   DEPTH    entering or leaving a space
 *   TIME     movement along the Journey
 *   CLINICAL something in the patient's state changed
 *   PROCESS  the system is working
 *
 * An animation fitting none of these is decoration and is prohibited [00 §11.2].
 *
 * Components declare *what* animates; the shell decides *how*. Keeping the presets
 * here is what makes motion coherent globally [04 §27] rather than each component
 * inventing its own.
 */

import { duration, easing } from './theme'

/** The four permitted meanings. Every preset declares one. */
export type MotionMeaning = 'depth' | 'time' | 'clinical' | 'process'

export interface MotionPreset {
  meaning: MotionMeaning
  duration: number
  ease: readonly [number, number, number, number]
}

/**
 * Entering a space. Zoom in; the parent recedes but stays visible [04 §4].
 * Only transform and opacity — compositor-friendly properties are what make the
 * 60fps target achievable rather than aspirational [00 §13.5].
 */
export const spatialEnter: MotionPreset = {
  meaning: 'depth',
  duration: duration.spatial,
  ease: easing.enter,
}

/** Leaving a space. Exact reverse of entering, so the environment feels symmetrical. */
export const spatialExit: MotionPreset = {
  meaning: 'depth',
  duration: duration.spatial,
  ease: easing.exit,
}

/** Content revealing on approach — progressive disclosure [04 §10]. */
export const reveal: MotionPreset = {
  meaning: 'clinical',
  duration: duration.reveal,
  ease: easing.enter,
}

/** Local control feedback: hover, press, focus. */
export const feedback: MotionPreset = {
  meaning: 'process',
  duration: duration.quick,
  ease: easing.standard,
}

/** Drawing attention to what changed [00 §11.5]. */
export const attention: MotionPreset = {
  meaning: 'clinical',
  duration: duration.reveal,
  ease: easing.standard,
}

/**
 * Movement through time is driven by input, not a fixed duration — scrubbing the
 * Journey moves the whole space continuously [00 §15.5].
 */
export const timeScrub = {
  meaning: 'time' as const,
  ease: easing.standard,
} as const

/**
 * Ordered reveal of a sequence. Deliberately small: a long stagger delays the user,
 * which motion must never do [00 §11.8].
 */
export const STAGGER_STEP_MS = 40
export const STAGGER_MAX_ITEMS = 8

/**
 * Resolves a preset to zero duration when the user prefers reduced motion.
 *
 * Reduced motion is a different presentation of the same environment — never a
 * reduced feature set. Every state reachable with motion stays reachable without
 * it [00 §11.9].
 */
export function resolveMotion(preset: MotionPreset, reduced: boolean): MotionPreset {
  return reduced ? { ...preset, duration: 0 } : preset
}

/** Stagger delay for an item, collapsing to zero under reduced motion. */
export function staggerDelay(index: number, reduced: boolean): number {
  if (reduced) return 0
  return Math.min(index, STAGGER_MAX_ITEMS) * STAGGER_STEP_MS
}
