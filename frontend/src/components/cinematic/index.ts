/**
 * The cinematic layer — Depth 0 only.
 *
 * DOCUMENTED EXCEPTION to the rule that all UI comes from the clinical Design
 * System. [04 §14] requires the Entry to be "a cinematic introduction to the
 * system, not a traditional landing page", to "feel premium" and to "be
 * memorable". That is a different job from the one the clinical primitives do,
 * and giving them a second job would degrade both.
 *
 * The boundary is absolute and enforced by tools/check-architecture.mjs: nothing
 * in src/spaces outside src/spaces/entry, and nothing in src/features, may import
 * from this module. Inside the application [04 §28] governs — usability is never
 * sacrificed for visual effect.
 */

export { Grain, LightField, Hairline } from './atmosphere'
export { Rise, Settle, useOnApproach } from './reveal'
export type { RiseProps, SettleProps } from './reveal'
export { Marquee } from './marquee'
export { CinematicAction, CinematicJump, EdgeLabel, Ordinal } from './controls'
export type { CinematicActionProps } from './controls'
