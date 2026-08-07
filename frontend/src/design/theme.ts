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

/**
 * The scene volume — literal hex, synced with `--scene-void`/`--scene-fog` in
 * tokens.css. Every space is now this one volume, so the whole persistent
 * Canvas is lit and fogged from these two values rather than each space
 * inventing its own background.
 */
export const scenePalette = {
  void: '#05080d',
  fog: '#05080d',
  fogNear: 2.2,
  fogFar: 9,
} as const

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
 * Organ involvement — contract v2.
 *
 * Replaces `severityScale`'s hand-set 0-5 dial with a coarse band DERIVED from
 * lesion burden. Literal hex for the same reason severity is: `three.Color`
 * cannot parse `var(--x)` — it warns and silently yields white. Kept in sync
 * with `--color-involvement-*` in tokens.css and `INVOLVEMENT_COLOR` in
 * lib/status.ts, enforced by tools/check-architecture.mjs.
 *
 * `none` and `notAssessed` are BOTH absences of colour and they are NOT the
 * same absence. `notAssessed` additionally carries the hatch from
 * design/texture.ts, because an organ that was never imaged is not a healthy
 * organ and no shade of grey can say that on its own.
 */
export const involvementScale = {
  none: '#dde1e7',
  low: '#f6b8b3',
  moderate: '#de5b50',
  high: '#841a13',
  notAssessed: '#9aa0a6',
} as const

export type InvolvementBand = keyof typeof involvementScale

/**
 * The Body's palette.
 *
 * The figure is presented as a rim-lit form in a dark volume, not a clinical
 * instrument-blue outline. Revised 4 August 2026 at the product owner's
 * request: the shell reads as an actual skin surface — warm, matte, lit like
 * skin rather than glass — because a future skin-level finding (raised as a
 * requirement, not yet built — see features/body/README.md) has to be able to
 * show up ON this surface, which a near-invisible outline cannot carry. It is
 * still deliberately not a photoreal render of any one person or skin tone
 * [00 §6.4] — a warm neutral, not a literal flesh match — and the severity
 * scale never touches this palette: red only ever appears on organs, which
 * still separates cleanly seen through the shell's translucency.
 */
export const anatomyPalette = {
  /** Fallback for any organ not listed in organPalette below. */
  organ: '#9aa3ab',
  /**
   * Bone. Kept in the same warm family as the shell rather than the cool grey
   * it used to be — against an alabaster body a cool cylinder stopped reading
   * as skeleton and started reading as a length of pipe threaded through the
   * arm. Matching the temperature puts it back inside the body.
   */
  bone: '#c4bcb2',
  lymph: '#a49c93',
  /**
   * Base tint of the body shell — alabaster, not flesh.
   *
   * This used to be a warm tan, and a tan body is a coloured body: it competed
   * with the severity scale for the eye and made the whole screen read orange.
   * Colour in this product means disease, so a healthy body is carved from
   * stone. Kept a touch warm rather than neutral grey so it still reads as lit
   * and alive, and so it stays in a different hue family from the cool-leaning
   * severity reds.
   */
  skin: '#cfc7bd',
  /** Fresnel rim, which is what makes the silhouette read at all. */
  rim: '#f2ece3',
  /** The volume the figure stands in. */
  volume: '#07131f',
} as const

/**
 * One healthy VALUE per organ — not one healthy colour.
 *
 * This palette used to be a full spectrum: a green stomach, a violet spleen, a
 * gold heart. It made organ identity legible, and it also made a healthy body
 * look like a bag of sweets, with a dozen saturated hues for the severity red
 * to compete against. In this product colour means disease and nothing else,
 * so healthy anatomy is rendered in greys and told apart by LIGHTNESS instead:
 * the organs you look at most sit lightest, the deep background structures sit
 * darkest, and the ordering is stable enough to learn.
 *
 * The hues that remain are barely-there temperature shifts — a few points of
 * saturation, enough to keep neighbouring organs from merging into one another
 * where they overlap, far too little to read as "coloured".
 *
 * Severity still overrides this palette entirely once an organ has any recorded
 * involvement — `colorFor()` in BodyScene.tsx reaches for `severityScale` first
 * and this palette only as the healthy-state fallback — so the first genuinely
 * saturated thing on the screen is always a finding.
 */
export const organPalette: Record<OrganId, string> = {
  brain: '#c3c7cd',
  thyroid: '#aab2b8',
  'left-lung': '#b4bcc4',
  'right-lung': '#b4bcc4',
  heart: '#c8c2bc',
  'left-breast': '#bdb8b8',
  'right-breast': '#bdb8b8',
  liver: '#a49f97',
  stomach: '#aeb3ad',
  pancreas: '#b7b9ae',
  spleen: '#9d9aa2',
  'left-kidney': '#a7aeae',
  'right-kidney': '#a7aeae',
  colon: '#b0aca2',
  bladder: '#a5abb4',
  prostate: '#9fa0aa',
  uterus: '#aca4ac',
  'left-ovary': '#b3aca4',
  'right-ovary': '#b3aca4',
  'lymph-nodes': '#a49c93',
  bones: '#c4bcb2',
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
