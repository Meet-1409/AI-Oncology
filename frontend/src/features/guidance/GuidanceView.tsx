import { useMemo, useState } from 'react'
import { Lock, Plus, Search, StickyNote } from 'lucide-react'
import { Control, Field, Icon, Input, Select, Surface, Text } from '@/components/primitives'
import { EmptyState, NoteVisibilityIndicator } from '@/components/patterns'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Note, NoteType } from '@/types'

/**
 * Guidance (Notes).
 *
 * Shared Guidance is written for the patient; Private Observations are for the
 * oncologist alone [09.9 §4].
 *
 * The two are always visually AND structurally distinct, so a private observation
 * can never be mistaken for something the patient can read [09.9 §5]. Private notes
 * carry a lock, an inverse surface and an explicit text label — the distinction
 * never rests on color [09.9 §22].
 */

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Title' },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]['value']

export interface GuidanceViewProps {
  notes: readonly Note[]
  /** Oncologists see both kinds; patients only ever receive shared notes. */
  canFilterType: boolean
  /** Only oncologists create notes [09.9 §18]. */
  onCreateNote?: (() => void) | undefined
  className?: string
}

export function GuidanceView({
  notes,
  canFilterType,
  onCreateNote,
  className,
}: GuidanceViewProps) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'all' | NoteType>('all')
  const [sort, setSort] = useState<SortKey>('newest')

  const visible = useMemo(() => {
    let list = [...notes]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (note) =>
          note.title.toLowerCase().includes(q) ||
          note.message.toLowerCase().includes(q) ||
          note.createdBy.toLowerCase().includes(q),
      )
    }
    if (canFilterType && type !== 'all') list = list.filter((note) => note.type === type)

    list.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return b.createdDate.localeCompare(a.createdDate)
        case 'oldest':
          return a.createdDate.localeCompare(b.createdDate)
        case 'title':
          return a.title.localeCompare(b.title)
      }
    })
    return list
  }, [notes, query, type, sort, canFilterType])

  if (notes.length === 0) {
    return (
      <EmptyState
        icon={StickyNote}
        title="No notes yet"
        description={
          onCreateNote
            ? 'Notes you write for this patient, and your private observations, appear here.'
            : 'Notes from your oncologist will appear here.'
        }
        action={
          onCreateNote && (
            <Control intent="primary" size="sm" onClick={onCreateNote}>
              <Icon icon={Plus} size="xs" />
              Write a note
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
        <Field label="Search notes" className="min-w-[200px] flex-1">
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
                placeholder="Title, keyword or author"
                className="pl-9"
              />
            </div>
          )}
        </Field>

        {canFilterType && (
          <Field label="Kind" className="w-52">
            {({ id }) => (
              <Select
                id={id}
                options={[
                  { value: 'all', label: 'All notes' },
                  { value: 'patient', label: 'Shared with the patient' },
                  { value: 'private', label: 'Private observations' },
                ]}
                value={type}
                onChange={(event) => setType(event.target.value as typeof type)}
              />
            )}
          </Field>
        )}

        <Field label="Order" className="w-40">
          {({ id }) => (
            <Select
              id={id}
              options={SORT_OPTIONS}
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
            />
          )}
        </Field>

        {onCreateNote && (
          <Control intent="primary" onClick={onCreateNote}>
            <Icon icon={Plus} size="sm" />
            Write a note
          </Control>
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching notes"
          description="Nothing matched this search. Try a different term."
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((note) => {
            const isPrivate = note.type === 'private'
            return (
              <li key={note.id}>
                <Surface
                  elevation="raised"
                  radius="lg"
                  inset="md"
                  className={cn(
                    'border',
                    isPrivate
                      ? 'border-[var(--border-strong)] bg-[var(--surface-inverse)]'
                      : 'border-[var(--border-subtle)]',
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span className="flex items-center gap-2">
                      {isPrivate && (
                        <Icon icon={Lock} size="xs" className="text-white/70" />
                      )}
                      <Text
                        as="h3"
                        level="subheading"
                        tone={isPrivate ? 'onInverse' : 'primary'}
                      >
                        {note.title}
                      </Text>
                    </span>
                    <NoteVisibilityIndicator type={note.type} />
                  </div>

                  <Text
                    level="secondary"
                    measure="comfortable"
                    className={cn('mt-2.5', isPrivate ? 'text-white/80' : 'text-[var(--text-body-color)]')}
                  >
                    {note.message}
                  </Text>

                  <Text
                    level="caption"
                    className={cn('mt-3', isPrivate ? 'text-white/50' : 'text-[var(--text-subtle)]')}
                  >
                    {note.createdBy} · {formatDate(note.createdDate)}
                    {note.updatedDate && ` · updated ${formatDate(note.updatedDate)}`}
                  </Text>
                </Surface>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
