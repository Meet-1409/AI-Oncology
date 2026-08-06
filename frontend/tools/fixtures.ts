import type { DigitalTwinSnapshot, Note, Report, TimelineEvent } from '@/types'

/**
 * Synthetic fixtures for the safety-test suite only.
 *
 * The product ships with zero invented patient data — no demo clinical
 * narratives, per the product owner's explicit instruction. But the
 * role-visibility, confidence-presence and time-resolution invariants below
 * still need at least one realistic record to exercise the rule against, and
 * there is no mutation path that creates a Digital Twin snapshot (those are
 * backend-populated), so a fixture is the only way to test that logic at all.
 * Kept here, clearly test-only, so the suite never depends on — or
 * accidentally reintroduces — invented clinical content in the product itself.
 */

export const FIXTURE_PATIENT_ID = 'fixture-patient'

export const fixtureNotes: Note[] = [
  {
    id: 'fx-note-1',
    patientId: FIXTURE_PATIENT_ID,
    type: 'patient',
    title: 'Example patient-visible note',
    message: 'Fixture content for the safety-test suite.',
    createdBy: 'Fixture Oncologist',
    createdDate: '2026-01-01',
  },
  {
    id: 'fx-note-2',
    patientId: FIXTURE_PATIENT_ID,
    type: 'private',
    title: 'Example private note',
    message: 'Fixture content the patient must never receive.',
    createdBy: 'Fixture Oncologist',
    createdDate: '2026-01-02',
  },
]

export const fixtureReports: Report[] = [
  {
    id: 'fx-report-1',
    patientId: FIXTURE_PATIENT_ID,
    name: 'Fixture report',
    type: 'Other',
    hospital: 'Fixture Hospital',
    uploadDate: '2026-01-03',
    reportDate: '2026-01-02',
    status: 'processed',
    fileSizeKb: 100,
    fileKind: 'pdf',
    aiSummary: 'Fixture summary for the confidence-presence check.',
    aiConfidence: 0.9,
    keyFindings: ['Fixture finding'],
  },
]

export const fixtureTimeline: TimelineEvent[] = [
  {
    id: 'fx-tl-1',
    patientId: FIXTURE_PATIENT_ID,
    date: '2026-01-02',
    type: 'report',
    title: 'Fixture report event',
    description: 'Visible to both roles.',
    relatedReportId: 'fx-report-1',
    visibility: 'both',
  },
  {
    id: 'fx-tl-2',
    patientId: FIXTURE_PATIENT_ID,
    date: '2026-01-04',
    type: 'note',
    title: 'Fixture oncologist-only event',
    description: 'Must never reach a patient session.',
    relatedNoteId: 'fx-note-2',
    visibility: 'oncologist',
  },
]

export const fixtureDigitalTwinSnapshots: DigitalTwinSnapshot[] = [
  {
    id: 'fx-dt-1',
    patientId: FIXTURE_PATIENT_ID,
    date: '2026-01-01',
    label: 'Fixture baseline',
    overallAssessment: 'Fixture snapshot for time-resolution and organ-validity checks.',
    organStatuses: [{ organId: 'left-lung', severity: 2, note: 'Fixture finding' }],
  },
  {
    id: 'fx-dt-2',
    patientId: FIXTURE_PATIENT_ID,
    date: '2026-06-01',
    label: 'Fixture follow-up',
    overallAssessment: 'Fixture snapshot for time-resolution and organ-validity checks.',
    organStatuses: [{ organId: 'left-lung', severity: 1, note: 'Fixture finding' }],
  },
]

export const fixtureIntelligence = {
  patientId: FIXTURE_PATIENT_ID,
  generatedDate: '2026-01-05',
  clinicalSummary: 'Fixture summary for the confidence-presence check.',
  currentDiseaseStatus: 'Fixture status',
  affectedOrgans: ['Left Lung'],
  diseaseSeverity: 'Mild' as const,
  recentChanges: [{ label: 'Fixture change', type: 'stable' as const, description: 'Fixture description.' }],
  treatmentOverview: { current: 'Fixture treatment', previous: [], recentChange: 'None.' },
  supportingEvidence: [
    { reportId: 'fx-report-1', reportName: 'Fixture report', reportDate: '2026-01-02', finding: 'Fixture finding' },
  ],
  confidence: 0.9,
}
