/**
 * Typed access to design tokens for consumers that cannot read CSS.
 *
 * three.js materials, canvas rendering and motion logic all need token values in
 * JavaScript. Those consumers must never hard-code hex values or read
 * `getComputedStyle`, because both silently drift from the CSS source.
 *
 * The severity values below are duplicated from design/tokens.css by necessity —
 * three.Color cannot parse `var(--x)`. `tools/check-architecture.mjs` enforces that
 * they stay literal, and the test suite (Feature 20) asserts they match the CSS.
 */

import type { SeverityLevel } from '@/lib/status'

/** Disease severity, light to dark red [00 §6.7]. Consumed by the Body. */
export const severityScale: Readonly<Record<SeverityLevel, string>> = {
  0: '#dde1e7',
  1: '#f6b8b3',
  2: '#ed8e86',
  3: '#de5b50',
  4: '#c22e23',
  5: '#841a13',
}

/** Anatomy colors for organs with no disease involvement. */
export const anatomyPalette = {
  organ: '#c98f80',
  bone: '#e7e0cd',
  lymph: '#d8c6bd',
  skin: '#e4c9ae',
} as const

/**
 * Motion durations in milliseconds, mirroring the CSS custom properties.
 * Inside the documented 180-420ms envelope [04 §6].
 */
export const duration = {
  quick: 180,
  reveal: 260,
  spatial: 380,
} as const

export type DurationToken = keyof typeof duration

/**
 * Easing as cubic-bezier control points, for animation libraries that take arrays.
 * Calm and confident; no bounce, no elastic, no overshoot [04 §6].
 */
export const easing = {
  enter: [0.16, 1, 0.3, 1],
  exit: [0.7, 0, 0.84, 0],
  standard: [0.4, 0, 0.2, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>

export type EasingToken = keyof typeof easing

/**
 * Camera damping for the Body. Movement is inertial and settling, never springy
 * [09.6 §16]. Expressed as a smoothing factor per second.
 */
export const cameraDamping = {
  /** Higher settles faster. Tuned to feel confident rather than sluggish. */
  factor: 4.5,
  /** Severity color interpolation rate when moving through time. */
  severityLerp: 5,
} as const
