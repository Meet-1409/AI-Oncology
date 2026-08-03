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
import type { OrganId } from '@/types'

/** Disease severity, light to dark red [00 §6.7]. Consumed by the Body. */
export const severityScale: Readonly<Record<SeverityLevel, string>> = {
  0: '#dde1e7',
  1: '#f6b8b3',
  2: '#ed8e86',
  3: '#de5b50',
  4: '#c22e23',
  5: '#841a13',
}

/**
 * The Body's palette.
 *
 * The figure is presented as a rim-lit form in a dark volume rather than as a
 * literal flesh render. Two reasons, and the second is the clinical one:
 *
 *   1. A photoreal body invites the reading that this IS the patient's body.
 *      It is not — it represents body structure [09.6 §5] and is deliberately
 *      not an exact physical replica [00 §6.4]. A figure that reads as an
 *      instrument display cannot be mistaken for a photograph of anyone.
 *   2. The severity scale is red. Red on flesh tones is the worst possible
 *      pairing: hue separation is small and the eye discounts it. Against a
 *      dark blue volume every severity step separates cleanly, which is what
 *      the whole visualization exists to communicate.
 */
export const anatomyPalette = {
  /** Fallback for any organ not listed in organPalette below. */
  organ: '#7fb3cc',
  bone: '#a9c7d8',
  lymph: '#8fbdd4',
  /** Base tint of the body shell. Nearly unlit; the rim carries the form. */
  skin: '#2c6f96',
  /** Fresnel rim, which is what makes the silhouette read at all. */
  rim: '#7fd6ff',
  /** Vertex points scattered over the surface. */
  spark: '#cdf0ff',
  /** The volume the figure stands in. */
  volume: '#07131f',
} as const

/**
 * One healthy colour per organ, so organ identity is legible even before any
 * disease is recorded — previously every organ shared the single flat
 * `anatomyPalette.organ`, so nothing distinguished a liver from a kidney but
 * position.
 *
 * Deliberately never red, in any hue: `severityScale` (below) is the ONLY red
 * in the Body, so severity is unambiguous the moment it appears. Severity
 * still overrides this palette entirely once an organ has any recorded
 * involvement — `colorFor()` in BodyScene.tsx reaches for `severityScale` first
 * and this palette only as the healthy-state fallback — so there is no risk of
 * the two ever mixing on one organ.
 */
export const organPalette: Record<OrganId, string> = {
  brain: '#9b8fd4',
  thyroid: '#6fc2c9',
  'left-lung': '#6fa2d9',
  'right-lung': '#6fa2d9',
  heart: '#d1a34a',
  'left-breast': '#b07fb0',
  'right-breast': '#b07fb0',
  liver: '#9c8a4f',
  stomach: '#74bf7a',
  pancreas: '#a8c15a',
  spleen: '#8a6fc4',
  'left-kidney': '#5fb3a8',
  'right-kidney': '#5fb3a8',
  colon: '#c9b06a',
  bladder: '#6f8fc9',
  prostate: '#7a6fc9',
  uterus: '#af6fbf',
  'left-ovary': '#c9955f',
  'right-ovary': '#c9955f',
  'lymph-nodes': '#8fbdd4',
  bones: '#a9c7d8',
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
