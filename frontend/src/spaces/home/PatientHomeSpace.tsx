import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Control, Icon, Text } from '@/components/primitives'
import { EmptyState, ErrorState, LoadingSurface, ProcessingStatusIndicator } from '@/components/patterns'
import { Reveal } from '@/components/motion'
import { ActionsView } from '@/features/actions'
import { JourneyView } from '@/features/journey'
import { GuidanceView } from '@/features/guidance'
import { UploadComposer } from '@/features/evidence'
import { usePatientSpace } from '@/data/queries'
import { useSessionStore } from '@/state/session-store'
import { formatRelativeTime } from '@/lib/format'
import { EventFocus, ReportFocus, TaskFocus } from '@/spaces/focus'
import type { PatientTask, Report, TimelineEvent } from '@/types'

/**
 * Patient Home Space — the patient's arrival point, Depth 1.
 *
 * A calm, continuous surface answering one question: what is the next thing this
 * patient needs [09.1 §1]. Actions come FIRST and closest to the viewer, because
 * they are the most urgent thing [09.8 §5].
 *
 * Medical terminology is minimized [09.1 §1] and the patient must never feel
 * overwhelmed [00 §10.10] — so this space shows a short, ordered set of things
 * rather than everything at once.
 */

export default function PatientHomeSpace() {
  const userId = useSessionStore((s) => s.userId)
  const { data, isLoading, isError, refetch } = usePatientSpace(userId ?? undefined)

  const [uploadFor, setUploadFor] = useState<{ taskId?: string; name?: string } | null>(null)
  const [focusReport, setFocusReport] = useState<Report | null>(null)
  const [focusEvent, setFocusEvent] = useState<TimelineEvent | null>(null)
  const [focusTask, setFocusTask] = useState<PatientTask | null>(null)

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <LoadingSurface lines={4} label="Loading your information" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
        <ErrorState
          title="Your information could not be loaded"
          description="Check your connection and try again. Nothing has been lost."
          onRetry={() => void refetch()}
        />
      </div>
    )
  }

  const { patient, tasks, reports, timeline, notes } = data
  const openTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress')
  const recentReports = [...reports].sort((a, b) => b.uploadDate.localeCompare(a.uploadDate)).slice(0, 3)
  const recentNotes = [...notes].sort((a, b) => b.createdDate.localeCompare(a.createdDate)).slice(0, 2)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header>
        <Text as="h1" level="title" tone="primary">
          Hello, {patient.name.split(' ')[0]}
        </Text>
        <Text level="secondary" tone="muted" className="mt-1">
          {today}
        </Text>
        {/* One plain sentence explaining the space, before any of it [04 §28].
            A patient may be opening their own cancer record for the first time;
            being told what they are looking at costs one line. */}
        <Text level="secondary" tone="body" className="mt-3 max-w-xl">
          Everything your care team has about you, in one place. Anything that
          needs you is at the top.
        </Text>
      </header>

      {/* Actions first, closest to the viewer [09.8 §5]. */}
      <section className="mt-10" aria-labelledby="actions-heading">
        <Text as="h2" id="actions-heading" level="subheading" tone="primary">
          {openTasks.length > 0 ? 'What you need to do' : "You're up to date"}
        </Text>
        <div className="mt-4">
          <ActionsView
            tasks={openTasks}
            onOpenTask={setFocusTask}
            onUploadForTask={(task) =>
              setUploadFor({ taskId: task.id, name: task.title.replace(/^Upload /, '') })
            }
          />
        </div>
      </section>

      {/* Recent uploads. */}
      <section className="mt-12" aria-labelledby="uploads-heading">
        <div className="flex items-center justify-between gap-3">
          <Text as="h2" id="uploads-heading" level="subheading" tone="primary">
            Your recent uploads
          </Text>
          <Control intent="primary" size="sm" onClick={() => setUploadFor({})}>
            <Icon icon={FileText} size="xs" />
            Upload a report
          </Control>
        </div>

        {recentReports.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Nothing uploaded yet"
            description="When you upload a report it appears here, and your oncologist can see it straight away."
            className="mt-4"
          />
        ) : (
          <ul className="mt-4 divide-y divide-[var(--border-subtle)]">
            {recentReports.map((report, index) => (
              <li key={report.id}>
                <Reveal index={index}>
                  <button
                    type="button"
                    onClick={() => setFocusReport(report)}
                    className="flex w-full items-center gap-3 px-2 py-3 text-left transition-colors duration-[var(--motion-quick)] hover:bg-[var(--surface-sunken)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                  >
                    <span className="min-w-0 flex-1">
                      <Text as="span" level="secondary" tone="primary" weight="medium" truncate>
                        {report.name}
                      </Text>
                      <Text level="caption" tone="muted">
                        Uploaded {formatRelativeTime(report.uploadDate)}
                      </Text>
                    </span>
                    <ProcessingStatusIndicator status={report.status} />
                  </button>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Notes from the oncologist. */}
      <section className="mt-12" aria-labelledby="guidance-heading">
        <Text as="h2" id="guidance-heading" level="subheading" tone="primary">
          From your oncologist
        </Text>
        <div className="mt-4">
          <GuidanceView notes={recentNotes} canFilterType={false} />
        </div>
      </section>

      {/* A short look at the journey so far. */}
      <section className="mt-12" aria-labelledby="journey-heading">
        <Text as="h2" id="journey-heading" level="subheading" tone="primary">
          Your journey so far
        </Text>
        <div className="mt-4">
          <JourneyView
            events={timeline.slice(0, 6)}
            onSelectDate={() => undefined}
            onOpenEvent={setFocusEvent}
          />
        </div>
      </section>

      {focusReport && <ReportFocus report={focusReport} onClose={() => setFocusReport(null)} />}
      {focusEvent && <EventFocus event={focusEvent} onClose={() => setFocusEvent(null)} />}
      {focusTask && <TaskFocus task={focusTask} onClose={() => setFocusTask(null)} />}

      {uploadFor && userId && (
        <UploadComposer
          open
          onOpenChange={(next) => !next && setUploadFor(null)}
          patientId={userId}
          taskId={uploadFor.taskId}
          defaultName={uploadFor.name}
        />
      )}
    </div>
  )
}
