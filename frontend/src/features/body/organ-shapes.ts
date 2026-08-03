import { buildOrganGeometry, organLocalBounds } from './figure'
import type { LoftPart, Relief } from './figure'
import type { OrganId } from '@/types'

/**
 * Real organ silhouettes, not primitives.
 *
 * Every organ used to be a raw sphere/capsule/torus squashed with non-uniform
 * scale — quick to write, but it reads as exactly what it is: a blob placed
 * where an organ should be. This file applies the same technique `figure.ts`
 * uses for the body itself (a small number of hand-placed cross-sections,
 * Catmull-Rom interpolated, skinned into one surface) to each organ, in the
 * organ's own small local frame. The caller (anatomy.ts) still positions,
 * rotates and scales the result with the same mesh props a primitive used —
 * this only changes what geometry sits inside those props.
 *
 * Stylized, not diagnostic. This is body structure, not a physical replica of
 * any patient's anatomy [00 §6.4] — each shape carries only as much detail as
 * makes it read correctly as that organ from the outside, the same modesty
 * `figure.ts`'s trunk relief already holds itself to.
 *
 * Paired organs (lungs, kidneys) are authored once and mirrored for the other
 * side by negating the x scale at the call site in `anatomy.ts` — three.js
 * corrects the resulting winding automatically, so a mirrored organ still
 * shades and culls correctly.
 */

/* ------------------------------------------------------------------ *
 * Liver — right lobe dominant, tapering to a thin left lobe.
 * ------------------------------------------------------------------ */
const LIVER: readonly LoftPart[] = [
  {
    sections: [
      { at: -0.022, halfWidth: 0.02, halfDepth: 0.026, centreA: 0.01, squareness: 2.2 },
      { at: -0.01, halfWidth: 0.055, halfDepth: 0.04, centreA: 0.012, squareness: 2.0 },
      { at: 0.002, halfWidth: 0.072, halfDepth: 0.046, centreA: 0.006, squareness: 1.9 },
      { at: 0.014, halfWidth: 0.064, halfDepth: 0.042, centreA: -0.006, squareness: 1.85 },
      { at: 0.022, halfWidth: 0.028, halfDepth: 0.028, centreA: -0.02, squareness: 1.8 },
    ],
    segments: 22,
    rings: 26,
  },
]

/* ------------------------------------------------------------------ *
 * Lungs — one profile, mirrored. The left carries a shallow cardiac notch on
 * its medial-anterior border, where the heart actually sits against it.
 * ------------------------------------------------------------------ */
const LUNG_SECTIONS = [
  { at: -0.085, halfWidth: 0.02, halfDepth: 0.024, squareness: 1.8 },
  { at: -0.05, halfWidth: 0.052, halfDepth: 0.044, squareness: 1.7 },
  { at: -0.01, halfWidth: 0.06, halfDepth: 0.048, squareness: 1.7 },
  { at: 0.04, halfWidth: 0.052, halfDepth: 0.04, squareness: 1.7 },
  { at: 0.085, halfWidth: 0.024, halfDepth: 0.022, squareness: 1.6 },
]

const cardiacNotch: Relief = (t, theta) => {
  // A shallow indent low on the medial-anterior border (front, theta = π/2),
  // in the lower third of the lung — where the heart's silhouette sits.
  const low = t < 0.4 ? Math.cos((t / 0.4) * (Math.PI / 2)) ** 2 : 0
  let d = theta - Math.PI / 2
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  const medial = Math.abs(d) < 0.6 ? Math.cos((d / 0.6) * (Math.PI / 2)) ** 2 : 0
  return 1 - low * medial * 0.3
}

const LUNG: readonly LoftPart[] = [{ sections: LUNG_SECTIONS, segments: 18, rings: 22 }]
const LUNG_WITH_NOTCH: readonly LoftPart[] = [
  { sections: LUNG_SECTIONS, segments: 18, rings: 22, relief: cardiacNotch },
]

/* ------------------------------------------------------------------ *
 * Heart — tapered apex, rounded base, atria settling slightly back.
 * ------------------------------------------------------------------ */
const HEART: readonly LoftPart[] = [
  {
    sections: [
      { at: -0.045, halfWidth: 0.01, halfDepth: 0.012, squareness: 1.6 },
      { at: -0.02, halfWidth: 0.034, halfDepth: 0.032, squareness: 1.7 },
      { at: 0.01, halfWidth: 0.046, halfDepth: 0.04, squareness: 1.8 },
      { at: 0.035, halfWidth: 0.04, halfDepth: 0.036, centreB: -0.006, squareness: 1.9 },
      { at: 0.048, halfWidth: 0.026, halfDepth: 0.028, squareness: 2.0 },
    ],
    segments: 18,
    rings: 20,
  },
]

/* ------------------------------------------------------------------ *
 * Kidneys — the bean shape, via a pinched, offset hilum ring at mid-height.
 * Authored with the concavity facing +x; anatomy.ts mirrors it per side so the
 * concave (medial, hilum) border always faces the spine.
 * ------------------------------------------------------------------ */
const KIDNEY: readonly LoftPart[] = [
  {
    sections: [
      { at: -0.028, halfWidth: 0.014, halfDepth: 0.018, squareness: 1.9 },
      { at: -0.012, halfWidth: 0.022, halfDepth: 0.026, centreA: 0.002, squareness: 1.9 },
      { at: 0, halfWidth: 0.024, halfDepth: 0.014, centreA: 0.01, squareness: 1.7 },
      { at: 0.012, halfWidth: 0.022, halfDepth: 0.026, centreA: 0.002, squareness: 1.9 },
      { at: 0.028, halfWidth: 0.014, halfDepth: 0.018, squareness: 1.9 },
    ],
    segments: 18,
    rings: 22,
  },
]

/* ------------------------------------------------------------------ *
 * Stomach — a J-curve traced with centreB, fundus curving back and up.
 * ------------------------------------------------------------------ */
const STOMACH: readonly LoftPart[] = [
  {
    sections: [
      { at: -0.032, halfWidth: 0.014, halfDepth: 0.016, centreB: 0.01, squareness: 1.8 },
      { at: -0.012, halfWidth: 0.024, halfDepth: 0.024, centreB: 0.004, squareness: 1.8 },
      { at: 0.008, halfWidth: 0.036, halfDepth: 0.03, centreB: -0.004, squareness: 1.8 },
      { at: 0.028, halfWidth: 0.04, halfDepth: 0.032, centreB: -0.01, squareness: 1.8 },
      { at: 0.04, halfWidth: 0.03, halfDepth: 0.026, centreB: -0.014, squareness: 1.8 },
    ],
    segments: 18,
    rings: 20,
  },
]

/* ------------------------------------------------------------------ *
 * Spleen — a flattened oval, tucked laterally. No dramatic asymmetry needed.
 * ------------------------------------------------------------------ */
const SPLEEN: readonly LoftPart[] = [
  {
    sections: [
      { at: -0.024, halfWidth: 0.014, halfDepth: 0.01, squareness: 1.9 },
      { at: -0.008, halfWidth: 0.026, halfDepth: 0.016, squareness: 1.9 },
      { at: 0.008, halfWidth: 0.028, halfDepth: 0.017, squareness: 1.9 },
      { at: 0.024, halfWidth: 0.016, halfDepth: 0.011, squareness: 1.9 },
    ],
    segments: 14,
    rings: 18,
  },
]

/* ------------------------------------------------------------------ *
 * Pancreas — head to tail, tapering. Orientation comes from the existing
 * `rotation` already applied at the anatomy.ts mesh level.
 * ------------------------------------------------------------------ */
const PANCREAS: readonly LoftPart[] = [
  {
    sections: [
      { at: -0.04, halfWidth: 0.016, halfDepth: 0.014, squareness: 1.9 },
      { at: -0.015, halfWidth: 0.013, halfDepth: 0.012, squareness: 1.9 },
      { at: 0.015, halfWidth: 0.01, halfDepth: 0.01, squareness: 1.9 },
      { at: 0.04, halfWidth: 0.006, halfDepth: 0.007, squareness: 1.9 },
    ],
    segments: 12,
    rings: 16,
  },
]

/* ------------------------------------------------------------------ *
 * Bladder — flatter base, rounded dome, a slight forward bulge.
 * ------------------------------------------------------------------ */
const BLADDER: readonly LoftPart[] = [
  {
    sections: [
      { at: -0.02, halfWidth: 0.02, halfDepth: 0.018, squareness: 2.0 },
      { at: -0.005, halfWidth: 0.034, halfDepth: 0.03, squareness: 1.8 },
      { at: 0.012, halfWidth: 0.032, halfDepth: 0.028, centreB: 0.004, squareness: 1.8 },
      { at: 0.026, halfWidth: 0.018, halfDepth: 0.016, squareness: 1.8 },
    ],
    segments: 14,
    rings: 16,
  },
]

/* ------------------------------------------------------------------ *
 * Brain — a proportioned ellipsoid: taller than it is deep, deeper than it is
 * wide, narrowing toward the brainstem rather than a uniformly scaled sphere.
 * ------------------------------------------------------------------ */
const BRAIN: readonly LoftPart[] = [
  {
    sections: [
      { at: -0.05, halfWidth: 0.018, halfDepth: 0.02, squareness: 1.9 },
      { at: -0.028, halfWidth: 0.05, halfDepth: 0.056, squareness: 1.85 },
      { at: -0.004, halfWidth: 0.062, halfDepth: 0.068, squareness: 1.8 },
      { at: 0.026, halfWidth: 0.058, halfDepth: 0.062, squareness: 1.85 },
      { at: 0.05, halfWidth: 0.036, halfDepth: 0.04, squareness: 1.9 },
    ],
    segments: 22,
    rings: 24,
  },
]

/* ------------------------------------------------------------------ *
 * Thyroid — two lobes and a bridging isthmus, merged into one mesh. The
 * profile is authored once and offset for each side and for the isthmus.
 * ------------------------------------------------------------------ */
function thyroidLobe(side: 1 | -1): LoftPart {
  return {
    sections: [
      { at: -0.014, halfWidth: 0.008, halfDepth: 0.007, centreA: side * 0.014, squareness: 1.9 },
      { at: 0, halfWidth: 0.013, halfDepth: 0.011, centreA: side * 0.016, squareness: 1.9 },
      { at: 0.014, halfWidth: 0.007, halfDepth: 0.006, centreA: side * 0.014, squareness: 1.9 },
    ],
    segments: 12,
    rings: 12,
  }
}

const THYROID: readonly LoftPart[] = [
  thyroidLobe(1),
  thyroidLobe(-1),
  {
    // The isthmus — a thin bridge across the midline.
    sections: [
      { at: -0.006, halfWidth: 0.013, halfDepth: 0.006, squareness: 2.0 },
      { at: 0.006, halfWidth: 0.013, halfDepth: 0.006, squareness: 2.0 },
    ],
    segments: 10,
    rings: 4,
  },
]

/* ------------------------------------------------------------------ *
 * Uterus — a pear silhouette: narrow cervix, widening to the fundus.
 * ------------------------------------------------------------------ */
const UTERUS: readonly LoftPart[] = [
  {
    sections: [
      { at: -0.024, halfWidth: 0.01, halfDepth: 0.012, squareness: 1.8 },
      { at: -0.008, halfWidth: 0.02, halfDepth: 0.022, squareness: 1.8 },
      { at: 0.01, halfWidth: 0.026, halfDepth: 0.024, squareness: 1.8 },
      { at: 0.022, halfWidth: 0.02, halfDepth: 0.018, squareness: 1.8 },
    ],
    segments: 14,
    rings: 16,
  },
]

/* ------------------------------------------------------------------ *
 * Ovaries — one small almond profile, mirrored for the other side.
 * ------------------------------------------------------------------ */
const OVARY: readonly LoftPart[] = [
  {
    sections: [
      { at: -0.012, halfWidth: 0.007, halfDepth: 0.009, squareness: 1.9 },
      { at: 0, halfWidth: 0.01, halfDepth: 0.012, squareness: 1.9 },
      { at: 0.012, halfWidth: 0.006, halfDepth: 0.008, squareness: 1.9 },
    ],
    segments: 10,
    rings: 12,
  },
]

/**
 * Every lofted organ's parts, keyed by organ id. `anatomy.ts` looks up an
 * organ's parts here when its `shape` is `'lofted'`; the mesh is built once
 * and cached (see `use-figure-geometry.ts`-style memoization at the call
 * site), never rebuilt per frame.
 */
export const ORGAN_LOFTS: Partial<Record<OrganId, readonly LoftPart[]>> = {
  liver: LIVER,
  'left-lung': LUNG_WITH_NOTCH,
  'right-lung': LUNG,
  heart: HEART,
  'left-kidney': KIDNEY,
  'right-kidney': KIDNEY,
  stomach: STOMACH,
  spleen: SPLEEN,
  pancreas: PANCREAS,
  bladder: BLADDER,
  brain: BRAIN,
  thyroid: THYROID,
  uterus: UTERUS,
  'left-ovary': OVARY,
  'right-ovary': OVARY,
}

const geometryCache = new Map<OrganId, ReturnType<typeof buildOrganGeometry>>()

/** Builds (and caches) an organ's lofted geometry, in its own local frame. */
export function organGeometryFor(id: OrganId): ReturnType<typeof buildOrganGeometry> | undefined {
  const parts = ORGAN_LOFTS[id]
  if (!parts) return undefined
  const cached = geometryCache.get(id)
  if (cached) return cached
  const geometry = buildOrganGeometry(parts)
  geometryCache.set(id, geometry)
  return geometry
}

/** The organ's true local half-extents, for the containment safety check. */
export function organBoundsFor(id: OrganId): { halfWidth: number; halfDepth: number } | undefined {
  const parts = ORGAN_LOFTS[id]
  return parts ? organLocalBounds(parts) : undefined
}
