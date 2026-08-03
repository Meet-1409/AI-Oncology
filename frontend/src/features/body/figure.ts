import * as THREE from 'three'

/**
 * The human figure.
 *
 * NOT assembled from primitives. The body is a set of continuous lofted
 * surfaces: cross-sections are defined at real anatomical landmarks,
 * interpolated with a Catmull-Rom spline into a dense ring stack, and skinned
 * into one smooth mesh. That is how a human form is actually modelled, and it
 * is the reason this reads as a body rather than as a mannequin — a sphere
 * joined to a cylinder always looks like a sphere joined to a cylinder, however
 * carefully it is placed.
 *
 * Proportions are anthropometric rather than eyeballed. The figure is 1.82
 * units tall with the floor at y = -0.51 and the crown at y = 1.31, so one unit
 * is one metre and every landmark below is a real fraction of stature:
 *
 *   crown 1.000 · chin 0.870 · shoulder 0.818 · nipple 0.720 · waist 0.640
 *   elbow 0.630 · hip 0.530 · crotch 0.470 · wrist 0.485 · knee 0.285
 *   ankle 0.039
 *
 * This represents body structure [09.6 §5]. It is deliberately NOT an exact
 * physical replica of any patient [00 §6.4] — it is one canonical adult form,
 * the same for every patient, carrying only the disease information the record
 * actually contains.
 */

/* ------------------------------------------------------------------ *
 * Cross-sections
 * ------------------------------------------------------------------ */

export interface Section {
  /** Position along the loft axis. */
  at: number
  /** Half-extent across the body. */
  halfWidth: number
  /** Half-extent forward of centre. */
  halfDepth: number
  /**
   * Half-extent behind centre. Defaults to halfDepth.
   *
   * A human body is not front-back symmetric anywhere, and pretending it is
   * costs more realism than any other single simplification: the chest projects
   * forward while the upper back is nearly flat, and the buttocks project
   * backward while the front of the hip does not. Two independent depths give
   * the profile view its shape.
   */
  backDepth?: number
  /** Lateral centre, used by the limbs. */
  centreA?: number
  /** Front-back centre. */
  centreB?: number
  /**
   * Superellipse exponent. 2 is a true ellipse; above 2 squares the section off.
   * The torso is flatter across the chest and back than an ellipse; the head,
   * neck, shoulder cap and limbs are not, and squaring those off is what makes
   * a figure look manufactured.
   */
  squareness?: number
}

/**
 * Which form to build.
 *
 * The Body is drawn from the sex recorded in the patient's own record, because
 * a figure that does not match the person it represents is a small, constant
 * signal that the record is not really theirs — and because the sites that
 * matter clinically (breast, prostate, pelvis) sit differently on the two
 * forms.
 *
 * `neutral` is the honest answer when the record says Other or says nothing.
 * Guessing would be worse than being plainly non-committal.
 */
export type BodyForm = 'male' | 'female' | 'neutral'

export function bodyFormFor(gender: string | undefined): BodyForm {
  if (gender === 'Male') return 'male'
  if (gender === 'Female') return 'female'
  return 'neutral'
}

/**
 * How the female form differs from the male one, as multipliers on the trunk
 * profile at four landmark heights.
 *
 * These are the differences that actually register: narrower shoulders, a
 * genuinely narrower waist, wider hips, and a smaller head and jaw. The
 * shoulder-to-hip ratio is the single strongest cue — roughly 1.18 male and
 * 1.03 female — and getting only that right already reads correctly.
 *
 * IMPORTANT: both forms share one vertical frame, crown at 1.31 and floor at
 * -0.51. Real adult stature differs between them, but the organ coordinates in
 * anatomy.ts are absolute, so two different heights would need two organ sets
 * and would double the surface on which an organ can end up in the wrong place.
 * This is a schematic of body structure [09.6 §5], not a measurement of any
 * person [00 §6.4], so a shared frame costs nothing clinically and removes a
 * whole class of defect.
 */
interface FormShaping {
  /** Shoulder and upper chest width. */
  shoulder: number
  /** Chest depth — the breast contour rides on this. */
  chest: number
  /** Waist width. */
  waist: number
  /** Hip and buttock width. */
  hip: number
  /** Head and jaw. */
  head: number
  /** Limb thickness. */
  limb: number
}

const SHAPING: Readonly<Record<BodyForm, FormShaping>> = {
  male: { shoulder: 1, chest: 1, waist: 1, hip: 1, head: 1, limb: 1 },
  female: { shoulder: 0.88, chest: 1.06, waist: 0.90, hip: 1.10, head: 0.95, limb: 0.92 },
  // Deliberately between the two rather than a copy of either.
  neutral: { shoulder: 0.94, chest: 1.03, waist: 0.95, hip: 1.05, head: 0.975, limb: 0.96 },
}

/**
 * Head, neck and torso — one continuous surface from crown to pelvic floor.
 *
 * Most of the character sits in four transitions: the narrowing at the chin,
 * the slope from neck to shoulder, the taper into the waist, and the flare back
 * out over the hips. Those are what the eye reads as "human".
 *
 * Written as the male form; `shapeTrunk` derives the others from it.
 */
const TRUNK: readonly Section[] = [
  /* ---- Cranium ---- */
  // The skull is a rounded box, not an egg. Its height-to-width ratio is close
  // to 1.45; taller than that and the head reads as a mannequin's blank, which
  // is exactly what a too-aggressive crown taper produces.
  { at: 1.310, halfWidth: 0.042, halfDepth: 0.046, backDepth: 0.050, squareness: 2.1 },
  { at: 1.298, halfWidth: 0.062, halfDepth: 0.068, backDepth: 0.074, squareness: 2.05 },
  { at: 1.278, halfWidth: 0.073, halfDepth: 0.082, backDepth: 0.089, squareness: 2.0 },
  // Widest point of the skull
  { at: 1.252, halfWidth: 0.078, halfDepth: 0.091, backDepth: 0.097, squareness: 2.0 },
  { at: 1.225, halfWidth: 0.079, halfDepth: 0.096, backDepth: 0.098, squareness: 2.0 },
  // Brow — the face projects forward while the skull behind it does not
  { at: 1.200, halfWidth: 0.078, halfDepth: 0.100, backDepth: 0.096, squareness: 2.0 },
  { at: 1.178, halfWidth: 0.075, halfDepth: 0.101, backDepth: 0.092, squareness: 2.0 },
  // Cheekbone
  { at: 1.152, halfWidth: 0.069, halfDepth: 0.098, backDepth: 0.086, squareness: 2.0 },
  // Jaw angle
  { at: 1.126, halfWidth: 0.059, halfDepth: 0.090, backDepth: 0.078, squareness: 2.0 },
  // Chin
  { at: 1.100, halfWidth: 0.042, halfDepth: 0.072, backDepth: 0.062, squareness: 2.0 },
  { at: 1.082, halfWidth: 0.037, halfDepth: 0.052, backDepth: 0.052, squareness: 2.0 },
  /* ---- Neck ----
     Kept genuinely visible. A short neck is the fastest way to make a figure
     read as a doll: the head appears to sit straight on the shoulders. */
  { at: 1.048, halfWidth: 0.049, halfDepth: 0.049, backDepth: 0.055, centreB: -0.008, squareness: 2.0 },
  { at: 1.015, halfWidth: 0.055, halfDepth: 0.053, backDepth: 0.062, centreB: -0.010, squareness: 2.0 },
  { at: 0.982, halfWidth: 0.064, halfDepth: 0.058, backDepth: 0.068, centreB: -0.010, squareness: 2.0 },
  /* ---- Clavicle and trapezius ----
     The trunk does NOT carry the shoulder width; the deltoid belongs to the arm
     and is lofted with it. A torso widened to the acromion produces the square
     shoulder-pad silhouette that reads as armour rather than anatomy. */
  { at: 0.955, halfWidth: 0.084, halfDepth: 0.064, backDepth: 0.076, centreB: -0.008, squareness: 2.05 },
  { at: 0.935, halfWidth: 0.112, halfDepth: 0.076, backDepth: 0.086, centreB: -0.006, squareness: 2.1 },
  { at: 0.915, halfWidth: 0.134, halfDepth: 0.088, backDepth: 0.094, centreB: -0.004, squareness: 2.15 },
  { at: 0.895, halfWidth: 0.148, halfDepth: 0.098, backDepth: 0.100, centreB: -0.002, squareness: 2.2 },
  /* ---- Thorax ---- */
  { at: 0.868, halfWidth: 0.154, halfDepth: 0.108, backDepth: 0.102, squareness: 2.3 },
  // Nipple line, chest at its fullest
  { at: 0.840, halfWidth: 0.157, halfDepth: 0.116, backDepth: 0.100, squareness: 2.35 },
  { at: 0.800, halfWidth: 0.155, halfDepth: 0.116, backDepth: 0.098, squareness: 2.35 },
  // Lower ribs
  { at: 0.755, halfWidth: 0.150, halfDepth: 0.110, backDepth: 0.096, squareness: 2.35 },
  { at: 0.715, halfWidth: 0.145, halfDepth: 0.104, backDepth: 0.094, squareness: 2.3 },
  /* ---- Waist ----
     A real taper. Chest-to-waist is roughly 0.88; anything closer to 1 and the
     torso reads as a barrel however good the rest of the figure is. */
  { at: 0.675, halfWidth: 0.140, halfDepth: 0.098, backDepth: 0.092, squareness: 2.25 },
  // Navel — narrowest point
  { at: 0.640, halfWidth: 0.138, halfDepth: 0.098, backDepth: 0.090, squareness: 2.2 },
  /* ---- Pelvis ---- */
  { at: 0.600, halfWidth: 0.144, halfDepth: 0.100, backDepth: 0.096, squareness: 2.2 },
  // Iliac crest
  { at: 0.560, halfWidth: 0.155, halfDepth: 0.104, backDepth: 0.106, squareness: 2.25 },
  { at: 0.515, halfWidth: 0.168, halfDepth: 0.106, backDepth: 0.118, squareness: 2.25 },
  // Greater trochanter — widest point of the lower body, buttock projecting back
  { at: 0.478, halfWidth: 0.172, halfDepth: 0.104, backDepth: 0.124, centreB: -0.004, squareness: 2.25 },
  { at: 0.445, halfWidth: 0.166, halfDepth: 0.098, backDepth: 0.118, centreB: -0.006, squareness: 2.2 },
  // Closes below the crotch, narrow enough that the end cap finishes INSIDE the
  // two thigh lofts. Ending it wider leaves a flat disc across the hips — the
  // single most obvious artefact a lofted figure can have, and one that reads
  // as a broken render rather than as a stylisation.
  { at: 0.415, halfWidth: 0.152, halfDepth: 0.092, backDepth: 0.104, centreB: -0.006, squareness: 2.1 },
  { at: 0.390, halfWidth: 0.128, halfDepth: 0.082, backDepth: 0.090, centreB: -0.004, squareness: 2.05 },
  { at: 0.362, halfWidth: 0.098, halfDepth: 0.072, backDepth: 0.076, centreB: -0.002, squareness: 2.0 },
  { at: 0.338, halfWidth: 0.070, halfDepth: 0.058, backDepth: 0.060, squareness: 2.0 },
]

/**
 * Applies a form's shaping to the trunk profile.
 *
 * Each landmark multiplier is blended smoothly across the height it governs, so
 * a narrower waist eases into a wider hip rather than stepping between them.
 * A hard switch here would produce a visible ledge at the exact place a human
 * body is smoothest.
 */
function shapeTrunk(form: BodyForm): Section[] {
  const shaping = SHAPING[form]

  /** Smooth 0-1 ramp between two heights. */
  const ramp = (y: number, from: number, to: number) => {
    const t = Math.min(1, Math.max(0, (y - from) / (to - from)))
    return t * t * (3 - 2 * t)
  }

  return TRUNK.map((section) => {
    const y = section.at

    // Which landmark governs this height, blended at the boundaries.
    const headness = ramp(y, 1.02, 1.09)
    const shoulderness = ramp(y, 0.83, 0.94) * (1 - headness)
    const waistness = (1 - ramp(y, 0.62, 0.80)) * ramp(y, 0.52, 0.64)
    const hipness = 1 - ramp(y, 0.40, 0.56)
    const chestness = ramp(y, 0.72, 0.86) * (1 - headness) * (1 - shoulderness)

    const widthScale =
      1 +
      (shaping.head - 1) * headness +
      (shaping.shoulder - 1) * shoulderness +
      (shaping.waist - 1) * waistness +
      (shaping.hip - 1) * hipness

    const depthScale = 1 + (shaping.head - 1) * headness + (shaping.chest - 1) * chestness

    return {
      ...section,
      halfWidth: section.halfWidth * widthScale,
      halfDepth: section.halfDepth * depthScale,
      ...(section.backDepth === undefined
        ? {}
        : { backDepth: section.backDepth * (1 + (shaping.hip - 1) * hipness) }),
    }
  })
}

/** Applies a form's limb thickness. Limb placement follows shoulder width. */
function shapeLimb(sections: Section[], form: BodyForm, follows: 'shoulder' | 'hip'): Section[] {
  const shaping = SHAPING[form]
  const spread = follows === 'shoulder' ? shaping.shoulder : shaping.hip
  return sections.map((section) => ({
    ...section,
    halfWidth: section.halfWidth * shaping.limb,
    halfDepth: section.halfDepth * shaping.limb,
    ...(section.backDepth === undefined ? {} : { backDepth: section.backDepth * shaping.limb }),
    ...(section.centreA === undefined
      ? {}
      : { centreA: section.centreA * (1 + (spread - 1) * 0.8) }),
  }))
}

/**
 * Arm, deltoid to wrist.
 *
 * Carries the shoulder cap itself, starting inside the trapezius. Modelling the
 * deltoid as part of the arm rather than as extra torso width is what gives a
 * rounded shoulder instead of a shelf, and it is how the joint actually works.
 */
function arm(side: 1 | -1): Section[] {
  return [
    // The first ring is small and sits ENTIRELY inside the trapezius. A loft is
    // closed by a flat cap at each end; if that cap is wider than the trunk it
    // is buried in, it protrudes as a hard disc on the shoulder. Burying the
    // first ring is what makes the arm grow out of the body instead of being
    // stuck onto it.
    { at: 0.945, halfWidth: 0.032, halfDepth: 0.036, centreA: side * 0.052 },
    { at: 0.936, halfWidth: 0.048, halfDepth: 0.051, centreA: side * 0.098 },
    { at: 0.922, halfWidth: 0.056, halfDepth: 0.058, centreA: side * 0.122 },
    // Crown of the deltoid — the widest point of the whole figure
    { at: 0.906, halfWidth: 0.059, halfDepth: 0.061, centreA: side * 0.140 },
    { at: 0.885, halfWidth: 0.057, halfDepth: 0.059, centreA: side * 0.148 },
    // Biceps
    { at: 0.850, halfWidth: 0.050, halfDepth: 0.053, centreA: side * 0.158 },
    { at: 0.790, halfWidth: 0.045, halfDepth: 0.048, centreA: side * 0.168 },
    { at: 0.710, halfWidth: 0.040, halfDepth: 0.043, centreA: side * 0.178 },
    // Elbow. The arm is carried clear of the waist — a standing figure does not
    // press its forearms against its hips, and the daylight between arm and
    // torso is most of what makes a pose read as relaxed rather than rigid.
    { at: 0.645, halfWidth: 0.038, halfDepth: 0.042, centreA: side * 0.185 },
    // Forearm belly, wider than the elbow — a forearm is not a cone
    { at: 0.595, halfWidth: 0.040, halfDepth: 0.042, centreA: side * 0.190 },
    { at: 0.525, halfWidth: 0.035, halfDepth: 0.037, centreA: side * 0.196 },
    { at: 0.455, halfWidth: 0.028, halfDepth: 0.030, centreA: side * 0.201 },
    // Wrist
    { at: 0.400, halfWidth: 0.023, halfDepth: 0.027, centreA: side * 0.205 },
    { at: 0.375, halfWidth: 0.022, halfDepth: 0.029, centreA: side * 0.206 },
  ]
}

/**
 * Hand. Flattened side to side and hanging with the palm toward the thigh, so
 * it is deeper than it is wide — the detail that stops a hand reading as a knob.
 * The fingertips end blunt rather than at a point; a tapered cone reads as a
 * claw.
 */
function hand(side: 1 | -1): Section[] {
  return [
    { at: 0.386, halfWidth: 0.023, halfDepth: 0.030, centreA: side * 0.193, centreB: 0.002 },
    { at: 0.356, halfWidth: 0.022, halfDepth: 0.042, centreA: side * 0.194, centreB: 0.005 },
    // Knuckles
    { at: 0.326, halfWidth: 0.021, halfDepth: 0.047, centreA: side * 0.195, centreB: 0.005 },
    { at: 0.288, halfWidth: 0.019, halfDepth: 0.045, centreA: side * 0.195, centreB: 0.003 },
    { at: 0.240, halfWidth: 0.016, halfDepth: 0.038, centreA: side * 0.194 },
    { at: 0.200, halfWidth: 0.013, halfDepth: 0.030, centreA: side * 0.193 },
    { at: 0.180, halfWidth: 0.009, halfDepth: 0.019, centreA: side * 0.193 },
  ]
}

/** Leg, hip to ankle. */
function leg(side: 1 | -1): Section[] {
  return [
    // Begins inside the pelvis, so hip and thigh are one mass
    // As with the arm, the closing cap is buried well inside the pelvis. A cap
    // left wider than the hip it sits in draws a hard horizontal line straight
    // across the figure — the most conspicuous artefact this construction can
    // produce, and the one that most makes a body look broken rather than
    // stylised.
    { at: 0.588, halfWidth: 0.062, halfDepth: 0.066, backDepth: 0.070, centreA: side * 0.070 },
    { at: 0.545, halfWidth: 0.086, halfDepth: 0.092, backDepth: 0.100, centreA: side * 0.080 },
    { at: 0.470, halfWidth: 0.091, halfDepth: 0.096, backDepth: 0.106, centreA: side * 0.083 },
    // Thigh
    { at: 0.390, halfWidth: 0.088, halfDepth: 0.094, backDepth: 0.098, centreA: side * 0.082 },
    { at: 0.300, halfWidth: 0.079, halfDepth: 0.085, backDepth: 0.087, centreA: side * 0.081 },
    { at: 0.190, halfWidth: 0.067, halfDepth: 0.072, backDepth: 0.074, centreA: side * 0.080 },
    { at: 0.090, halfWidth: 0.059, halfDepth: 0.064, backDepth: 0.064, centreA: side * 0.079 },
    // Knee — the patella projects forward, the back of the joint does not
    { at: 0.030, halfWidth: 0.056, halfDepth: 0.062, backDepth: 0.058, centreA: side * 0.078, centreB: 0.004 },
    { at: -0.010, halfWidth: 0.053, halfDepth: 0.057, backDepth: 0.056, centreA: side * 0.077 },
    // Calf belly, sitting behind the shin
    { at: -0.070, halfWidth: 0.058, halfDepth: 0.052, backDepth: 0.072, centreA: side * 0.077, centreB: -0.006 },
    { at: -0.140, halfWidth: 0.053, halfDepth: 0.048, backDepth: 0.062, centreA: side * 0.077, centreB: -0.004 },
    { at: -0.230, halfWidth: 0.040, halfDepth: 0.040, backDepth: 0.044, centreA: side * 0.077 },
    // Ankle
    { at: -0.320, halfWidth: 0.032, halfDepth: 0.034, backDepth: 0.036, centreA: side * 0.077 },
    { at: -0.395, halfWidth: 0.028, halfDepth: 0.031, backDepth: 0.034, centreA: side * 0.077 },
    { at: -0.442, halfWidth: 0.026, halfDepth: 0.031, backDepth: 0.033, centreA: side * 0.077 },
  ]
}

/**
 * Foot. Lofted along z rather than y, because a foot's long axis points
 * forward: heel behind the ankle, ball ahead of it, toes tapering away. In this
 * loft `centreB` is the vertical centre, since the section plane is xy.
 */
function foot(side: 1 | -1): Section[] {
  return [
    // Heel, projecting behind the ankle as a real heel does
    { at: -0.078, halfWidth: 0.022, halfDepth: 0.024, centreA: side * 0.077, centreB: -0.482 },
    { at: -0.055, halfWidth: 0.029, halfDepth: 0.034, centreA: side * 0.077, centreB: -0.474 },
    // Under the ankle
    { at: -0.020, halfWidth: 0.032, halfDepth: 0.038, centreA: side * 0.077, centreB: -0.470 },
    // Instep
    { at: 0.020, halfWidth: 0.034, halfDepth: 0.033, centreA: side * 0.078, centreB: -0.475 },
    { at: 0.062, halfWidth: 0.035, halfDepth: 0.026, centreA: side * 0.079, centreB: -0.482 },
    // Ball of the foot
    { at: 0.104, halfWidth: 0.034, halfDepth: 0.020, centreA: side * 0.080, centreB: -0.488 },
    // Toes
    { at: 0.136, halfWidth: 0.029, halfDepth: 0.015, centreA: side * 0.080, centreB: -0.493 },
    { at: 0.156, halfWidth: 0.016, halfDepth: 0.008, centreA: side * 0.080, centreB: -0.500 },
  ]
}

/* ------------------------------------------------------------------ *
 * Lofting
 * ------------------------------------------------------------------ */

/**
 * Catmull-Rom through one channel of section values.
 *
 * Linear interpolation between sections would crease at every landmark — the
 * figure would look faceted, which is the exact failure being fixed. A cubic
 * spline gives the continuous curvature a body actually has.
 */
function spline(values: readonly number[], t: number): number {
  const count = values.length
  if (count === 1) return values[0] as number

  const scaled = t * (count - 1)
  const index = Math.min(count - 2, Math.floor(scaled))
  const f = scaled - index

  const p0 = values[Math.max(0, index - 1)] as number
  const p1 = values[index] as number
  const p2 = values[index + 1] as number
  const p3 = values[Math.min(count - 1, index + 2)] as number

  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * f +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f +
      (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f)
  )
}

interface Channels {
  at: number[]
  halfWidth: number[]
  halfDepth: number[]
  backDepth: number[]
  centreA: number[]
  centreB: number[]
  squareness: number[]
}

function channelsOf(sections: readonly Section[]): Channels {
  return {
    at: sections.map((s) => s.at),
    halfWidth: sections.map((s) => s.halfWidth),
    halfDepth: sections.map((s) => s.halfDepth),
    backDepth: sections.map((s) => s.backDepth ?? s.halfDepth),
    centreA: sections.map((s) => s.centreA ?? 0),
    centreB: sections.map((s) => s.centreB ?? 0),
    squareness: sections.map((s) => s.squareness ?? 2),
  }
}

/** A superellipse coordinate. At exponent 2 this is exactly an ellipse. */
function superellipse(theta: number, half: number, exponent: number): number {
  const raw = Math.cos(theta)
  if (exponent === 2) return half * raw
  return half * Math.sign(raw) * Math.abs(raw) ** (2 / exponent)
}

interface Part {
  positions: number[]
  indices: number[]
}

/**
 * Skins a stack of interpolated cross-sections into a closed surface.
 *
 * The ring is closed by modular indexing rather than by repeating the first
 * vertex, so there is no duplicated seam and `computeVertexNormals` produces a
 * smooth surface all the way round. A repeated seam vertex would leave a
 * visible crease running the length of the figure.
 */
/**
 * Surface relief.
 *
 * Returns a radius multiplier for a point at height fraction `t` and angle
 * `theta`, where theta = pi/2 is directly in front and 3*pi/2 directly behind.
 * This is what puts a sternum groove between the pectorals and a furrow down
 * the spine — the small landmarks the eye uses to decide whether it is looking
 * at a body or at a smooth shape shaped like one.
 */
export type Relief = (t: number, theta: number, at: number) => number

function loft(
  sections: readonly Section[],
  options: {
    axis: 'y' | 'z'
    segments?: number
    rings?: number
    relief?: Relief
    /** Applied to every vertex after lofting, for limbs that are not vertical. */
    transform?: THREE.Matrix4
  },
): Part {
  const { axis, segments = 44, rings = 64, relief, transform } = options
  const channel = channelsOf(sections)

  const positions: number[] = []
  const indices: number[] = []

  for (let r = 0; r < rings; r++) {
    const t = r / (rings - 1)
    const at = spline(channel.at, t)
    const halfWidth = Math.max(0.0006, spline(channel.halfWidth, t))
    const frontDepth = Math.max(0.0006, spline(channel.halfDepth, t))
    const backDepth = Math.max(0.0006, spline(channel.backDepth, t))
    const centreA = spline(channel.centreA, t)
    const centreB = spline(channel.centreB, t)
    const exponent = Math.max(1.4, spline(channel.squareness, t))

    for (let s = 0; s < segments; s++) {
      const theta = (s / segments) * Math.PI * 2
      // The depth half-axis switches at the sides, where both are zero, so the
      // asymmetric section stays continuous rather than stepping.
      const forward = Math.sin(theta) >= 0
      const scale = relief ? relief(t, theta, at) : 1
      const a = centreA + superellipse(theta, halfWidth * scale, exponent)
      const b =
        centreB +
        superellipse(theta - Math.PI / 2, (forward ? frontDepth : backDepth) * scale, exponent)

      if (axis === 'y') positions.push(a, at, b)
      else positions.push(a, b, at)
    }
  }

  for (let r = 0; r < rings - 1; r++) {
    for (let s = 0; s < segments; s++) {
      const next = (s + 1) % segments
      const a = r * segments + s
      const b = r * segments + next
      const c = (r + 1) * segments + next
      const d = (r + 1) * segments + s
      indices.push(a, b, c, a, c, d)
    }
  }

  // Cap both ends with a fan to the ring centroid. The profiles taper to almost
  // nothing at the crown and the fingertips so the caps are tiny, but without
  // them the surface is open and lighting reads it as a hole.
  const capEnd = (ringIndex: number, flip: boolean) => {
    const base = ringIndex * segments
    let x = 0
    let y = 0
    let z = 0
    for (let s = 0; s < segments; s++) {
      x += positions[(base + s) * 3] as number
      y += positions[(base + s) * 3 + 1] as number
      z += positions[(base + s) * 3 + 2] as number
    }
    positions.push(x / segments, y / segments, z / segments)
    const centre = positions.length / 3 - 1
    for (let s = 0; s < segments; s++) {
      const next = (s + 1) % segments
      if (flip) indices.push(centre, base + next, base + s)
      else indices.push(centre, base + s, base + next)
    }
  }

  capEnd(0, true)
  capEnd(rings - 1, false)

  if (transform) {
    const point = new THREE.Vector3()
    for (let i = 0; i < positions.length; i += 3) {
      point
        .set(positions[i] as number, positions[i + 1] as number, positions[i + 2] as number)
        .applyMatrix4(transform)
      positions[i] = point.x
      positions[i + 1] = point.y
      positions[i + 2] = point.z
    }
  }

  return { positions, indices }
}

/**
 * One lofted piece of an organ — the same technique the body shell uses, at
 * organ scale. Most organs are one part; a few (the thyroid's two lobes) are
 * several parts merged into a single mesh, the same way `buildFigureGeometry`
 * merges the trunk and every limb.
 */
export interface LoftPart {
  sections: readonly Section[]
  axis?: 'y' | 'z'
  segments?: number
  rings?: number
  relief?: Relief
}

/**
 * Builds an organ mesh from one or more lofted parts, in the organ's own small
 * local frame — the caller positions, rotates and scales it into the body with
 * the same `position`/`rotation`/`scale` mesh props already used for every
 * primitive organ, so placement is unchanged by this technique.
 */
export function buildOrganGeometry(parts: readonly LoftPart[]): THREE.BufferGeometry {
  const built = parts.map((part) =>
    loft(part.sections, {
      axis: part.axis ?? 'y',
      segments: part.segments,
      rings: part.rings,
      relief: part.relief,
    }),
  )

  const positions: number[] = []
  const indices: number[] = []
  let offset = 0
  for (const part of built) {
    for (const value of part.positions) positions.push(value)
    for (const index of part.indices) indices.push(index + offset)
    offset += part.positions.length / 3
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

/**
 * The true local half-extents of a lofted organ — the widest any ring actually
 * reaches, including its own `centreA`/`centreB` offset.
 *
 * Exported so the patient-safety suite can check a lofted organ sits inside the
 * body the same way it already checks primitive organs, rather than trusting a
 * hand-maintained number that could silently disagree with the shape actually
 * drawn — the exact failure `bodyHalfExtents` above was written to prevent for
 * the body shell.
 */
export function organLocalBounds(parts: readonly LoftPart[]): {
  halfWidth: number
  halfDepth: number
} {
  let halfWidth = 0
  let halfDepth = 0
  for (const part of parts) {
    for (const section of part.sections) {
      halfWidth = Math.max(halfWidth, Math.abs(section.centreA ?? 0) + section.halfWidth)
      const depth = Math.max(section.halfDepth, section.backDepth ?? section.halfDepth)
      halfDepth = Math.max(halfDepth, Math.abs(section.centreB ?? 0) + depth)
    }
  }
  return { halfWidth, halfDepth }
}

/* ------------------------------------------------------------------ *
 * Pose and relief
 * ------------------------------------------------------------------ */

/**
 * The arms are carried away from the body.
 *
 * Every anatomical reference figure stands this way, and it is not decoration:
 * arms held against the torso overlap the trunk silhouette from the front, and
 * the trunk is exactly where most of the selectable anatomy is. Opening the
 * pose clears the chest and abdomen and widens the target area for organ
 * selection [09.6 §9] — the pose that looks right is also the one that works.
 */
// About 21 degrees. A full 40-degree A-pose is what an anatomy reference uses,
// but this figure lives in a panel a few hundred pixels wide: at 40 degrees the
// arms alone claim half the frame, and the trunk — where nearly all the
// selectable anatomy is — shrinks to fit. This clears the torso silhouette
// completely while keeping the body large in the viewport.
const ARM_ANGLE = 0.37
const SHOULDER_PIVOT = { x: 0.128, y: 0.928 }

function armPose(side: 1 | -1): THREE.Matrix4 {
  const pivotX = SHOULDER_PIVOT.x * side
  return new THREE.Matrix4()
    .makeTranslation(pivotX, SHOULDER_PIVOT.y, 0)
    .multiply(new THREE.Matrix4().makeRotationZ(ARM_ANGLE * side))
    .multiply(new THREE.Matrix4().makeTranslation(-pivotX, -SHOULDER_PIVOT.y, 0))
}

/**
 * Rotation to apply to anything that must travel with the arm.
 *
 * The humerus is inside the arm. When the arm moved into an open pose and the
 * bone did not, it stayed behind in the chest — a bone floating in the wrong
 * part of the body, on a display whose entire purpose is showing where things
 * are. Exported so the bone is posed from the same source as the limb rather
 * than from a copied number that can silently fall out of step.
 */
export const armPoseAngle = (side: 1 | -1): number => ARM_ANGLE * side

/** Moves a point from the resting arm position into the posed one. */
export function poseArmPoint(
  point: readonly [number, number, number],
  side: 1 | -1,
): [number, number, number] {
  const pivotX = SHOULDER_PIVOT.x * side
  const dx = point[0] - pivotX
  const dy = point[1] - SHOULDER_PIVOT.y
  const angle = ARM_ANGLE * side
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [pivotX + dx * cos - dy * sin, SHOULDER_PIVOT.y + dx * sin + dy * cos, point[2]]
}

/**
 * Trunk relief — the landmarks that read as anatomy rather than as a shape.
 *
 * Deliberately shallow, a few percent of radius. Deeper modelling of individual
 * muscles would be a claim this visualization is not entitled to make: the form
 * represents body structure [09.6 §5] and is not a replica of any patient
 * [00 §6.4]. These are the few landmarks a viewer needs in order to orient
 * themselves on the body, and nothing beyond that.
 */
function trunkRelief(_t: number, theta: number, at: number): number {
  // Smooth 0-1 band, so relief fades in and out instead of stepping.
  const band = (value: number, from: number, to: number) => {
    const mid = (from + to) / 2
    const half = Math.abs(to - from) / 2
    const d = Math.abs(value - mid) / half
    return d >= 1 ? 0 : Math.cos((d * Math.PI) / 2) ** 2
  }
  // Angular lobe centred on `centre`, width `spread`.
  const lobe = (centre: number, spread: number) => {
    let d = theta - centre
    while (d > Math.PI) d -= Math.PI * 2
    while (d < -Math.PI) d += Math.PI * 2
    return Math.abs(d) >= spread ? 0 : Math.cos((d / spread) * (Math.PI / 2)) ** 2
  }

  const front = Math.PI / 2
  const back = (3 * Math.PI) / 2

  let scale = 1

  // Pectorals, with the sternum falling away between them.
  const chest = band(at, 0.775, 0.895)
  scale += chest * 0.05 * (lobe(front - 0.5, 0.42) + lobe(front + 0.5, 0.42))
  scale -= chest * 0.035 * lobe(front, 0.2)

  // Linea alba, the shallow furrow down the centre of the abdomen.
  scale -= band(at, 0.60, 0.79) * 0.03 * lobe(front, 0.26)

  // The spinal furrow, all the way up the back.
  scale -= band(at, 0.52, 0.94) * 0.04 * lobe(back, 0.22)

  // Shoulder blades.
  scale += band(at, 0.82, 0.93) * 0.028 * (lobe(back - 0.55, 0.38) + lobe(back + 0.55, 0.38))

  // The dip at the side of the waist, above the iliac crest.
  scale -= band(at, 0.60, 0.70) * 0.03 * (lobe(0, 0.5) + lobe(Math.PI, 0.5))

  return scale
}

/* ------------------------------------------------------------------ *
 * The figure
 * ------------------------------------------------------------------ */

/**
 * Builds the complete body as one merged, smooth-shaded surface.
 *
 * The parts interpenetrate at every joint by design — the arm loft begins
 * inside the deltoid, the leg loft inside the pelvis, the foot inside the
 * ankle. An overlapping union has no seam to show, whereas butt-joined parts
 * reveal the join under any lighting.
 */
export function buildFigureGeometry(form: BodyForm = 'neutral'): THREE.BufferGeometry {
  const parts: Part[] = [
    loft(shapeTrunk(form), { axis: 'y', segments: 64, rings: 148, relief: trunkRelief }),
    ...([1, -1] as const).flatMap((side) => {
      const pose = armPose(side)
      return [
        loft(shapeLimb(arm(side), form, 'shoulder'), {
          axis: 'y',
          segments: 28,
          rings: 48,
          transform: pose,
        }),
        loft(shapeLimb(hand(side), form, 'shoulder'), {
          axis: 'y',
          segments: 24,
          rings: 28,
          transform: pose,
        }),
        loft(shapeLimb(leg(side), form, 'hip'), { axis: 'y', segments: 32, rings: 60 }),
        loft(shapeLimb(foot(side), form, 'hip'), { axis: 'z', segments: 24, rings: 28 }),
      ]
    }),
  ]

  const positions: number[] = []
  const indices: number[] = []
  let offset = 0

  for (const part of parts) {
    for (const value of part.positions) positions.push(value)
    for (const index of part.indices) indices.push(index + offset)
    offset += part.positions.length / 3
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

/* ------------------------------------------------------------------ *
 * Containment
 * ------------------------------------------------------------------ */

/**
 * The trunk silhouette at a given height.
 *
 * Exported so the patient-safety suite can assert that no organ pokes through
 * the skin. The test previously carried its own hand-copied table of body
 * widths, which could silently disagree with the figure it was meant to be
 * checking. It now reads the same profile the mesh is built from, so the two
 * cannot drift.
 *
 * Returns null above the crown or below the pelvic floor, where there is no
 * trunk — an organ placed there is itself the defect.
 */
export interface BodyExtents {
  halfWidth: number
  /** Skin distance forward of centre. */
  frontDepth: number
  /** Skin distance behind centre. */
  backDepth: number
  /** Front-back centre offset at this height. */
  centre: number
}

const CONTAINMENT_SAMPLES = 400

function containmentTable(form: BodyForm): (BodyExtents & { y: number })[] {
  const channel = channelsOf(shapeTrunk(form))
  const table: (BodyExtents & { y: number })[] = []
  for (let i = 0; i < CONTAINMENT_SAMPLES; i++) {
    const t = i / (CONTAINMENT_SAMPLES - 1)
    table.push({
      y: spline(channel.at, t),
      halfWidth: spline(channel.halfWidth, t),
      frontDepth: spline(channel.halfDepth, t),
      backDepth: spline(channel.backDepth, t),
      centre: spline(channel.centreB, t),
    })
  }
  return table
}

const CONTAINMENT: Readonly<Record<BodyForm, readonly (BodyExtents & { y: number })[]>> = {
  male: containmentTable('male'),
  female: containmentTable('female'),
  neutral: containmentTable('neutral'),
}

export const BODY_FORMS: readonly BodyForm[] = ['male', 'female', 'neutral']

export function bodyHalfExtents(y: number, form: BodyForm = 'neutral'): BodyExtents | null {
  const table = CONTAINMENT[form]
  const first = table[0]
  const last = table[table.length - 1]
  if (!first || !last) return null
  // The trunk profile runs crown-downward, so `first` is the highest sample.
  if (y > first.y || y < last.y) return null

  let nearest = first
  let bestDistance = Number.POSITIVE_INFINITY
  for (const sample of table) {
    const distance = Math.abs(sample.y - y)
    if (distance < bestDistance) {
      bestDistance = distance
      nearest = sample
    }
  }
  return {
    halfWidth: nearest.halfWidth,
    frontDepth: nearest.frontDepth,
    backDepth: nearest.backDepth,
    centre: nearest.centre,
  }
}

/**
 * Organ scale factor.
 *
 * Organs are drawn slightly under true relative size. At true size they fill
 * the trunk completely and the silhouette stops reading as a body; slightly
 * smaller, each organ stays individually legible and selectable, which is what
 * the visualization is for.
 */
export const ORGAN_SCALE = 0.9
