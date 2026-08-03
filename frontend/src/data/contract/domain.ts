import { z } from 'zod'
import { paginated } from './envelope'

/**
 * Domain contract.
 *
 * These schemas are the boundary between the backend and the interface. Responses
 * are validated against them at runtime, so a backend that drifts fails loudly at
 * the boundary rather than silently rendering wrong clinical values.
 *
 * Field names mirror the documented data requirements in the feature specs.
 */

export const userRoleSchema = z.enum(['patient', 'oncologist'])

export const oncologistSchema = z.object({
  id: z.string(),
  role: z.literal('oncologist'),
  name: z.string(),
  email: z.string(),
  mobile: z.string().optional(),
  avatarColor: z.string(),
  specialization: z.string(),
  qualification: z.string(),
  hospital: z.string(),
  patientIds: z.array(z.string()),
})

export const patientSchema = z.object({
  id: z.string(),
  role: z.literal('patient'),
  name: z.string(),
  email: z.string(),
  mobile: z.string().optional(),
  avatarColor: z.string(),
  patientCode: z.string(),
  dob: z.string(),
  gender: z.enum(['Male', 'Female', 'Other']),
  bloodGroup: z.string(),
  heightCm: z.number(),
  weightKg: z.number(),
  treatingOncologistId: z.string(),
  primaryCancer: z.string(),
  primarySite: z.string(),
  stage: z.string(),
  diagnosisDate: z.string(),
  treatmentStatus: z.enum([
    'active-treatment',
    'in-remission',
    'follow-up',
    'newly-diagnosed',
    'palliative-care',
  ]),
  currentTreatment: z.string(),
  allergies: z.array(z.string()),
  currentMedications: z.array(z.string()),
  previousTreatments: z.array(z.string()),
  pastSurgeries: z.array(z.string()),
  familyHistory: z.string(),
  smokingHistory: z.string(),
  alcoholHistory: z.string(),
  comorbidities: z.array(z.string()),
})

export const evidenceRefSchema = z.object({
  reportId: z.string(),
  reportName: z.string(),
  reportDate: z.string(),
  finding: z.string(),
})

export const reportSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  name: z.string(),
  type: z.enum([
    'Pathology',
    'CT Scan',
    'MRI',
    'PET Scan',
    'Blood Test',
    'Biopsy',
    'Histopathology',
    'Surgery Report',
    'Discharge Summary',
    'Prescription',
    'Follow-up Report',
    'Other',
  ]),
  hospital: z.string(),
  uploadDate: z.string(),
  reportDate: z.string(),
  status: z.enum(['uploaded', 'processing', 'processed', 'failed']),
  fileSizeKb: z.number(),
  fileKind: z.enum(['pdf', 'image']),
  aiSummary: z.string().optional(),
  aiConfidence: z.number().optional(),
  keyFindings: z.array(z.string()).optional(),
  relatedTaskId: z.string().optional(),
})

export const reportChangeSchema = z.object({
  label: z.string(),
  type: z.enum(['progression', 'regression', 'stable']),
  description: z.string(),
})

/**
 * Two reports, compared [09.4 §14].
 *
 * `detectedChanges` holds only what the comparison could ground in explicit
 * wording — a finding repeated verbatim (stable), or a new finding matched
 * against a documented directional vocabulary (progression/regression).
 * `otherFindings` holds new findings the comparison could not confidently
 * direct; they are surfaced, not discarded, but without a claimed direction,
 * because asserting one without a matching signal would be interpreting
 * beyond available evidence [08 §9].
 */
export const reportComparisonSchema = z.object({
  fromReportId: z.string(),
  toReportId: z.string(),
  detectedChanges: z.array(reportChangeSchema),
  otherFindings: z.array(z.string()),
  supportingEvidence: z.array(evidenceRefSchema),
  confidence: z.number(),
})

export const timelineEventSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  date: z.string(),
  type: z.enum([
    'diagnosis',
    'report',
    'treatment',
    'surgery',
    'follow-up',
    'task',
    'note',
    'upload',
    'other',
  ]),
  title: z.string(),
  description: z.string(),
  relatedReportId: z.string().optional(),
  relatedNoteId: z.string().optional(),
  relatedTaskId: z.string().optional(),
  visibility: z.enum(['patient', 'oncologist', 'both']),
})

export const taskSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  title: z.string(),
  description: z.string(),
  instructions: z.string(),
  assignedDate: z.string(),
  dueDate: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
  assignedBy: z.string(),
  requiresUpload: z.boolean(),
  uploadedReportIds: z.array(z.string()),
  completedDate: z.string().optional(),
})

export const noteSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  type: z.enum(['patient', 'private']),
  title: z.string(),
  message: z.string(),
  createdBy: z.string(),
  createdDate: z.string(),
  updatedDate: z.string().optional(),
})

export const signalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  category: z.enum([
    'task-assigned',
    'task-completed',
    'report-uploaded',
    'note-added',
    'ai-processed',
    'system',
  ]),
  title: z.string(),
  message: z.string(),
  date: z.string(),
  read: z.boolean(),
  link: z.string().optional(),
})

export const organStatusSchema = z.object({
  organId: z.string(),
  severity: z.union([
    z.literal(0),
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  note: z.string().optional(),
  evidence: evidenceRefSchema.optional(),
})

export const bodySnapshotSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  date: z.string(),
  label: z.string(),
  organStatuses: z.array(organStatusSchema),
  overallAssessment: z.string(),
})

export const understandingSchema = z.object({
  patientId: z.string(),
  generatedDate: z.string(),
  clinicalSummary: z.string(),
  currentDiseaseStatus: z.string(),
  affectedOrgans: z.array(z.string()),
  diseaseSeverity: z.enum(['Mild', 'Moderate', 'Severe', 'Critical']),
  recentChanges: z.array(
    z.object({
      label: z.string(),
      type: z.enum(['progression', 'regression', 'stable']),
      description: z.string(),
    }),
  ),
  treatmentOverview: z.object({
    current: z.string(),
    previous: z.array(z.string()),
    recentChange: z.string(),
  }),
  supportingEvidence: z.array(evidenceRefSchema),
  confidence: z.number(),
})

/** Session identity. Authentication itself is a backend responsibility [02 §3]. */
export const sessionSchema = z.discriminatedUnion('role', [
  z.object({ role: z.literal('patient'), user: patientSchema }),
  z.object({ role: z.literal('oncologist'), user: oncologistSchema }),
])

/** The aggregated read that renders Patient Space in one request [02 §9]. */
export const patientSpaceSchema = z.object({
  patient: patientSchema,
  reports: z.array(reportSchema),
  timeline: z.array(timelineEventSchema),
  tasks: z.array(taskSchema),
  notes: z.array(noteSchema),
  body: z.array(bodySnapshotSchema),
  understanding: understandingSchema.nullable(),
})

export const patientListSchema = paginated(patientSchema)
export const signalListSchema = z.object({ items: z.array(signalSchema) })

export type Session = z.infer<typeof sessionSchema>
export type PatientSpaceData = z.infer<typeof patientSpaceSchema>
export type BodySnapshot = z.infer<typeof bodySnapshotSchema>
export type Understanding = z.infer<typeof understandingSchema>
export type ReportChange = z.infer<typeof reportChangeSchema>
export type ReportComparison = z.infer<typeof reportComparisonSchema>
