/**
 * Patterns — components that know domain concepts but not data sources.
 *
 * Per the single-source-of-truth rule, any interaction needed by two or more
 * spaces belongs here rather than being implemented separately in each.
 */

export { FocusLayer } from './focus-layer'
export type { FocusLayerProps } from './focus-layer'

export { EmptyState, ErrorState, LoadingSurface } from './states'
export type { EmptyStateProps, ErrorStateProps } from './states'
export {
  SeverityIndicator,
  ProcessingStatusIndicator,
  TaskStatusIndicator,
  PriorityIndicator,
  NoteVisibilityIndicator,
  Confidence,
  EvidenceList,
  ChangeIndicator,
} from './clinical'
export type { ChangeDirection } from './clinical'

export { Orientation, PlainExplanation, SeverityLegend } from './orientation'
export type { OrientationProps } from './orientation'

export { DocumentPreview } from './document-preview'
export type { DocumentPreviewProps } from './document-preview'

export { TabRail } from './tab-rail'
export type { TabRailItem, TabRailProps } from './tab-rail'
