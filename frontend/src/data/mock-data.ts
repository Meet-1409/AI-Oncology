import type {
  AppNotification,
  DigitalTwinSnapshot,
  Note,
  Oncologist,
  PatientIntelligence,
  PatientRecord,
  PatientTask,
  Report,
  TimelineEvent,
} from '@/types'

/**
 * Product data — genuinely empty.
 *
 * No invented patients, diagnoses, reports, or clinical narratives ship with
 * this product. What exists here is account-level scaffolding only: the one
 * demo oncologist identity you sign in as, and helpers the mock backend
 * (`data/adapters/mock-store.ts`) uses to create a fresh, empty patient
 * record the moment someone actually signs in as a patient — never a
 * pre-written case history.
 *
 * Test fixtures for the patient-safety regression suite live in
 * `tools/fixtures.ts`, not here, precisely so the suite never depends on
 * — or accidentally reintroduces — invented clinical content in the product
 * itself.
 */

export const AVATAR_COLORS = ['#1f607c', '#7c3f9e', '#17803f', '#a3620a', '#b3435c', '#2f7a97'] as const

export function colorForId(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]!
}

/** A readable display name from an email address, never a fabricated identity. */
export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'there'
  return local
    .replace(/[._-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ')
}

// ---------------------------------------------------------------------------
// Oncologist — one demo account. This is account/identity scaffolding to
// make sign-in possible, not a clinical narrative.
// ---------------------------------------------------------------------------

export function synthesizeOncologist(email: string): Oncologist {
  return {
    id: 'demo-oncologist',
    role: 'oncologist',
    name: nameFromEmail(email),
    email,
    avatarColor: colorForId('demo-oncologist'),
    specialization: '',
    qualification: '',
    hospital: '',
    patientIds: [],
  }
}

/** A freshly signed-in patient has a real account and nothing recorded yet. */
export function synthesizePatient(id: string, email: string): PatientRecord {
  return {
    id,
    role: 'patient',
    name: nameFromEmail(email),
    email,
    avatarColor: colorForId(id),
    patientCode: `AOP-${id.slice(-6).toUpperCase()}`,
    dob: '',
    gender: 'Other',
    bloodGroup: '',
    heightCm: 0,
    weightKg: 0,
    treatingOncologistId: 'demo-oncologist',
    primaryCancer: '',
    primarySite: '',
    stage: '',
    diagnosisDate: '',
    treatmentStatus: 'newly-diagnosed',
    currentTreatment: '',
    allergies: [],
    currentMedications: [],
    previousTreatments: [],
    pastSurgeries: [],
    familyHistory: '',
    smokingHistory: '',
    alcoholHistory: '',
    comorbidities: [],
  }
}

// ---------------------------------------------------------------------------
// Everything below starts empty and is filled only by real use — uploading
// a report, assigning a task, writing a note. See mock-store.ts.
// ---------------------------------------------------------------------------

export const patients: PatientRecord[] = []
export const patientById = (id: string, source: PatientRecord[] = patients) =>
  source.find((p) => p.id === id)

export const reports: Report[] = []
export const reportsForPatient = (patientId: string, source: Report[] = reports) =>
  source.filter((r) => r.patientId === patientId)

export const timelineEvents: TimelineEvent[] = []
export const timelineForPatient = (patientId: string, source: TimelineEvent[] = timelineEvents) =>
  source.filter((e) => e.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date))

export const tasks: PatientTask[] = []
export const tasksForPatient = (patientId: string, source: PatientTask[] = tasks) =>
  source.filter((t) => t.patientId === patientId)

export const notes: Note[] = []
export const patientNotesFor = (patientId: string, source: Note[] = notes) =>
  source.filter((n) => n.patientId === patientId && n.type === 'patient')
export const privateNotesFor = (patientId: string, source: Note[] = notes) =>
  source.filter((n) => n.patientId === patientId && n.type === 'private')

export const notifications: AppNotification[] = []
export const notificationsForUser = (userId: string, source: AppNotification[] = notifications) =>
  source.filter((n) => n.userId === userId).sort((a, b) => b.date.localeCompare(a.date))

export const digitalTwinSnapshots: DigitalTwinSnapshot[] = []
export const digitalTwinForPatient = (patientId: string, source: DigitalTwinSnapshot[] = digitalTwinSnapshots) =>
  source.filter((s) => s.patientId === patientId).sort((a, b) => a.date.localeCompare(b.date))

export const patientIntelligence: PatientIntelligence[] = []
export const intelligenceForPatient = (patientId: string, source: PatientIntelligence[] = patientIntelligence) =>
  source.find((p) => p.patientId === patientId)
