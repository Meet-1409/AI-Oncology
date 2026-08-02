/**
 * The human figure.
 *
 * A continuous, anatomically-proportioned body built from primitives. Every
 * segment overlaps its neighbours and every joint carries a sphere, so the form
 * reads as one body rather than as floating parts.
 *
 * Proportions follow standard adult figure drawing: roughly 7.5 head-heights
 * tall, shoulders about two head-widths across, the elbow at the waist and the
 * wrist at the hip. Feet rest at y = -0.51, crown at y = 1.31.
 *
 * This represents body structure [09.6 §5]. It is deliberately NOT an exact
 * physical replica of any patient [00 §6.4].
 */

export type SegmentShape = 'sphere' | 'capsule' | 'cylinder' | 'box'

export interface FigureSegment {
  key: string
  shape: SegmentShape
  position: readonly [number, number, number]
  /** sphere: [r, w, h] · capsule: [r, len, capSeg, radSeg] · cylinder: [rTop, rBottom, h, seg] · box: [w, h, d] */
  args: readonly number[]
  rotation?: readonly [number, number, number]
  scale?: readonly [number, number, number]
}

/** Mirrors a segment to the other side of the body. */
function mirrored(
  key: string,
  shape: SegmentShape,
  position: readonly [number, number, number],
  args: readonly number[],
  options: { rotation?: readonly [number, number, number]; scale?: readonly [number, number, number] } = {},
): FigureSegment[] {
  return [-1, 1].map((side) => ({
    key: `${key}-${side < 0 ? 'l' : 'r'}`,
    shape,
    position: [position[0] * side, position[1], position[2]] as const,
    args,
    ...(options.rotation
      ? { rotation: [options.rotation[0], options.rotation[1], options.rotation[2] * side] as const }
      : {}),
    ...(options.scale ? { scale: options.scale } : {}),
  }))
}

export const FIGURE: readonly FigureSegment[] = [
  /* ---- Head and neck ---- */
  // Cranium: an ovoid, not a ball — the single biggest cue that a figure is human.
  { key: 'cranium', shape: 'sphere', position: [0, 1.185, 0.004], args: [0.108, 24, 20], scale: [0.92, 1.18, 1] },
  // Jaw, tapering forward and down.
  { key: 'jaw', shape: 'sphere', position: [0, 1.085, 0.022], args: [0.078, 18, 14], scale: [0.9, 0.82, 1.02] },
  { key: 'neck', shape: 'cylinder', position: [0, 1.005, -0.004], args: [0.046, 0.054, 0.11, 16] },
  // Trapezius: the slope from neck to shoulder.
  { key: 'trapezius', shape: 'sphere', position: [0, 0.945, -0.01], args: [0.12, 20, 14], scale: [1.45, 0.5, 0.85] },

  /* ---- Torso ---- */
  // Ribcage: broad at the chest, tapering toward the waist.
  { key: 'ribcage', shape: 'capsule', position: [0, 0.80, 0], args: [0.155, 0.20, 6, 20], scale: [1.2, 1, 0.72] },
  // Waist, narrower — gives the torso a human silhouette rather than a barrel.
  { key: 'waist', shape: 'capsule', position: [0, 0.60, 0], args: [0.128, 0.10, 5, 18], scale: [1.14, 1, 0.76] },
  // Pelvis, widening again.
  { key: 'pelvis', shape: 'capsule', position: [0, 0.42, 0], args: [0.142, 0.11, 5, 18], scale: [1.16, 1, 0.8] },
  { key: 'hips', shape: 'sphere', position: [0, 0.33, 0], args: [0.135, 20, 14], scale: [1.24, 0.72, 0.86] },

  /* ---- Shoulders and arms ---- */
  ...mirrored('deltoid', 'sphere', [0.196, 0.905, 0], [0.062, 18, 14]),
  ...mirrored('upper-arm', 'capsule', [0.207, 0.775, 0], [0.047, 0.20, 5, 14], {
    rotation: [0, 0, 0.055],
  }),
  ...mirrored('elbow', 'sphere', [0.219, 0.645, 0], [0.043, 16, 12]),
  ...mirrored('forearm', 'capsule', [0.228, 0.525, 0], [0.038, 0.19, 5, 14], {
    rotation: [0, 0, 0.022],
  }),
  ...mirrored('wrist', 'sphere', [0.234, 0.408, 0], [0.031, 14, 10]),
  // Hand: a flattened form, wider than deep, so it reads as a hand not a knob.
  ...mirrored('hand', 'capsule', [0.236, 0.352, 0.004], [0.032, 0.062, 4, 12], {
    scale: [1, 1, 0.52],
  }),

  /* ---- Legs ---- */
  ...mirrored('thigh', 'capsule', [0.088, 0.115, 0], [0.072, 0.24, 5, 16], {
    rotation: [0, 0, 0.02],
  }),
  ...mirrored('knee', 'sphere', [0.094, -0.075, 0], [0.06, 16, 12]),
  ...mirrored('calf', 'capsule', [0.096, -0.245, 0.006], [0.056, 0.23, 5, 14]),
  ...mirrored('ankle', 'sphere', [0.098, -0.44, 0], [0.042, 14, 10]),
  // Foot: extends forward, as a foot does.
  ...mirrored('foot', 'box', [0.098, -0.482, 0.052], [0.078, 0.052, 0.185]),
]

/**
 * Organ scale factor.
 *
 * The organs are drawn slightly under true relative size. At true size they fill
 * the torso completely and the silhouette stops reading as a body; slightly
 * smaller, each organ stays individually legible and selectable, which is what
 * the visualization is for.
 */
export const ORGAN_SCALE = 0.82
