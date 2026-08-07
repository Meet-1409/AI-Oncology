import type * as THREE from 'three'

/**
 * The two coordinate spaces, made incompatible at the type level.
 *
 * WHY THIS FILE EXISTS
 *
 * Contract v2 gives every lesion two positions:
 *
 *   patientSpaceMm   clinical truth. LPS millimetres, from the scan's own
 *                    geometry. Used for measurement and matching.
 *
 *   atlasPosition    display only. Normalised coordinates in the GLB atlas,
 *                    computed BY THE BACKEND via patient-to-atlas registration,
 *                    carrying its own confidence, and NULL when registration
 *                    was not possible or not trusted.
 *
 * The frontend must never derive one from the other `[CLAUDE.md rule 3]`.
 * Mapping a real patient onto a generic atlas is medical image registration; a
 * scale-and-offset in the browser produces a marker that is plausibly,
 * confidently in the wrong organ. An absent marker is recoverable. A wrong one
 * is not.
 *
 * The danger is specific and close at hand: `model.ts` already owns `applyFit`,
 * which maps atlas coordinates with exactly the scale-and-offset shape that
 * would look like it works on a lesion. It is the function someone reaches for.
 * A comment saying "don't" is not a control — so the two spaces are now
 * different TYPES, and passing patient-space millimetres into the atlas
 * pipeline is a compile error rather than something caught in review.
 *
 * WHAT IS LEGITIMATE
 *
 * `applyFit` on authored organ meshes is correct and unchanged. Those meshes
 * come out of the SAME atlas GLB the fit was computed from, so they are already
 * in atlas space by construction — that is what `AtlasGeometry` records.
 *
 * There is deliberately NO function in this file that converts patient space to
 * atlas space. That conversion is the backend's, and its absence here is the
 * whole point.
 */

declare const ATLAS_SPACE: unique symbol
declare const PATIENT_SPACE: unique symbol

/**
 * Geometry known to be in the atlas's own coordinate space.
 *
 * Only `bake()` in model.ts produces this, and only from meshes read out of an
 * atlas GLB. A geometry built from patient data cannot acquire this brand.
 */
export type AtlasGeometry = THREE.BufferGeometry & { readonly [ATLAS_SPACE]: true }

/** A point in atlas space. The only source is the backend's `atlasPosition`. */
export interface AtlasPoint {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly [ATLAS_SPACE]: true
}

/**
 * A point in patient space — LPS millimetres, clinical truth.
 *
 * Carries no path into the atlas pipeline. That is not an omission.
 */
export interface PatientPointMm {
  readonly x: number
  readonly y: number
  readonly z: number
  readonly [PATIENT_SPACE]: true
}

/**
 * Marks a geometry as atlas-space.
 *
 * INTERNAL TO THE ATLAS LOADER. Call this only where the geometry demonstrably
 * came from an atlas GLB. Calling it on anything derived from patient data
 * defeats the entire mechanism — which is why it is not exported from the
 * feature's public index.
 */
export function asAtlasGeometry(geometry: THREE.BufferGeometry): AtlasGeometry {
  return geometry as AtlasGeometry
}

/**
 * The ONLY way to obtain an atlas point: take one the backend already computed.
 *
 * Returns null when registration was not possible or not trusted, and the
 * caller's job in that case is to render no marker at all — not to fall back to
 * a guess. `confidence` is returned alongside so the caller can decline a
 * low-confidence placement; it is never folded into the position.
 */
export function atlasPointFromContract(
  position: { x: number; y: number; z: number; confidence: number } | null,
): { point: AtlasPoint; confidence: number } | null {
  if (!position) return null
  return {
    point: { x: position.x, y: position.y, z: position.z } as AtlasPoint,
    confidence: position.confidence,
  }
}

/**
 * Tags clinical millimetres as patient space.
 *
 * Nothing in the Body's rendering path accepts this type. It exists so a lesion's
 * true position can be carried through measurement and matching code without
 * ever being mistaken for something placeable.
 */
export function patientPointMm(position: {
  x: number
  y: number
  z: number
}): PatientPointMm {
  return { x: position.x, y: position.y, z: position.z } as PatientPointMm
}
