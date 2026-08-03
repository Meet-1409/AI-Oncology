import { useCallback, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  Activity,
  FileText,
  ListChecks,
  Sparkles,
  StickyNote,
  UserRound,
} from 'lucide-react'
import type { IconComponent } from '@/components/primitives'
import { Control, Icon, StatusIndicator, Text } from '@/components/primitives'
import { ErrorState, LoadingSurface } from '@/components/patterns'
import { BodyView } from '@/features/body'
import { JourneyView } from '@/features/journey'
import { EvidenceView, UploadComposer } from '@/features/evidence'
import { UnderstandingView } from '@/features/understanding'
import { ActionsView, TaskComposer } from '@/features/actions'
import { GuidanceView, NoteComposer } from '@/features/guidance'
import { usePatientSpace } from '@/data/queries'
import { useSessionStore } from '@/state/session-store'
import { SPACE_PARAM } from '@/routes/paths'
import { calculateAge } from '@/lib/format'
import { cn } from '@/lib/utils'
import { ReportFocus, EventFocus, TaskFocus } from '@/spaces/focus'
import { PatientOverview } from './PatientOverview'
import type { Report, PatientTask, TimelineEvent } from '@/types'

/**
 * Patient Space — Depth 2.
 *
 * Everything belonging to one Patient Case, with the Body at the centre [09.3 §5].
 * The Body is present on arrival and does not need to be opened [09.3 §14].
 *
 * The Contextual Orbit provides the destinations. It is derived from context, not
 * a fixed menu, and reveals content ALONGSIDE the Body rather than replacing the
 * space [09.3 §5] — the Body always remains present.
 *
 * Time, organ selection and comparison live in the URL because they modify the
 * state of this space rather than navigating away from it [00 §15.5].
 */

type OrbitId = 'information' | 'journey' | 'evidence' | 'understanding' | 'actions' | 'guidance'

interface OrbitEntry {
  id: OrbitId
  label: string
  clinical: string
  /**
   * What the destination actually contains, in words that need no explaining.
   *
   * The spatial name and the clinical name are both correct and neither is
   * self-evident to someone opening this for the first time — "Understanding"
   * and "Patient Intelligence" describe the same panel and a patient would
   * guess neither. Every space must be understandable without training
   * [04 §28], so the plain sentence is shown for whichever destination is open.
   */
  plain: string
  icon: IconComponent
  /** Oncologist-only destinations are omitted for patients [09.7 §2]. */
  oncologistOnly?: boolean
}

const ORBIT: readonly OrbitEntry[] = [
  {
    id: 'information',
    label: 'Information',
    clinical: 'Patient details',
    plain: 'Personal and contact details, and who is responsible for this care.',
    icon: UserRound,
  },
  {
    id: 'journey',
    label: 'Journey',
    clinical: 'Timeline',
    plain: 'Everything that has happened so far, in the order it happened.',
    icon: Activity,
  },
  {
    id: 'evidence',
    label: 'Evidence',
    clinical: 'Reports',
    plain: 'The actual documents — scans, biopsies and blood tests, exactly as issued.',
    icon: FileText,
  },
  {
    id: 'understanding',
    label: 'Understanding',
    clinical: 'Patient Intelligence',
    plain:
      'What the system has drawn from the reports, with the evidence behind it. A starting point for review, never a conclusion.',
    icon: Sparkles,
    oncologistOnly: true,
  },
  {
    id: 'actions',
    label: 'Actions',
    clinical: 'Tasks',
    plain: 'Things that still need doing, and who needs to do them.',
    icon: ListChecks,
  },
  {
    id: 'guidance',
    label: 'Guidance',
    clinical: 'Notes',
    plain: 'Written notes from the oncologist. Each one says who can read it.',
    icon: StickyNote,
  },
]

export default function PatientSpace() {
  const { patientId } = useParams<{ patientId: string }>()
  const [params, setParams] = useSearchParams()
  const role = useSessionStore((s) => s.role)
  const isOncologist = role === 'oncologist'

  const { data, isLoading, isError, refetch } = usePatientSpace(patientId)

  const [orbit, setOrbit] = useState<OrbitId>('journey')
  const [uploadFor, setUploadFor] = useState<{ taskId?: string; name?: string } | null>(null)
  const [noteOpen, setNoteOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [focusReport, setFocusReport] = useState<Report | null>(null)
  const [focusEvent, setFocusEvent] = useState<TimelineEvent | null>(null)
  const [focusTask, setFocusTask] = useState<PatientTask | null>(null)

  const date = params.get(SPACE_PARAM.time) ?? undefined
  const organ = params.get(SPACE_PARAM.organ)
  const compareDate = params.get(SPACE_PARAM.compare) ?? undefined

  const setParam = useCallback(
    (key: string, value: string | undefined) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          if (value === undefined) next.delete(key)
          else next.set(key, value)
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const visibleOrbit = useMemo(
    () => ORBIT.filter((entry) => isOncologist || !entry.oncologistOnly),
    [isOncologist],
  )

  /** Evidence reached from an organ arrives already scoped [09.4 §5]. */
  const scopedReports = useMemo(() => {
    if (!data) return []
    if (!organ) return data.reports
    const snapshot = data.body.find((s) => (date ? s.date <= date : true))
    const evidenceId = snapshot?.organStatuses.find((s) => s.organId === organ)?.evidence?.reportId
    if (!evidenceId) return data.reports
    return data.reports.filter((report) => report.id === evidenceId)
  }, [data, organ, date])

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <LoadingSurface lines={3} label="Loading patient" />
        <div className="mt-8 h-[420px] animate-pulse rounded-xl bg-[var(--surface-sunken)]" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState
          title="This patient could not be opened"
          description="The record could not be loaded. Check your connection and try again."
          onRetry={() => void refetch()}
        />
      </div>
    )
  }

  const { patient } = data
  const reportHref = (reportId: string) => {
    const report = data.reports.find((r) => r.id === reportId)
    if (report) setFocusReport(report)
    return '#'
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      {/* Patient identity remains visible at all times inside Patient Space [09.3 §5]. */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Text as="h1" level="title" tone="primary">
              {patient.name}
            </Text>
            <StatusIndicator tone="info">{patient.stage}</StatusIndicator>
          </div>
          <Text level="secondary" tone="muted" className="mt-1">
            {patient.patientCode} · {calculateAge(patient.dob)} yrs · {patient.gender} ·{' '}
            {patient.primaryCancer}
          </Text>
          <Text level="caption" tone="subtle" className="mt-1">
            {patient.currentTreatment}
          </Text>
        </div>

        {isOncologist && (
          <div className="flex flex-wrap gap-2">
            <Control intent="primary" size="sm" onClick={() => setTaskOpen(true)}>
              <Icon icon={ListChecks} size="xs" />
              Assign a task
            </Control>
            <Control intent="secondary" size="sm" onClick={() => setNoteOpen(true)}>
              <Icon icon={StickyNote} size="xs" />
              Write a note
            </Control>
            <Control intent="secondary" size="sm" onClick={() => setUploadFor({})}>
              <Icon icon={FileText} size="xs" />
              Upload a report
            </Control>
          </div>
        )}
      </header>

      {/* The Body at the centre, present on arrival. */}
      <section className="mt-6" aria-label="Digital Twin">
        <BodyView
          snapshots={data.body}
          date={date}
          compareDate={compareDate}
          selectedOrgan={organ}
          onSelectOrgan={(next) => setParam(SPACE_PARAM.organ, next ?? undefined)}
          onCompareChange={(next) => setParam(SPACE_PARAM.compare, next)}
          reportHref={reportHref}
        />
      </section>

      {/* The Contextual Orbit — 4-6 destinations, revealed on demand [04 §5]. */}
      <nav className="mt-8 border-b border-[var(--border-subtle)]" aria-label="Patient destinations">
        <ul className="-mb-px flex flex-wrap gap-1 overflow-x-auto">
          {visibleOrbit.map((entry) => {
            const active = orbit === entry.id
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setOrbit(entry.id)}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-2.5',
                    'transition-colors duration-[var(--motion-quick)]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
                    active
                      ? 'border-[var(--accent)] text-[var(--accent)]'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  )}
                >
                  <Icon icon={entry.icon} size="sm" />
                  <span className="text-secondary font-medium">{entry.label}</span>
                  <span className="text-caption text-[var(--text-subtle)]">({entry.clinical})</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <section className="mt-6" aria-live="polite">
        {/* What the open destination contains, before its contents [04 §28]. */}
        <Text level="secondary" tone="muted" className="mb-5 max-w-2xl">
          {visibleOrbit.find((entry) => entry.id === orbit)?.plain}
        </Text>

        {orbit === 'information' && <PatientOverview patient={patient} />}

        {orbit === 'journey' && (
          <JourneyView
            events={data.timeline}
            activeDate={date}
            compareDate={compareDate}
            onSelectDate={(next) => setParam(SPACE_PARAM.time, next)}
            onOpenEvent={setFocusEvent}
          />
        )}

        {orbit === 'evidence' && (
          <EvidenceView
            reports={scopedReports}
            onOpenReport={setFocusReport}
            onUpload={() => setUploadFor({})}
            scopeLabel={organ && scopedReports.length !== data.reports.length ? organ : undefined}
            onClearScope={() => setParam(SPACE_PARAM.organ, undefined)}
          />
        )}

        {orbit === 'understanding' && isOncologist && (
          <UnderstandingView understanding={data.understanding} reportHref={reportHref} />
        )}

        {orbit === 'actions' && (
          <ActionsView
            tasks={data.tasks}
            onOpenTask={setFocusTask}
            onUploadForTask={
              isOncologist
                ? undefined
                : (task) => setUploadFor({ taskId: task.id, name: task.title.replace(/^Upload /, '') })
            }
            onCreateTask={isOncologist ? () => setTaskOpen(true) : undefined}
          />
        )}

        {orbit === 'guidance' && (
          <GuidanceView
            notes={data.notes}
            canFilterType={isOncologist}
            onCreateNote={isOncologist ? () => setNoteOpen(true) : undefined}
          />
        )}
      </section>

      {/* Focus layers — Depth 3, above this space, never replacing it [04 §4]. */}
      {focusReport && (
        <ReportFocus report={focusReport} onClose={() => setFocusReport(null)} />
      )}
      {focusEvent && <EventFocus event={focusEvent} onClose={() => setFocusEvent(null)} />}
      {focusTask && <TaskFocus task={focusTask} onClose={() => setFocusTask(null)} />}

      {uploadFor && patientId && (
        <UploadComposer
          open
          onOpenChange={(next) => !next && setUploadFor(null)}
          patientId={patientId}
          taskId={uploadFor.taskId}
          defaultName={uploadFor.name}
        />
      )}

      {taskOpen && patientId && (
        <TaskComposer
          open={taskOpen}
          onOpenChange={setTaskOpen}
          patientId={patientId}
          assignedBy="Dr. Ananya Rao"
        />
      )}

      {noteOpen && patientId && (
        <NoteComposer
          open={noteOpen}
          onOpenChange={setNoteOpen}
          patientId={patientId}
          authorName="Dr. Ananya Rao"
        />
      )}
    </div>
  )
}
