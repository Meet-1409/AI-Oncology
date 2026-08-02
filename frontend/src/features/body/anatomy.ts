import type { OrganId } from '@/types'

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
 */

export type OrganShape = 'sphere' | 'capsule' | 'box' | 'torus'

export interface OrganDefinition {
  id: OrganId
  /** Clinical name, shown in both the 3D scene and the structured equivalent. */
  label: string
  shape: OrganShape
  position: readonly [number, number, number]
  /** Geometry arguments, by shape. */
  args: readonly number[]
  rotation?: readonly [number, number, number]
  scale?: readonly [number, number, number]
  /** Anatomical region, used to group organs in the structured renderer. */
  region: 'head-neck' | 'thorax' | 'abdomen' | 'pelvis' | 'systemic'
}

export const ORGANS: readonly OrganDefinition[] = [
  { id: 'brain', label: 'Brain', shape: 'sphere', position: [0, 1.192, 0.004], args: [0.062, 20, 18], scale: [0.9, 1.05, 1], region: 'head-neck' },
  { id: 'thyroid', label: 'Thyroid', shape: 'sphere', position: [0, 1.0, 0.03], args: [0.026, 12, 10], scale: [1.5, 0.85, 0.9], region: 'head-neck' },

  { id: 'left-lung', label: 'Left Lung', shape: 'capsule', position: [-0.085, 0.822, -0.004], args: [0.062, 0.17, 4, 12], scale: [0.92, 1, 0.78], region: 'thorax' },
  { id: 'right-lung', label: 'Right Lung', shape: 'capsule', position: [0.085, 0.822, -0.004], args: [0.062, 0.17, 4, 12], scale: [0.92, 1, 0.78], region: 'thorax' },
  { id: 'heart', label: 'Heart', shape: 'sphere', position: [-0.022, 0.758, 0.028], args: [0.052, 18, 16], scale: [1, 1.14, 0.86], region: 'thorax' },
  { id: 'left-breast', label: 'Left Breast', shape: 'sphere', position: [-0.088, 0.80, 0.088], args: [0.046, 14, 12], scale: [1, 0.9, 0.8], region: 'thorax' },
  { id: 'right-breast', label: 'Right Breast', shape: 'sphere', position: [0.088, 0.80, 0.088], args: [0.046, 14, 12], scale: [1, 0.9, 0.8], region: 'thorax' },

  { id: 'liver', label: 'Liver', shape: 'sphere', position: [0.062, 0.632, 0.018], args: [0.062, 16, 14], scale: [1.28, 0.74, 0.86], region: 'abdomen' },
  { id: 'stomach', label: 'Stomach', shape: 'sphere', position: [-0.062, 0.608, 0.026], args: [0.05, 16, 14], scale: [1.1, 0.88, 0.8], region: 'abdomen' },
  { id: 'pancreas', label: 'Pancreas', shape: 'capsule', position: [-0.008, 0.566, -0.008], args: [0.015, 0.078, 3, 8], rotation: [0, 0, Math.PI / 2.1], region: 'abdomen' },
  { id: 'spleen', label: 'Spleen', shape: 'sphere', position: [-0.1, 0.618, -0.012], args: [0.032, 12, 10], scale: [0.85, 1.1, 0.9], region: 'abdomen' },
  { id: 'left-kidney', label: 'Left Kidney', shape: 'capsule', position: [-0.078, 0.535, -0.046], args: [0.024, 0.056, 3, 8], region: 'abdomen' },
  { id: 'right-kidney', label: 'Right Kidney', shape: 'capsule', position: [0.078, 0.535, -0.046], args: [0.024, 0.056, 3, 8], region: 'abdomen' },
  { id: 'colon', label: 'Colon', shape: 'torus', position: [0, 0.452, 0.012], args: [0.082, 0.021, 8, 20], rotation: [Math.PI / 2, 0, 0], region: 'abdomen' },

  { id: 'bladder', label: 'Bladder', shape: 'sphere', position: [0, 0.352, 0.032], args: [0.036, 14, 12], scale: [1.05, 0.9, 0.95], region: 'pelvis' },
  { id: 'prostate', label: 'Prostate', shape: 'sphere', position: [0, 0.312, 0.018], args: [0.019, 10, 10], region: 'pelvis' },
] as const

/** Lymph node cluster positions — cervical, axillary and inguinal. */
export const LYMPH_NODES: readonly (readonly [number, number, number])[] = [
  [-0.056, 1.006, 0.026],
  [0.056, 1.006, 0.026],
  [-0.148, 0.878, 0.004],
  [0.148, 0.878, 0.004],
  [-0.076, 0.366, 0.05],
  [0.076, 0.366, 0.05],
] as const

/** Simplified skeleton. Represents body structure [09.6 §5], not exact anatomy. */
export const BONES: readonly {
  key: string
  position: readonly [number, number, number]
  args: readonly [number, number, number, number]
}[] = [
  { key: 'spine', position: [0, 0.66, -0.052], args: [0.021, 0.025, 0.56, 8] },
  { key: 'femur-left', position: [-0.088, 0.112, 0], args: [0.019, 0.022, 0.31, 6] },
  { key: 'femur-right', position: [0.088, 0.112, 0], args: [0.019, 0.022, 0.31, 6] },
  { key: 'humerus-left', position: [-0.207, 0.775, 0], args: [0.014, 0.016, 0.2, 6] },
  { key: 'humerus-right', position: [0.207, 0.775, 0], args: [0.014, 0.016, 0.2, 6] },
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

/** Every selectable site, including the clusters that have no single mesh. */
export const SELECTABLE_IDS: readonly string[] = [
  ...ORGANS.map((o) => o.id),
  'lymph-nodes',
  'bones',
]

export const REGION_LABEL: Record<OrganDefinition['region'], string> = {
  'head-neck': 'Head and neck',
  thorax: 'Thorax',
  abdomen: 'Abdomen',
  pelvis: 'Pelvis',
  systemic: 'Systemic',
}
