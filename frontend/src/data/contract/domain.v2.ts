import { z } from 'zod'
import { paginated } from './envelope'

/**
 * Domain contract — v2, imaging-first.
 *
 * WHAT CHANGED FROM v1 AND WHY
 *
 * v1 modelled the platform as a report portal: PDFs in, an LLM summary out, an
 * organ severity dial hand-set from that summary. v2 models it as a patient
 * intelligence layer: imaging and molecular data in, a versioned patient state
 * out, every clinical value traceable to the model run and source region that
 * produced it.
 *
 * The workflow half of v1 — session, tasks, notes, signals, account — is
 * unchanged and re-exported. It was never the problem.
 *
 * THE INVARIANT THIS CONTRACT ENFORCES
 *
 * Every clinical claim carries evidence. `evidence` is REQUIRED on every
 * assertion and on organ involvement. v1 made it optional, which permitted an
 * organ rendered at severity 4 with nothing behind it. That is the single most
 * dangerous shape a schema of this kind can have, and the type system now
 * forbids it.
 *
 * COORDINATE SPACES — READ THIS BEFORE TOUCHING Body
 *
 * A lesion has TWO positions and they are not interchangeable.
 *
 *   patientSpaceMm   the truth. LPS millimetres, from the scan's own geometry.
 *                    Used for measurement, matching, and anything clinical.
 *
 *   atlasPosition    a display convenience. Normalised coordinates in the GLB
 *                    atlas space, computed BY THE BACKEND via patient-to-atlas
 *                    registration, and carrying its own confidence.
 *
 * The frontend must never derive one from the other. Mapping a real patient onto
 * a generic atlas is medical image registration; a scale-and-offset in the
 * browser produces a marker that is plausibly, confidently in the wrong place.
 * When `atlasPosition` is null, render the lesion in the organ list and leave the
 * atlas unmarked. An absent marker is recoverable; a wrong one is not.
 */

// ---------------------------------------------------------------- primitives

/** Model confidence, 0–1. Always rendered with the value it qualifies. */
export const confidenceSchema = z.number().min(0).max(1)

/**
 * A measured quantity with its uncertainty.
 *
 * Inter-reader variability on single-lesion RECIST measurement reaches roughly
 * ±22–25%, so a bare "+12.34%" claims four significant figures of a number two
 * radiologists would disagree about. Every measurement crosses the boundary with
 * a band and a flag for whether the change exceeds it.
 */
export const measurementSchema = z.object({
  value: z.number(),
  unit: z.string(),
  /** Half-width of the reference band, same unit. Null when no evidence base exists. */
  uncertainty: z.number().nullable(),
  /** Where the band came from, e.g. 'RECIST inter-reader, lung CT'. */
  uncertaintyBasis: z.string().nullable(),
  /** False when the change is within measurement noise. Drives how it is rendered. */
  exceedsVariability: z.boolean().nullable(),
})

/** Where a value came from inside its source artifact. Powers the evidence viewer. */
export const locatorSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('volume_bbox'),
    seriesUid: z.string(),
    sliceIndex: z.number().int(),
    bboxVox: z.object({
      imin: z.number(), jmin: z.number(), kmin: z.number(),
      imax: z.number(), jmax: z.number(), kmax: z.number(),
    }),
  }),
  z.object({
    type: z.literal('wsi_roi'),
    level: z.number().int(),
    bboxPx: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }),
  }),
  z.object({
    type: z.literal('text_span'),
    start: z.number().int(),
    end: z.number().int(),
    text: z.string(),
  }),
])

/** The model run that produced a finding. Never hidden from the evidence view. */
export const modelRunSchema = z.object({
  runId: z.string(),
  modelKey: z.string(),
  modelVersion: z.string(),
  task: z.string(),
  /** True when produced by a stub/simulator. Must be visible wherever it surfaces. */
  synthetic: z.boolean(),
})

export const artifactRefSchema = z.object({
  artifactId: z.string(),
  modality: z.enum([
    'WSI', 'CT', 'MRI', 'PET', 'DERM',
    'REPORT_PATH', 'REPORT_RAD', 'REPORT_CLIN', 'GENOMIC', 'LAB',
  ]),
  acquiredAt: z.string().nullable(),
  /** Human label for the source, e.g. '3-month restaging CT'. */
  label: z.string().nullable(),
})

/** One link from a claim to the thing that justifies it. */
export const evidenceLinkSchema = z.object({
  findingId: z.string().nullable(),
  artifact: artifactRefSchema.nullable(),
  model: modelRunSchema.nullable(),
  locator: locatorSchema.nullable(),
  weight: z.number().min(0).max(1),
})

// ---------------------------------------------------------------- observation

/**
 * Whether something was actually looked at.
 *
 * MISSING DATA IS NOT NEGATIVE EVIDENCE. A lesion with no annotation at a
 * timepoint is NOT_ASSESSED, not OBSERVED_ABSENT, and only OBSERVED_ABSENT may
 * support resolution. Collapsing these two is how a system invents a complete
 * response out of an incomplete scan.
 */
export const observationStatusSchema = z.enum([
  'OBSERVED_PRESENT',
  'OBSERVED_ABSENT',
  'NOT_ASSESSED',
  'UNKNOWN',
])

export const trackStateSchema = z.enum(['ACTIVE', 'RESOLVED', 'INDETERMINATE'])

// ---------------------------------------------------------------- imaging

export const lesionSchema = z.object({
  id: z.string(),
  label: z.string(),
  organ: z.string().nullable(),
  organConfidence: confidenceSchema.nullable(),

  /** Truth. LPS millimetres in the study's own frame of reference. */
  patientSpaceMm: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  frameOfReferenceUid: z.string().nullable(),

  /**
   * Display only. Null when patient-to-atlas registration was not possible or
   * not trusted — in that case do not place a marker.
   */
  atlasPosition: z
    .object({
      x: z.number(), y: z.number(), z: z.number(),
      confidence: confidenceSchema,
    })
    .nullable(),

  longestDiameter: measurementSchema,
  volume: measurementSchema.nullable(),
  confidence: confidenceSchema.nullable(),
  observedAt: z.string(),
  trackId: z.string().nullable(),
  evidence: z.array(evidenceLinkSchema).min(1),

  /** Clinician override. A rejected lesion is excluded from future state builds. */
  verifiedBy: z.string().nullable(),
  rejected: z.boolean(),
})

/** One physical lesion followed across timepoints. */
export const lesionTrackSchema = z.object({
  id: z.string(),
  label: z.string(),
  organ: z.string().nullable(),
  state: trackStateSchema,
  isTarget: z.boolean(),
  matchMethod: z.string().nullable(),
  baselineDiameter: measurementSchema.nullable(),
  latestDiameter: measurementSchema.nullable(),
  change: measurementSchema.nullable(),
  points: z.array(
    z.object({
      observedAt: z.string(),
      observation: observationStatusSchema,
      diameter: measurementSchema.nullable(),
      lesionId: z.string().nullable(),
    }),
  ),
})

/**
 * Organ-level involvement, DERIVED from lesions rather than authored.
 *
 * Replaces v1's `organStatus.severity: 0–5`, which was a hand-set dial with
 * optional evidence. Burden and lesion count are computed; `evidence` is
 * required; and an organ that was never imaged is NOT_ASSESSED rather than
 * silently reading as healthy.
 */
export const organInvolvementSchema = z.object({
  organId: z.string(),
  observation: observationStatusSchema,
  lesionCount: z.number().int().nonnegative(),
  burden: measurementSchema.nullable(),
  /** Coarse band for colour, derived from burden. Never a free-set number. */
  involvement: z.enum(['none', 'low', 'moderate', 'high', 'not_assessed']),
  evidence: z.array(evidenceLinkSchema).min(1),
})

// ---------------------------------------------------------------- pathology & molecular

export const pathologyFindingSchema = z.object({
  id: z.string(),
  observedAt: z.string(),
  tilRatio: measurementSchema.nullable(),
  tumorDensity: measurementSchema.nullable(),
  immuneDensity: measurementSchema.nullable(),
  immuneDesertFraction: measurementSchema.nullable(),
  spatialMetrics: z.record(z.string(), z.number()).nullable(),
  overlayUri: z.string().nullable(),
  confidence: confidenceSchema.nullable(),
  evidence: z.array(evidenceLinkSchema).min(1),
})

export const molecularMarkerSchema = z.object({
  id: z.string(),
  gene: z.string(),
  variant: z.string().nullable(),
  status: z.enum(['positive', 'negative', 'indeterminate']),
  vaf: z.number().nullable(),
  assay: z.string().nullable(),
  evidence: z.array(evidenceLinkSchema).min(1),
})

// ---------------------------------------------------------------- patient state

/**
 * One atomic claim, subject–predicate–object, with the reasoning and the sources.
 *
 * Replaces v1's `understanding` free-text summary. Prose cannot be traced; a
 * graph of assertions can. Render them as prose if you like — but the evidence
 * click-through has to reach the pixels.
 */
export const assertionSchema = z.object({
  id: z.string(),
  subject: z.string(),
  predicate: z.string(),
  measurement: measurementSchema.nullable(),
  text: z.string().nullable(),
  assertionType: z.enum([
    'measurement', 'derived_metric', 'change', 'categorical', 'risk_flag',
  ]),
  confidence: confidenceSchema.nullable(),
  /** Why the system believes this. Always shown with a risk_flag. */
  rationale: z.string(),
  modalities: z.array(z.string()),
  evidence: z.array(evidenceLinkSchema).min(1),
})

/**
 * Progression as a computed INDICATOR for clinician review, never a determination.
 *
 * `complete_response` is deliberately absent: establishing it requires positive
 * evidence of absence plus adequate assessment coverage, neither of which the
 * current data can supply. When the evidence is insufficient the answer is
 * NOT_EVALUABLE — that is a correct answer, not a gap to be filled.
 */
export const progressionIndicatorSchema = z.object({
  status: z.enum([
    'progressive_disease', 'partial_response', 'stable',
    'indeterminate', 'not_evaluable',
  ]),
  rationale: z.string(),
  confidence: confidenceSchema.nullable(),
  targetSum: measurementSchema.nullable(),
  sumChange: measurementSchema.nullable(),
  newLesionCount: z.number().int().nonnegative(),
  evidence: z.array(evidenceLinkSchema).min(1),
})

/** How much of the picture the system actually has. Drives "what's missing". */
export const coverageSchema = z.object({
  byModality: z.record(z.string(), z.number().int().nonnegative()),
  missing: z.array(z.string()),
  completeness: z.number().min(0).max(1),
  annotationCompleteness: z.enum(['EXHAUSTIVE', 'TARGET_ONLY', 'UNKNOWN']),
})

/** Immutable, versioned. Rebuilding produces v+1; prior versions stay readable. */
export const patientStateSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  version: z.number().int().positive(),
  asOf: z.string(),
  isCurrent: z.boolean(),
  supersedesId: z.string().nullable(),

  totalTumorBurden: measurementSchema.nullable(),
  lesionCount: z.number().int().nonnegative(),
  involvedOrgans: z.array(z.string()),
  progression: progressionIndicatorSchema.nullable(),
  driverMutations: z.array(z.string()),

  coverage: coverageSchema,
  confidence: confidenceSchema,
  pipelineVersion: z.string(),

  /** True when any contributing finding came from a stub model. Must be visible. */
  containsSyntheticFindings: z.boolean(),
  requiresClinicianReview: z.literal(true),

  assertions: z.array(assertionSchema),
})

// ---------------------------------------------------------------- timeline

export const timepointSchema = z.object({
  id: z.string(),
  occurredAt: z.string(),
  kind: z.enum(['imaging', 'biopsy', 'lab', 'treatment', 'visit', 'surgery']),
  label: z.string().nullable(),
  /**
   * Days from the reference event, with the event named. An offset is only
   * comparable within one (collection, referenceEvent) pair — never subtract
   * across sources.
   */
  offsetDays: z.number().int().nullable(),
  referenceEvent: z.string().nullable(),
  artifacts: z.array(artifactRefSchema),
})

// ---------------------------------------------------------------- aggregates

/** The single read that renders Patient Space. */
export const patientSpaceV2Schema = z.object({
  patientId: z.string(),
  state: patientStateSchema.nullable(),
  lesions: z.array(lesionSchema),
  tracks: z.array(lesionTrackSchema),
  organs: z.array(organInvolvementSchema),
  pathology: z.array(pathologyFindingSchema),
  molecular: z.array(molecularMarkerSchema),
  timeline: z.array(timepointSchema),
})

export const evidenceTraceSchema = z.object({
  assertion: assertionSchema,
  links: z.array(evidenceLinkSchema),
})

export const lesionListSchema = paginated(lesionSchema)

export type Lesion = z.infer<typeof lesionSchema>
export type LesionTrack = z.infer<typeof lesionTrackSchema>
export type OrganInvolvement = z.infer<typeof organInvolvementSchema>
export type PatientState = z.infer<typeof patientStateSchema>
export type Assertion = z.infer<typeof assertionSchema>
export type EvidenceLink = z.infer<typeof evidenceLinkSchema>
export type Measurement = z.infer<typeof measurementSchema>
export type PatientSpaceV2 = z.infer<typeof patientSpaceV2Schema>
