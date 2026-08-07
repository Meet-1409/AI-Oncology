import type { ProcessingStatus, TaskPriority, TaskStatus, TimelineEventType } from '@/types'

type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

export const taskStatusMeta: Record<TaskStatus, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'Pending', variant: 'warning' },
  in_progress: { label: 'In Progress', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'neutral' },
}

export const priorityMeta: Record<TaskPriority, { label: string; variant: BadgeVariant }> = {
  low: { label: 'Low', variant: 'neutral' },
  medium: { label: 'Medium', variant: 'info' },
  high: { label: 'High', variant: 'danger' },
}

export const processingStatusMeta: Record<ProcessingStatus, { label: string; variant: BadgeVariant }> = {
  uploaded: { label: 'Uploaded', variant: 'neutral' },
  processing: { label: 'Processing', variant: 'info' },
  processed: { label: 'Processed', variant: 'success' },
  failed: { label: 'Processing Failed', variant: 'danger' },
}

export const timelineTypeMeta: Record<TimelineEventType, { label: string; variant: BadgeVariant }> = {
  diagnosis: { label: 'Diagnosis', variant: 'danger' },
  report: { label: 'Report', variant: 'info' },
  treatment: { label: 'Treatment', variant: 'brand' },
  surgery: { label: 'Surgery', variant: 'warning' },
  'follow-up': { label: 'Follow-up', variant: 'neutral' },
  task: { label: 'Task', variant: 'neutral' },
  note: { label: 'Note', variant: 'success' },
  upload: { label: 'Upload', variant: 'info' },
  other: { label: 'Other', variant: 'neutral' },
}

export const treatmentStatusMeta: Record<string, { label: string; variant: BadgeVariant }> = {
  'active-treatment': { label: 'Active Treatment', variant: 'info' },
  'in-remission': { label: 'In Remission', variant: 'success' },
  'follow-up': { label: 'Follow-up', variant: 'neutral' },
  'newly-diagnosed': { label: 'Newly Diagnosed', variant: 'warning' },
  'palliative-care': { label: 'Palliative Care', variant: 'danger' },
}

/**
 * Disease severity, 0-5. 0 means no involvement; 1-5 are the documented severity
 * steps, light to dark [00 §6.7].
 */
export type SeverityLevel = 0 | 1 | 2 | 3 | 4 | 5

export const SEVERITY_LEVELS: readonly SeverityLevel[] = [0, 1, 2, 3, 4, 5] as const

/**
 * Literal hex values — NEVER CSS custom properties.
 *
 * These strings are consumed both by CSS and by `new THREE.Color()` in the Body.
 * three.js cannot parse `var(--x)`: it emits a warning and silently yields white.
 * Shipping that once made every diseased organ render white while appearing to
 * work. Keep in sync with the --color-severity-* tokens in design/tokens.css.
 */
const SEVERITY_COLOR: Readonly<Record<SeverityLevel, string>> = {
  0: '#dde1e7',
  1: '#f6b8b3',
  2: '#ed8e86',
  3: '#de5b50',
  4: '#c22e23',
  5: '#841a13',
}

/** Severity is never communicated by color alone [00 §16.2]. */
const SEVERITY_LABEL: Readonly<Record<SeverityLevel, string>> = {
  0: 'No involvement',
  1: 'Minimal',
  2: 'Mild',
  3: 'Moderate',
  4: 'Significant',
  5: 'Severe',
}

/**
 * The same scale, in plain words.
 *
 * "Minimal" and "Significant" are clear to an oncologist and ambiguous to a
 * patient reading their own record, yet both see this scale [09.6]. Every space
 * must be understandable without training [04 §28], so each level also carries a
 * sentence anyone can read.
 *
 * These sentences deliberately describe POSITION ON THE SCALE and nothing more.
 * They do not estimate size, spread or outlook: that would be the interface
 * inventing a clinical claim the underlying data never made, which [00 §5]
 * forbids. What is safe to say is where a finding sits on a documented scale.
 */
const SEVERITY_MEANING: Readonly<Record<SeverityLevel, string>> = {
  0: 'Not currently marked as affected.',
  1: 'Marked as affected, at the lowest level on the scale.',
  2: 'Marked as affected, low on the scale.',
  3: 'Marked as affected, in the middle of the scale.',
  4: 'Marked as affected, high on the scale.',
  5: 'Marked as affected, at the highest level on the scale.',
}

export function isSeverityLevel(value: number): value is SeverityLevel {
  return Number.isInteger(value) && value >= 0 && value <= 5
}

export function severityMeaning(severity: number): string {
  return isSeverityLevel(severity)
    ? SEVERITY_MEANING[severity]
    : 'This level is not recognised. Ask your care team.'
}

export function severityColor(severity: number): string {
  return isSeverityLevel(severity) ? SEVERITY_COLOR[severity] : SEVERITY_COLOR[0]
}

export function severityLabel(severity: number): string {
  return isSeverityLevel(severity) ? SEVERITY_LABEL[severity] : 'Unknown'
}

/* ------------------------------------------------------------------ *
 * Organ involvement — contract v2.
 *
 * Replaces the hand-set 0-5 severity dial with a coarse band derived from
 * lesion burden. Literal hex for the same reason SEVERITY_COLOR is: three.js
 * cannot parse `var(--x)`. Kept in sync with `--color-involvement-*` in
 * design/tokens.css and `involvementScale` in design/theme.ts, enforced by
 * tools/check-architecture.mjs.
 * ------------------------------------------------------------------ */

export type InvolvementBand = 'none' | 'low' | 'moderate' | 'high' | 'not_assessed'

export const INVOLVEMENT_BANDS: readonly InvolvementBand[] = [
  'none',
  'low',
  'moderate',
  'high',
  'not_assessed',
] as const

const INVOLVEMENT_COLOR: Readonly<Record<InvolvementBand, string>> = {
  none: '#dde1e7',
  low: '#f6b8b3',
  moderate: '#de5b50',
  high: '#841a13',
  not_assessed: '#9aa0a6',
}

/**
 * Involvement is never communicated by colour alone [00 §16.2] — and for
 * `not_assessed` it is not communicated by colour at all, since its whole
 * point is that it is NOT a shade of the disease scale.
 */
const INVOLVEMENT_LABEL: Readonly<Record<InvolvementBand, string>> = {
  none: 'None found',
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  not_assessed: 'Not assessed',
}

/**
 * Plain language, and the same discipline as `severityMeaning`: describe
 * position on a documented scale and NOTHING more — not size, not spread, not
 * outlook [00 §5].
 *
 * `not_assessed` is the one that matters. "Not assessed" must never be allowed
 * to read as reassurance: an organ that was never imaged is not a healthy
 * organ [CLAUDE.md rule 2], and a patient reading their own record will take
 * silence for good news unless the interface says otherwise.
 */
const INVOLVEMENT_MEANING: Readonly<Record<InvolvementBand, string>> = {
  none: 'This part was looked at, and nothing was found in it.',
  low: 'A small amount was found in this part.',
  moderate: 'A moderate amount was found in this part.',
  high: 'A large amount was found in this part.',
  not_assessed:
    'This part was not covered by the scans available, so nothing is known about it either way. This is not the same as nothing being found.',
}

/** True only for the band that carries the hatch — see design/texture.ts. */
export function isNotAssessed(band: InvolvementBand): boolean {
  return band === 'not_assessed'
}

export function isInvolvementBand(value: string): value is InvolvementBand {
  return (INVOLVEMENT_BANDS as readonly string[]).includes(value)
}

export function involvementColor(band: string): string {
  return isInvolvementBand(band) ? INVOLVEMENT_COLOR[band] : INVOLVEMENT_COLOR.not_assessed
}

export function involvementLabel(band: string): string {
  return isInvolvementBand(band) ? INVOLVEMENT_LABEL[band] : 'Not assessed'
}

export function involvementMeaning(band: string): string {
  return isInvolvementBand(band)
    ? INVOLVEMENT_MEANING[band]
    : INVOLVEMENT_MEANING.not_assessed
}
