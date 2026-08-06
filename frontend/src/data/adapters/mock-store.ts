import { ApiFailure } from '@/data/contract/envelope'
import type { ReportComparison } from '@/data/contract/domain'
import type {
  AppNotification,
  Note,
  PatientTask,
  Report,
  TimelineEvent,
  UserRole,
} from '@/types'
import {
  digitalTwinForPatient,
  intelligenceForPatient,
  notes as seedNotes,
  notifications as seedNotifications,
  patients as seedPatients,
  reports as seedReports,
  synthesizeOncologist,
  synthesizePatient,
  tasks as seedTasks,
  timelineEvents as seedTimeline,
} from '@/data/mock-data'
import type { PatientRecord } from '@/types'

/**
 * Mutable in-memory store behind the mock adapter.
 *
 * Mirrors what the backend would own so the UI exercises real flows: uploading a
 * report creates a timeline event and a Signal, completing a task updates the
 * Journey, and so on. None of this is business logic the frontend keeps — it is a
 * stand-in for the backend, confined entirely to `data/adapters`.
 *
 * Visibility rules are applied here because the backend enforces them [02 §7].
 * The query layer applies them a second time as defence in depth.
 *
 * There is no seeded patient roster. `state.patients` starts empty and gains
 * exactly one entry the moment someone actually signs in as a patient — a
 * fresh, empty record, not a pre-written case history. See mock-data.ts.
 */

/** Every session in this demo shares one oncologist account. */
export const DEMO_ONCOLOGIST_ID = 'demo-oncologist'

let sequence = 5000
const nextId = (prefix: string) => `${prefix}${(sequence += 1)}`
const today = () => new Date().toISOString().slice(0, 10)

/**
 * A real backend persists what it's given. This mock backend is otherwise
 * just an in-memory module — everything in `state` would vanish on a page
 * reload, which for a signed-in patient's own record would mean signing in
 * once, then losing "their" record the moment the tab refreshes. localStorage
 * is the honest stand-in for that persistence, not a workaround for it.
 */
const PERSIST_KEY = 'ao.mock-store.v1'

interface PersistedShape {
  patients: PatientRecord[]
  oncologistIdentity: ReturnType<typeof synthesizeOncologist> | null
}

function loadPersisted(): PersistedShape | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(PERSIST_KEY)
    return raw ? (JSON.parse(raw) as PersistedShape) : null
  } catch {
    return null
  }
}

function savePersisted(): void {
  if (typeof localStorage === 'undefined') return
  const shape: PersistedShape = {
    patients: state.patients,
    oncologistIdentity: state.oncologistIdentity,
  }
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(shape))
  } catch {
    // Storage full or unavailable — the session still works for this page
    // load, it just won't survive a reload. Not worth failing the request.
  }
}

const persisted = loadPersisted()

const state = {
  patients: persisted?.patients ?? ([...seedPatients] as PatientRecord[]),
  reports: [...seedReports],
  timeline: [...seedTimeline],
  tasks: [...seedTasks],
  notes: [...seedNotes],
  notifications: [...seedNotifications],
  // Set once at sign-in and reused for every subsequent /session read — the
  // identity established when someone actually signs in must not be lost
  // the moment a query re-fetches without the original email to hand.
  oncologistIdentity: persisted?.oncologistIdentity ?? null,
}

function requirePatient(patientId: string) {
  const patient = state.patients.find((p) => p.id === patientId)
  if (!patient) {
    console.error(
      '[mock-store] requirePatient miss:',
      patientId,
      'known ids:',
      state.patients.map((p) => p.id),
    )
    throw new ApiFailure({ kind: 'not_found', message: 'That patient could not be found.' })
  }
  return patient
}

/** Patients never receive private notes or internal clinical detail [09.5 §19]. */
export function filterTimelineForRole(events: TimelineEvent[], role: UserRole): TimelineEvent[] {
  const visible =
    role === 'patient'
      ? events.filter((e) => e.visibility === 'patient' || e.visibility === 'both')
      : events
  return [...visible].sort((a, b) => b.date.localeCompare(a.date))
}

export function filterNotesForRole(notes: Note[], role: UserRole): Note[] {
  return role === 'patient' ? notes.filter((n) => n.type === 'patient') : notes
}

function timelineFor(patientId: string, role: UserRole): TimelineEvent[] {
  return filterTimelineForRole(
    state.timeline.filter((e) => e.patientId === patientId),
    role,
  )
}

function notesFor(patientId: string, role: UserRole): Note[] {
  return filterNotesForRole(
    state.notes.filter((n) => n.patientId === patientId),
    role,
  )
}

function addTimelineEvent(event: Omit<TimelineEvent, 'id'>): void {
  state.timeline = [{ ...event, id: nextId('tl') }, ...state.timeline]
}

function addNotification(notification: Omit<AppNotification, 'id'>): void {
  state.notifications = [{ ...notification, id: nextId('notif') }, ...state.notifications]
}

interface UploadBody {
  file: File
  fields: Record<string, string>
}

function createReport(patientId: string, body: UploadBody): Report {
  const { file, fields } = body
  const name = fields.name?.trim() || file.name.replace(/\.[^.]+$/, '')
  const report: Report = {
    id: nextId('r'),
    patientId,
    name,
    type: (fields.type as Report['type']) ?? 'Other',
    hospital: fields.hospital?.trim() || 'Not specified',
    uploadDate: today(),
    reportDate: fields.reportDate || today(),
    status: 'processing',
    fileSizeKb: Math.max(1, Math.round(file.size / 1024)),
    fileKind: /\.(png|jpe?g)$/i.test(file.name) ? 'image' : 'pdf',
  }

  state.reports = [report, ...state.reports]

  addTimelineEvent({
    patientId,
    date: report.uploadDate,
    type: 'upload',
    title: `${report.name} uploaded`,
    description: `${report.type} uploaded and queued for analysis.`,
    relatedReportId: report.id,
    visibility: 'both',
  })

  addNotification({
    userId: DEMO_ONCOLOGIST_ID,
    category: 'report-uploaded',
    title: 'New report uploaded',
    message: `${report.name} was uploaded and is being processed.`,
    date: report.uploadDate,
    read: false,
    link: `/patient/${patientId}`,
  })

  if (fields.taskId) completeTask(fields.taskId, report.id)

  // Processing completes asynchronously, so the interface exercises the real
  // uploaded -> processing -> processed sequence [09.4 §15].
  setTimeout(() => {
    state.reports = state.reports.map((r) =>
      r.id === report.id
        ? {
            ...r,
            status: 'processed',
            aiSummary:
              'Analysis complete. Extracted findings are linked to their supporting evidence in the original document.',
            aiConfidence: 0.86,
            keyFindings: ['Report classified and indexed', 'Linked to the patient timeline'],
          }
        : r,
    )
    addNotification({
      userId: DEMO_ONCOLOGIST_ID,
      category: 'ai-processed',
      title: 'Analysis complete',
      message: `Findings for ${report.name} are ready for review.`,
      date: today(),
      read: false,
      link: `/patient/${patientId}`,
    })
  }, 6000)

  return report
}

function completeTask(taskId: string, reportId?: string): PatientTask {
  const task = state.tasks.find((t) => t.id === taskId)
  if (!task) {
    throw new ApiFailure({ kind: 'not_found', message: 'That task could not be found.' })
  }
  if (task.status === 'completed') return task

  const updated: PatientTask = {
    ...task,
    status: 'completed',
    completedDate: today(),
    uploadedReportIds: reportId ? [...task.uploadedReportIds, reportId] : task.uploadedReportIds,
  }
  state.tasks = state.tasks.map((t) => (t.id === taskId ? updated : t))

  addTimelineEvent({
    patientId: task.patientId,
    date: updated.completedDate ?? today(),
    type: 'task',
    title: `Task completed: ${task.title}`,
    description: 'The requested information was submitted.',
    relatedTaskId: task.id,
    visibility: 'both',
  })

  addNotification({
    userId: DEMO_ONCOLOGIST_ID,
    category: 'task-completed',
    title: 'Task completed',
    message: `${task.title} was completed.`,
    date: today(),
    read: false,
    link: `/patient/${task.patientId}`,
  })

  return updated
}

/**
 * Directional vocabulary for classifying a new finding [08 §9]. Deliberately a
 * closed, documented list rather than free-form inference — a finding that
 * matches neither list is not guessed at; it is returned in `otherFindings`
 * instead of being forced into a direction the wording does not support.
 */
const REGRESSION_WORDS = [
  'reduc', 'regress', 'resolv', 'improv', 'decreas', 'response', 'no evidence',
  'no recurrence', 'clear margins', 'negative',
]
const PROGRESSION_WORDS = [
  'increas', 'enlarg', 'new ', 'progress', 'worsen', 'recurrence', 'metasta', 'grew', 'growing',
]

function classifyFinding(text: string): 'progression' | 'regression' | null {
  const lower = text.toLowerCase()
  if (REGRESSION_WORDS.some((word) => lower.includes(word))) return 'regression'
  if (PROGRESSION_WORDS.some((word) => lower.includes(word))) return 'progression'
  return null
}

/**
 * Compares two reports [09.4 §14].
 *
 * Only two things are ever asserted with a direction: a finding stated
 * identically in both reports (stable — positive evidence of no change, not an
 * inference from absence), and a new finding whose own wording matches the
 * documented directional vocabulary above. A finding merely absent from the
 * later report is never read as resolved — absence is not evidence [08 §9],
 * [08 §17] — so only what the later report actually states is compared.
 *
 * This stands in for the AI comparison service [08 §9]; once a backend exists,
 * this function is deleted and the read below points at it instead.
 */
function compareReports(from: Report, to: Report): ReportComparison {
  const fromFindings = new Set(from.keyFindings ?? [])
  const toFindings = to.keyFindings ?? []

  const detectedChanges: ReportComparison['detectedChanges'] = []
  const otherFindings: string[] = []
  const supportingEvidence: ReportComparison['supportingEvidence'] = []

  for (const finding of toFindings) {
    if (fromFindings.has(finding)) {
      detectedChanges.push({
        label: finding,
        type: 'stable',
        description: `Also stated in the earlier report (${from.name}).`,
      })
      supportingEvidence.push({
        reportId: from.id,
        reportName: from.name,
        reportDate: from.reportDate,
        finding,
      })
      continue
    }

    const direction = classifyFinding(finding)
    if (direction) {
      detectedChanges.push({ label: finding, type: direction, description: finding })
    } else {
      otherFindings.push(finding)
    }
    supportingEvidence.push({
      reportId: to.id,
      reportName: to.name,
      reportDate: to.reportDate,
      finding,
    })
  }

  const classified = detectedChanges.length
  const total = toFindings.length

  return {
    fromReportId: from.id,
    toReportId: to.id,
    detectedChanges,
    otherFindings,
    supportingEvidence,
    // How much of the later report's findings this comparison could ground in
    // explicit wording — not a clinical likelihood [00 §5.10], [08 §14].
    confidence: total === 0 ? 0 : classified / total,
  }
}

interface Params {
  [key: string]: string | number | boolean | undefined
}

/** Routes a path to its handler. Mirrors the endpoints the backend will expose. */
function handle(path: string, params?: Params, body?: unknown): unknown {
  const role = (params?.role as UserRole) ?? 'oncologist'
  const segments = path.split('/').filter(Boolean)

  // /session — no seeded identity to look up. A patient signing in for the
  // first time gets a fresh, empty record created here, not a pre-written
  // one; signing back in with the same id returns that same record.
  if (path === '/session') {
    const patientId = params?.patientId as string | undefined
    const email = (params?.email as string | undefined) ?? 'you@example.com'
    if (role === 'patient') {
      const existing = patientId ? state.patients.find((p) => p.id === patientId) : undefined
      if (existing) return { role: 'patient' as const, user: existing }
      const created = synthesizePatient(nextId('patient'), email)
      state.patients = [...state.patients, created]
      savePersisted()
      return { role: 'patient' as const, user: created }
    }
    if (params?.email || !state.oncologistIdentity) {
      state.oncologistIdentity = synthesizeOncologist(email)
      savePersisted()
    }
    return { role: 'oncologist' as const, user: state.oncologistIdentity }
  }

  // /patients — every patient who has ever signed in, in this session.
  if (path === '/patients') {
    return {
      items: state.patients,
      page: { cursor: null, hasMore: false, total: state.patients.length },
    }
  }

  if (segments[0] === 'patients' && segments[1]) {
    const patientId = segments[1]
    const patient = requirePatient(patientId)

    // Aggregated read: entering a space is one request, not six [02 §9].
    if (segments.length === 2) {
      return {
        patient,
        reports: state.reports.filter((r) => r.patientId === patientId),
        timeline: timelineFor(patientId, role),
        tasks: state.tasks.filter((t) => t.patientId === patientId),
        notes: notesFor(patientId, role),
        // All clinical dates together, so scrubbing never awaits the network [02 §11].
        body: digitalTwinForPatient(patientId),
        understanding: role === 'oncologist' ? (intelligenceForPatient(patientId) ?? null) : null,
      }
    }

    // /patients/:id/reports/compare — comparing two reports is an oncologist
    // action [09.4 §14]; both reports must belong to this patient.
    if (segments[2] === 'reports' && segments[3] === 'compare') {
      const fromId = params?.from as string | undefined
      const toId = params?.to as string | undefined
      if (!fromId || !toId) {
        throw new ApiFailure({ kind: 'validation', message: 'Select two reports to compare.' })
      }
      const patientReports = state.reports.filter((r) => r.patientId === patientId)
      const fromReport = patientReports.find((r) => r.id === fromId)
      const toReport = patientReports.find((r) => r.id === toId)
      if (!fromReport || !toReport) {
        throw new ApiFailure({
          kind: 'not_found',
          message: 'One of the selected reports could not be found.',
        })
      }
      // Comparison always reads chronologically, regardless of selection order.
      const [earlier, later] =
        fromReport.reportDate <= toReport.reportDate ? [fromReport, toReport] : [toReport, fromReport]
      return compareReports(earlier, later)
    }
  }

  // /signals
  if (path === '/signals') {
    const userId = (params?.userId as string) ?? DEMO_ONCOLOGIST_ID
    return {
      items: state.notifications
        .filter((n) => n.userId === userId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    }
  }

  // Mutations
  if (path.startsWith('/mutations/')) {
    return mutate(path.slice('/mutations/'.length), body)
  }

  throw new ApiFailure({ kind: 'not_found', message: 'That information is not available.' })
}

function mutate(action: string, body: unknown): unknown {
  const input = (body ?? {}) as Record<string, never>

  switch (action) {
    case 'upload-report': {
      const { patientId } = input as unknown as { patientId: string }
      return createReport(patientId, body as unknown as UploadBody)
    }

    case 'create-task': {
      const payload = body as unknown as Omit<PatientTask, 'id' | 'status' | 'uploadedReportIds'>
      const task: PatientTask = {
        ...payload,
        id: nextId('task'),
        status: 'pending',
        uploadedReportIds: [],
      }
      state.tasks = [task, ...state.tasks]
      addTimelineEvent({
        patientId: task.patientId,
        date: task.assignedDate,
        type: 'task',
        title: `New task assigned: ${task.title}`,
        description: task.description,
        relatedTaskId: task.id,
        visibility: 'patient',
      })
      addNotification({
        userId: task.patientId,
        category: 'task-assigned',
        title: 'New task assigned',
        message: task.title,
        date: task.assignedDate,
        read: false,
        link: '/home',
      })
      return task
    }

    case 'cancel-task': {
      const { taskId } = body as unknown as { taskId: string }
      const task = state.tasks.find((t) => t.id === taskId)
      if (!task) {
        throw new ApiFailure({ kind: 'not_found', message: 'That task could not be found.' })
      }
      const updated: PatientTask = { ...task, status: 'cancelled' }
      state.tasks = state.tasks.map((t) => (t.id === taskId ? updated : t))
      return updated
    }

    case 'complete-task': {
      const { taskId } = body as unknown as { taskId: string }
      return completeTask(taskId)
    }

    case 'create-note': {
      const payload = body as unknown as Omit<Note, 'id' | 'createdDate'>
      const note: Note = { ...payload, id: nextId('n'), createdDate: today() }
      state.notes = [note, ...state.notes]
      addTimelineEvent({
        patientId: note.patientId,
        date: note.createdDate,
        type: 'note',
        title:
          note.type === 'private'
            ? 'Private observation added'
            : `Note from ${note.createdBy}`,
        description: note.title,
        relatedNoteId: note.id,
        visibility: note.type === 'private' ? 'oncologist' : 'both',
      })
      if (note.type === 'patient') {
        addNotification({
          userId: note.patientId,
          category: 'note-added',
          title: 'New note from your oncologist',
          message: note.title,
          date: note.createdDate,
          read: false,
          link: '/home',
        })
      }
      return note
    }

    case 'read-signal': {
      const { signalId } = body as unknown as { signalId: string }
      state.notifications = state.notifications.map((n) =>
        n.id === signalId ? { ...n, read: true } : n,
      )
      return { ok: true }
    }

    case 'read-all-signals': {
      const { userId } = body as unknown as { userId: string }
      state.notifications = state.notifications.map((n) =>
        n.userId === userId ? { ...n, read: true } : n,
      )
      return { ok: true }
    }

    default:
      throw new ApiFailure({ kind: 'not_found', message: 'That action is not available.' })
  }
}

export const mockStore = { handle }
