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
 * Coordinate space: a standing figure, feet at y = -0.95, crown at y = 1.32,
 * facing +z. Units are arbitrary and consistent across the scene.
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
  { id: 'brain', label: 'Brain', shape: 'sphere', position: [0, 1.19, 0], args: [0.095, 20, 20], region: 'head-neck' },
  { id: 'thyroid', label: 'Thyroid', shape: 'sphere', position: [0, 0.985, 0.085], args: [0.032, 12, 12], region: 'head-neck' },

  { id: 'left-lung', label: 'Left Lung', shape: 'capsule', position: [-0.135, 0.79, 0], args: [0.085, 0.19, 3, 8], region: 'thorax' },
  { id: 'right-lung', label: 'Right Lung', shape: 'capsule', position: [0.135, 0.79, 0], args: [0.085, 0.19, 3, 8], region: 'thorax' },
  { id: 'heart', label: 'Heart', shape: 'sphere', position: [-0.02, 0.7, 0.09], args: [0.068, 16, 16], scale: [1, 1.1, 0.9], region: 'thorax' },
  { id: 'left-breast', label: 'Left Breast', shape: 'sphere', position: [-0.135, 0.775, 0.13], args: [0.058, 14, 14], region: 'thorax' },
  { id: 'right-breast', label: 'Right Breast', shape: 'sphere', position: [0.135, 0.775, 0.13], args: [0.058, 14, 14], region: 'thorax' },

  { id: 'liver', label: 'Liver', shape: 'sphere', position: [0.15, 0.555, 0.08], args: [0.095, 14, 14], scale: [1.35, 0.75, 0.9], region: 'abdomen' },
  { id: 'stomach', label: 'Stomach', shape: 'sphere', position: [-0.12, 0.525, 0.08], args: [0.072, 14, 14], scale: [1.2, 0.85, 0.85], region: 'abdomen' },
  { id: 'pancreas', label: 'Pancreas', shape: 'capsule', position: [0, 0.485, 0.015], args: [0.02, 0.11, 3, 6], rotation: [0, 0, Math.PI / 2.1], region: 'abdomen' },
  { id: 'spleen', label: 'Spleen', shape: 'sphere', position: [-0.185, 0.55, 0.02], args: [0.045, 12, 12], region: 'abdomen' },
  { id: 'left-kidney', label: 'Left Kidney', shape: 'capsule', position: [-0.145, 0.42, -0.07], args: [0.032, 0.085, 3, 6], region: 'abdomen' },
  { id: 'right-kidney', label: 'Right Kidney', shape: 'capsule', position: [0.145, 0.42, -0.07], args: [0.032, 0.085, 3, 6], region: 'abdomen' },
  { id: 'colon', label: 'Colon', shape: 'torus', position: [0, 0.3, 0.03], args: [0.12, 0.028, 8, 18], rotation: [Math.PI / 2, 0, 0], region: 'abdomen' },

  { id: 'bladder', label: 'Bladder', shape: 'sphere', position: [0, 0.135, 0.075], args: [0.045, 12, 12], region: 'pelvis' },
  { id: 'prostate', label: 'Prostate', shape: 'sphere', position: [0, 0.1, 0.05], args: [0.024, 10, 10], region: 'pelvis' },
] as const

/** Lymph node cluster positions — cervical, axillary and inguinal. */
export const LYMPH_NODES: readonly (readonly [number, number, number])[] = [
  [-0.09, 0.98, 0.06],
  [0.09, 0.98, 0.06],
  [-0.24, 0.82, 0.02],
  [0.24, 0.82, 0.02],
  [-0.1, 0.19, 0.07],
  [0.1, 0.19, 0.07],
] as const

/** Simplified skeleton. Represents body structure [09.6 §5], not exact anatomy. */
export const BONES: readonly {
  key: string
  position: readonly [number, number, number]
  args: readonly [number, number, number, number]
}[] = [
  { key: 'spine', position: [0, 0.55, -0.03], args: [0.028, 0.032, 0.62, 8] },
  { key: 'femur-left', position: [-0.09, -0.35, 0], args: [0.022, 0.026, 0.5, 6] },
  { key: 'femur-right', position: [0.09, -0.35, 0], args: [0.022, 0.026, 0.5, 6] },
  { key: 'humerus-left', position: [-0.24, 0.65, 0], args: [0.017, 0.02, 0.32, 6] },
  { key: 'humerus-right', position: [0.24, 0.65, 0], args: [0.017, 0.02, 0.32, 6] },
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
