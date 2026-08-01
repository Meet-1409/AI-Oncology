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

export function isSeverityLevel(value: number): value is SeverityLevel {
  return Number.isInteger(value) && value >= 0 && value <= 5
}

export function severityColor(severity: number): string {
  return isSeverityLevel(severity) ? SEVERITY_COLOR[severity] : SEVERITY_COLOR[0]
}

export function severityLabel(severity: number): string {
  return isSeverityLevel(severity) ? SEVERITY_LABEL[severity] : 'Unknown'
}
