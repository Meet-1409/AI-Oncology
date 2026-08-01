import { ApiFailure } from '@/data/contract/envelope'
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
  oncologist,
  patients,
  reports as seedReports,
  tasks as seedTasks,
  timelineEvents as seedTimeline,
} from '@/data/mock-data'

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
 */

let sequence = 5000
const nextId = (prefix: string) => `${prefix}${(sequence += 1)}`
const today = () => new Date().toISOString().slice(0, 10)

const state = {
  reports: [...seedReports],
  timeline: [...seedTimeline],
  tasks: [...seedTasks],
  notes: [...seedNotes],
  notifications: [...seedNotifications],
}

function requirePatient(patientId: string) {
  const patient = patients.find((p) => p.id === patientId)
  if (!patient) {
    throw new ApiFailure({ kind: 'not_found', message: 'That patient could not be found.' })
  }
  return patient
}

/** Patients never receive private notes or internal clinical detail [09.5 §19]. */
function timelineFor(patientId: string, role: UserRole): TimelineEvent[] {
  const events = state.timeline.filter((e) => e.patientId === patientId)
  const visible =
    role === 'patient'
      ? events.filter((e) => e.visibility === 'patient' || e.visibility === 'both')
      : events
  return [...visible].sort((a, b) => b.date.localeCompare(a.date))
}

function notesFor(patientId: string, role: UserRole): Note[] {
  const all = state.notes.filter((n) => n.patientId === patientId)
  return role === 'patient' ? all.filter((n) => n.type === 'patient') : all
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
    userId: oncologist.id,
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
      userId: oncologist.id,
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
    userId: oncologist.id,
    category: 'task-completed',
    title: 'Task completed',
    message: `${task.title} was completed.`,
    date: today(),
    read: false,
    link: `/patient/${task.patientId}`,
  })

  return updated
}

interface Params {
  [key: string]: string | number | boolean | undefined
}

/** Routes a path to its handler. Mirrors the endpoints the backend will expose. */
function handle(path: string, params?: Params, body?: unknown): unknown {
  const role = (params?.role as UserRole) ?? 'oncologist'
  const segments = path.split('/').filter(Boolean)

  // /session
  if (path === '/session') {
    const patientId = params?.patientId as string | undefined
    if (role === 'patient') {
      const patient = requirePatient(patientId ?? patients[0]!.id)
      return { role: 'patient' as const, user: patient }
    }
    return { role: 'oncologist' as const, user: oncologist }
  }

  // /patients
  if (path === '/patients') {
    return {
      items: patients.filter((p) => oncologist.patientIds.includes(p.id)),
      page: { cursor: null, hasMore: false, total: patients.length },
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
  }

  // /signals
  if (path === '/signals') {
    const userId = (params?.userId as string) ?? oncologist.id
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
