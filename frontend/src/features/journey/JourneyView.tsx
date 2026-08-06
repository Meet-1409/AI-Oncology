import { useMemo, useState } from 'react'
import {
  Activity,
  CalendarCheck,
  Circle,
  FileText,
  Scissors,
  Search,
  Stethoscope,
  StickyNote,
  Syringe,
  UploadCloud,
} from 'lucide-react'
import type { IconComponent } from '@/components/primitives'
import { Control, Field, Icon, Input, Select, StatusIndicator, Text } from '@/components/primitives'
import { EmptyState } from '@/components/patterns'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { TimelineEvent, TimelineEventType } from '@/types'

/**
 * The Journey (Timeline).
 *
 * A continuous path through time, not a list of rows [09.5 §5]. It is both a view
 * and a control: selecting a date moves the entire Patient Space — including the
 * Body — to that clinical moment [00 §15.5].
 *
 * Events are positioned by their true position in time, so gaps and clusters in
 * treatment are immediately visible.
 */

const TYPE_ICON: Record<TimelineEventType, IconComponent> = {
  diagnosis: Stethoscope,
  report: FileText,
  treatment: Syringe,
  surgery: Scissors,
  'follow-up': CalendarCheck,
  task: Activity,
  note: StickyNote,
  upload: UploadCloud,
  other: Circle,
}

const TYPE_LABEL: Record<TimelineEventType, string> = {
  diagnosis: 'Diagnosis',
  report: 'Report',
  treatment: 'Treatment',
  surgery: 'Surgery',
  'follow-up': 'Follow-up',
  task: 'Task',
  note: 'Note',
  upload: 'Upload',
  other: 'Other',
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
] as const

export interface JourneyViewProps {
  events: readonly TimelineEvent[]
  /** The clinical date the space is currently showing. */
  activeDate?: string | undefined
  /** The date being compared against, highlighted alongside [09.5 §15]. */
  compareDate?: string | undefined
  onSelectDate: (date: string) => void
  onOpenEvent: (event: TimelineEvent) => void
  className?: string
}

export function JourneyView({
  events,
  activeDate,
  compareDate,
  onSelectDate,
  onOpenEvent,
  className,
}: JourneyViewProps) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'all' | TimelineEventType>('all')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')

  const typeOptions = useMemo(
    () => [
      { value: 'all', label: 'All events' },
      ...Array.from(new Set(events.map((e) => e.type))).map((t) => ({
        value: t,
        label: TYPE_LABEL[t],
      })),
    ],
    [events],
  )

  const visible = useMemo(() => {
    let list = [...events]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q),
      )
    }
    if (type !== 'all') list = list.filter((e) => e.type === type)
    list.sort((a, b) => (sort === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)))
    return list
  }, [events, query, type, sort])

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No timeline available"
        description="Clinical events appear here as reports, treatments and notes are recorded."
        className={className}
      />
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Search the journey" className="min-w-[200px] flex-1">
          {({ id }) => (
            <div className="relative">
              <Icon
                icon={Search}
                size="sm"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
              />
              <Input
                id={id}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Event, report or keyword"
                className="pl-9"
              />
            </div>
          )}
        </Field>

        <Field label="Event type" className="w-44">
          {({ id }) => (
            <Select
              id={id}
              options={typeOptions}
              value={type}
              onChange={(event) => setType(event.target.value as typeof type)}
            />
          )}
        </Field>

        <Field label="Order" className="w-40">
          {({ id }) => (
            <Select
              id={id}
              options={SORT_OPTIONS}
              value={sort}
              onChange={(event) => setSort(event.target.value as typeof sort)}
            />
          )}
        </Field>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching events"
          description="Nothing matched this search. Adjust the search text or event type to see more."
        />
      ) : (
        <ol className="relative space-y-1 pl-1">
          {/* The continuous path itself — and it DRAWS.
              A timeline that is simply present states that events exist. One
              that draws downward states that they happened in an order, which
              is the entire point of this view and the one thing a list cannot
              say. Scales from the top on the GPU, so its cost is the same
              whether there are three events or three hundred. */}
          <span
            aria-hidden
            className={cn(
              'absolute bottom-3 left-[22px] top-3 w-px origin-top bg-[var(--border-default)]',
              'motion-safe:animate-[journey-draw_var(--motion-spatial)_var(--motion-ease-enter)]',
            )}
          />

          {visible.map((event) => {
            const isActive = activeDate === event.date
            const isCompared = compareDate === event.date

            return (
              <li key={event.id} className="relative flex gap-4 py-1.5">
                <span
                  className={cn(
                    'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border',
                    'transition-colors duration-[var(--motion-quick)]',
                    isActive || isCompared
                      ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                      : 'border-[var(--border-default)] bg-[var(--surface-raised)]',
                  )}
                >
                  <Icon
                    icon={TYPE_ICON[event.type]}
                    size="sm"
                    className={isActive || isCompared ? 'text-[var(--accent)]' : 'text-[var(--text-subtle)]'}
                  />
                </span>

                <div className="min-w-0 flex-1 rounded-lg px-3 py-2 transition-colors duration-[var(--motion-quick)] hover:bg-[var(--surface-sunken)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <Text as="span" level="caption" tone="subtle">
                      {formatDate(event.date)}
                    </Text>
                    <StatusIndicator tone="neutral">{TYPE_LABEL[event.type]}</StatusIndicator>
                    {isActive && <StatusIndicator tone="accent">Showing this date</StatusIndicator>}
                    {isCompared && <StatusIndicator tone="info">Comparing</StatusIndicator>}
                  </div>

                  <Text level="secondary" tone="primary" weight="medium" className="mt-1">
                    {event.title}
                  </Text>
                  <Text level="caption" tone="muted" className="mt-0.5">
                    {event.description}
                  </Text>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Control size="sm" intent="quiet" onClick={() => onOpenEvent(event)}>
                      View details
                    </Control>
                    <Control size="sm" intent="quiet" onClick={() => onSelectDate(event.date)}>
                      Show the body at this date
                    </Control>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
