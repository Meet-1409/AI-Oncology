import type { OrganId } from '@/types'
import type { BodyForm } from './figure'

/**
 * Anatomy definitions for the Body.
 *
 * Custom stylized low-poly anatomy [decision D2]. Organs are declarative records
 * rather than hand-placed geometry, so anatomical coverage grows by adding data
 * rather than code — which matters because AI-provided organ coverage expands over
 * time [08 §11].
 *
 * The model represents body structure using available patient information and is
 * deliberately NOT an exact physical replica of the patient [00 §6.4]. Positions
 * are anatomically plausible and correctly located, without implying more spatial
 * precision than the underlying data supports.
 *
 * Coordinate space: a standing figure, feet at y = -0.51, crown at y = 1.31,
 * facing +z. Units are arbitrary and consistent across the scene. Organ positions
 * are kept inside the body silhouette defined in figure.ts.
 *
 * Most organs are lofted — the same cross-section technique the body shell uses,
 * at organ scale (see `organ-shapes.ts`) — rather than a primitive squashed with
 * scale. A handful (breasts, colon, prostate) stay primitives: their real shape is
 * already close enough to a squashed sphere/torus that a bespoke loft would add
 * authoring cost without changing how they read.
 */

export type OrganShape = 'sphere' | 'capsule' | 'box' | 'torus' | 'lofted'

export interface OrganDefinition {
  id: OrganId
  /** Clinical name, shown in both the 3D scene and the structured equivalent. */
  label: string
  shape: OrganShape
  position: readonly [number, number, number]
  /** Geometry arguments, by shape. Unused (empty) when shape is 'lofted'. */
  args: readonly number[]
  rotation?: readonly [number, number, number]
  scale?: readonly [number, number, number]
  /** Overrides `scale` for a specific body form — e.g. reduced breast tissue on the male form. */
  scaleByForm?: Partial<Record<BodyForm, readonly [number, number, number]>>
  /**
   * Which body forms this organ applies to. Absent means every form — most
   * organs are common to everyone. Present for the sex-specific reproductive
   * organs, which are anatomically absent from the other forms rather than
   * merely hidden [00 §6.5]: the unspecified/`Other` form (`neutral`) shows
   * neither side's sex-specific organs, matching `bodyFormFor()`'s own
   * "guessing is worse than being non-committal" rule.
   */
  sexes?: readonly BodyForm[]
  /** Anatomical region, used to group organs in the structured renderer. */
  region: 'head-neck' | 'thorax' | 'abdomen' | 'pelvis' | 'systemic'
}

export const ORGANS: readonly OrganDefinition[] = [
  { id: 'brain', label: 'Brain', shape: 'lofted', position: [0, 1.198, 0.002], args: [], region: 'head-neck' },
  { id: 'thyroid', label: 'Thyroid', shape: 'lofted', position: [0, 1.015, 0.026], args: [], region: 'head-neck' },

  // Lung apex sits just above the clavicle, base on the diaphragm at y ≈ 0.76.
  { id: 'left-lung', label: 'Left Lung', shape: 'lofted', position: [-0.078, 0.862, -0.004], args: [], region: 'thorax' },
  { id: 'right-lung', label: 'Right Lung', shape: 'lofted', position: [0.078, 0.862, -0.004], args: [], region: 'thorax' },
  { id: 'heart', label: 'Heart', shape: 'lofted', position: [-0.022, 0.812, 0.030], args: [], region: 'thorax' },
  {
    id: 'left-breast',
    label: 'Left Breast',
    shape: 'sphere',
    position: [-0.086, 0.828, 0.090],
    args: [0.046, 14, 12],
    scale: [1, 0.9, 0.8],
    scaleByForm: { male: [0.55, 0.45, 0.4] },
    region: 'thorax',
  },
  {
    id: 'right-breast',
    label: 'Right Breast',
    shape: 'sphere',
    position: [0.086, 0.828, 0.090],
    args: [0.046, 14, 12],
    scale: [1, 0.9, 0.8],
    scaleByForm: { male: [0.55, 0.45, 0.4] },
    region: 'thorax',
  },

  // Upper abdomen, under the diaphragm. The navel sits at y ≈ 0.64.
  { id: 'liver', label: 'Liver', shape: 'lofted', position: [0.058, 0.712, 0.020], args: [], region: 'abdomen' },
  { id: 'stomach', label: 'Stomach', shape: 'lofted', position: [-0.058, 0.688, 0.028], args: [], region: 'abdomen' },
  { id: 'pancreas', label: 'Pancreas', shape: 'lofted', position: [-0.008, 0.655, -0.006], args: [], rotation: [0, 0, Math.PI / 2.1], region: 'abdomen' },
  { id: 'spleen', label: 'Spleen', shape: 'lofted', position: [-0.104, 0.700, -0.014], args: [], region: 'abdomen' },
  { id: 'left-kidney', label: 'Left Kidney', shape: 'lofted', position: [-0.078, 0.632, -0.052], args: [], region: 'abdomen' },
  // Mirrored on x so the concave hilum border faces the spine on both sides.
  { id: 'right-kidney', label: 'Right Kidney', shape: 'lofted', position: [0.078, 0.632, -0.052], args: [], scale: [-1, 1, 1], region: 'abdomen' },
  // An asymmetric ring rather than a perfect circle — the colon frames the
  // abdomen, wider left-to-right than front-to-back.
  { id: 'colon', label: 'Colon', shape: 'torus', position: [0, 0.560, 0.014], args: [0.082, 0.021, 8, 20], rotation: [Math.PI / 2, 0, 0], scale: [1.35, 1, 0.82], region: 'abdomen' },

  // Behind the pubic bone, above the crotch at y ≈ 0.345.
  { id: 'bladder', label: 'Bladder', shape: 'lofted', position: [0, 0.448, 0.034], args: [], region: 'pelvis' },
  { id: 'prostate', label: 'Prostate', shape: 'sphere', position: [0, 0.412, 0.020], args: [0.019, 10, 10], sexes: ['male'], region: 'pelvis' },
  { id: 'uterus', label: 'Uterus', shape: 'lofted', position: [0, 0.418, -0.006], sexes: ['female'], args: [], region: 'pelvis' },
  { id: 'left-ovary', label: 'Left Ovary', shape: 'lofted', position: [-0.036, 0.422, -0.010], sexes: ['female'], args: [], region: 'pelvis' },
  { id: 'right-ovary', label: 'Right Ovary', shape: 'lofted', position: [0.036, 0.422, -0.010], sexes: ['female'], args: [], region: 'pelvis' },
] as const

/** Lymph node cluster positions — cervical, axillary and inguinal. */
export const LYMPH_NODES: readonly (readonly [number, number, number])[] = [
  [-0.050, 1.026, 0.024],
  [0.050, 1.026, 0.024],
  [-0.142, 0.898, 0.004],
  [0.142, 0.898, 0.004],
  [-0.072, 0.412, 0.062],
  [0.072, 0.412, 0.062],
] as const

/** Simplified skeleton. Represents body structure [09.6 §5], not exact anatomy. */
export const BONES: readonly {
  key: string
  position: readonly [number, number, number]
  args: readonly [number, number, number, number]
  /** Set when the bone sits inside an arm and must travel with it. */
  arm?: 1 | -1
}[] = [
  // Spine: sacrum at y ≈ 0.44 to the base of the skull at y ≈ 1.04.
  { key: 'spine', position: [0, 0.740, -0.060], args: [0.021, 0.026, 0.60, 8] },
  // Femur: greater trochanter y ≈ 0.50 down to the knee at y ≈ 0.01.
  { key: 'femur-left', position: [-0.082, 0.255, 0], args: [0.019, 0.023, 0.47, 6] },
  { key: 'femur-right', position: [0.082, 0.255, 0], args: [0.019, 0.023, 0.47, 6] },
  // Humerus: shoulder y ≈ 0.93 down to the elbow at y ≈ 0.637.
  // Positions are given for the resting arm; the scene poses them with the limb.
  { key: 'humerus-left', position: [-0.174, 0.786, 0], args: [0.014, 0.017, 0.29, 6], arm: -1 },
  { key: 'humerus-right', position: [0.174, 0.786, 0], args: [0.014, 0.017, 0.29, 6], arm: 1 },
] as const

/** Organs represented as clusters rather than single meshes. */
export const SYSTEMIC_LABELS: Partial<Record<OrganId, string>> = {
  'lymph-nodes': 'Lymph Nodes',
  bones: 'Bones',
}

const ORGAN_LABEL = new Map<string, string>([
  ...ORGANS.map((organ) => [organ.id, organ.label] as const),
  ...Object.entries(SYSTEMIC_LABELS).map(([id, label]) => [id, label ?? id] as const),
])

export function organLabel(organId: string): string {
  return ORGAN_LABEL.get(organId) ?? organId
}

/** Every selectable site across every form, including clusters with no single mesh. */
export const SELECTABLE_IDS: readonly string[] = [
  ...ORGANS.map((o) => o.id),
  'lymph-nodes',
  'bones',
]

/** Whether an organ applies to a body form — absent `sexes` means every form. */
export function organAppliesTo(organ: OrganDefinition, form: BodyForm): boolean {
  return !organ.sexes || organ.sexes.includes(form)
}

/**
 * Every selectable site for one body form.
 *
 * The view-model consumed by both the 3D scene and the structured equivalent
 * is built from this, not from `SELECTABLE_IDS`, so a male patient is never
 * shown a uterus and a female patient is never shown a prostate — in either
 * renderer, since both consume the same list [00 §12.6], [00 §16.5].
 */
export function selectableIdsFor(form: BodyForm): readonly string[] {
  return [
    ...ORGANS.filter((organ) => organAppliesTo(organ, form)).map((organ) => organ.id),
    'lymph-nodes',
    'bones',
  ]
}

export const REGION_LABEL: Record<OrganDefinition['region'], string> = {
  'head-neck': 'Head and neck',
  thorax: 'Thorax',
  abdomen: 'Abdomen',
  pelvis: 'Pelvis',
  systemic: 'Systemic',
}
