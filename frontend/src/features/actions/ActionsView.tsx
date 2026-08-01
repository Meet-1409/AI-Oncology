import { useMemo, useState } from 'react'
import { CalendarClock, ListChecks, Plus, UploadCloud, User } from 'lucide-react'
import { Control, Field, Icon, Select, Surface, Text } from '@/components/primitives'
import { EmptyState, PriorityIndicator, TaskStatusIndicator } from '@/components/patterns'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { PatientTask, TaskStatus } from '@/types'

/**
 * Actions (Tasks).
 *
 * Presented as a short prioritized sequence, not a board of cards [09.8 §5]. For
 * the patient these are the clearest answer to "what do I need to do next", so
 * pending items come first and instructions stay in plain language [09.8 §9].
 *
 * Creating, reviewing and completing all happen in place, in Focus above the
 * current space [09.8 §5] — neither user leaves their space to work with an Action.
 */

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]['value']

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const

export interface ActionsViewProps {
  tasks: readonly PatientTask[]
  /** Present for the oncologist's cross-patient view [09.8 §5]. */
  patientNameFor?: ((patientId: string) => string | undefined) | undefined
  onOpenTask: (task: PatientTask) => void
  /** Patients upload against a task in place [09.8 §12]. */
  onUploadForTask?: ((task: PatientTask) => void) | undefined
  /** Only oncologists create tasks [09.8 §19]. */
  onCreateTask?: (() => void) | undefined
  className?: string
}

export function ActionsView({
  tasks,
  patientNameFor,
  onOpenTask,
  onUploadForTask,
  onCreateTask,
  className,
}: ActionsViewProps) {
  const [status, setStatus] = useState<'all' | TaskStatus>('all')
  const [sort, setSort] = useState<SortKey>('newest')

  const visible = useMemo(() => {
    let list = [...tasks]
    if (status !== 'all') list = list.filter((task) => task.status === status)

    list.sort((a, b) => {
      // Whatever the sort, outstanding work stays ahead of finished work.
      const aOpen = a.status === 'pending' || a.status === 'in_progress'
      const bOpen = b.status === 'pending' || b.status === 'in_progress'
      if (aOpen !== bOpen) return aOpen ? -1 : 1

      switch (sort) {
        case 'newest':
          return b.assignedDate.localeCompare(a.assignedDate)
        case 'oldest':
          return a.assignedDate.localeCompare(b.assignedDate)
        case 'due':
          return (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
        case 'priority':
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      }
    })
    return list
  }, [tasks, status, sort])

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Nothing needed right now"
        description="You are up to date. Anything requested will appear here."
        action={
          onCreateTask && (
            <Control intent="primary" size="sm" onClick={onCreateTask}>
              <Icon icon={Plus} size="xs" />
              Assign a task
            </Control>
          )
        }
        className={className}
      />
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Status" className="w-44">
          {({ id }) => (
            <Select
              id={id}
              options={STATUS_FILTERS}
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
            />
          )}
        </Field>
        <Field label="Order" className="w-44">
          {({ id }) => (
            <Select
              id={id}
              options={SORT_OPTIONS}
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
            />
          )}
        </Field>
        <div className="flex-1" />
        {onCreateTask && (
          <Control intent="primary" onClick={onCreateTask}>
            <Icon icon={Plus} size="sm" />
            Assign a task
          </Control>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Nothing in this view"
          description="No tasks match this status. Choose a different status to see more."
        />
      ) : (
        <ol className="space-y-3">
          {visible.map((task) => {
            const canUpload =
              onUploadForTask &&
              task.requiresUpload &&
              task.status !== 'completed' &&
              task.status !== 'cancelled'

            return (
              <li key={task.id}>
                <Surface elevation="raised" radius="lg" border="subtle" inset="md">
                  <div className="flex flex-wrap items-center gap-2">
                    <TaskStatusIndicator status={task.status} />
                    <PriorityIndicator priority={task.priority} />
                  </div>

                  <Text level="subheading" tone="primary" className="mt-2.5">
                    {task.title}
                  </Text>
                  <Text level="secondary" tone="muted" measure="comfortable" className="mt-1">
                    {task.description}
                  </Text>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {patientNameFor && (
                      <span className="flex items-center gap-1.5">
                        <Icon icon={User} size="xs" className="text-[var(--text-subtle)]" />
                        <Text as="span" level="caption" tone="muted">
                          {patientNameFor(task.patientId) ?? 'Unknown patient'}
                        </Text>
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Icon icon={CalendarClock} size="xs" className="text-[var(--text-subtle)]" />
                      <Text as="span" level="caption" tone="muted">
                        Assigned {formatDate(task.assignedDate)}
                      </Text>
                    </span>
                    {task.dueDate && (
                      <Text as="span" level="caption" tone="muted">
                        Due {formatDate(task.dueDate)}
                      </Text>
                    )}
                    <Text as="span" level="caption" tone="subtle">
                      By {task.assignedBy}
                    </Text>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {canUpload && (
                      <Control intent="primary" size="sm" onClick={() => onUploadForTask(task)}>
                        <Icon icon={UploadCloud} size="xs" />
                        Upload
                      </Control>
                    )}
                    <Control intent="secondary" size="sm" onClick={() => onOpenTask(task)}>
                      View details
                    </Control>
                  </div>
                </Surface>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
