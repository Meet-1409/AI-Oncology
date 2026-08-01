import { useState } from 'react'
import type { FormEvent } from 'react'
import { Eye, Lock } from 'lucide-react'
import { Control, Field, Icon, Input, Surface, Text, Textarea } from '@/components/primitives'
import { FocusLayer } from '@/components/patterns'
import { useCreateNote } from '@/data/queries'
import { cn } from '@/lib/utils'
import type { NoteType } from '@/types'

/**
 * Writing a note — in Focus above Patient Space [09.9 §5].
 *
 * Before saving, it must be UNMISTAKABLE whether the note will be visible to the
 * patient [09.9 §10] or is private [09.9 §11]. That is why the choice is a pair of
 * explicit, described options rather than a subtle toggle, and why the confirming
 * statement above the save control restates the consequence in plain words.
 *
 * A failed save never loses the written text [09.9 §20].
 */

export interface NoteComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  authorName: string
}

export function NoteComposer({
  open,
  onOpenChange,
  patientId,
  authorName,
}: NoteComposerProps) {
  const createNote = useCreateNote()

  const [type, setType] = useState<NoteType>('patient')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isPrivate = type === 'private'

  function reset() {
    setType('patient')
    setTitle('')
    setMessage('')
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !message.trim()) {
      setError('Enter a title and the note text before saving.')
      return
    }
    setError(null)

    try {
      await createNote.mutateAsync({
        patientId,
        type,
        title: title.trim(),
        message: message.trim(),
        createdBy: authorName,
      })
      onOpenChange(false)
      setTimeout(reset, 250)
    } catch {
      // The written text is deliberately retained [09.9 §20].
      setError('The note could not be saved. Your text has been kept — try again.')
    }
  }

  return (
    <FocusLayer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setTimeout(reset, 250)
      }}
      title="Write a note"
      footer={
        <>
          <Control intent="quiet" onClick={() => onOpenChange(false)}>
            Cancel
          </Control>
          <Control intent="primary" onClick={handleSubmit} disabled={createNote.isPending}>
            {createNote.isPending ? 'Saving…' : isPrivate ? 'Save private note' : 'Save and share'}
          </Control>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <fieldset>
          <legend className="mb-2">
            <Text as="span" level="secondary" tone="primary" weight="medium">
              Who is this note for?
            </Text>
          </legend>

          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                {
                  value: 'patient' as const,
                  icon: Eye,
                  title: 'Shared with the patient',
                  detail: 'The patient will be notified and can read this.',
                },
                {
                  value: 'private' as const,
                  icon: Lock,
                  title: 'Private observation',
                  detail: 'Only you can see this. The patient never will.',
                },
              ] satisfies readonly {
                value: NoteType
                icon: typeof Eye
                title: string
                detail: string
              }[]
            ).map((option) => {
              const active = type === option.value
              return (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors duration-[var(--motion-quick)]',
                    'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--focus-ring)]',
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
                      : 'border-[var(--border-default)] hover:bg-[var(--surface-sunken)]',
                  )}
                >
                  <input
                    type="radio"
                    name="note-visibility"
                    value={option.value}
                    checked={active}
                    onChange={() => setType(option.value)}
                    className="sr-only"
                  />
                  <Icon
                    icon={option.icon}
                    size="sm"
                    className={cn('mt-0.5 shrink-0', active ? 'text-[var(--accent)]' : 'text-[var(--text-subtle)]')}
                  />
                  <span>
                    <Text as="span" level="secondary" tone="primary" weight="medium">
                      {option.title}
                    </Text>
                    <Text level="caption" tone="muted" className="mt-0.5">
                      {option.detail}
                    </Text>
                  </span>
                </label>
              )
            })}
          </div>
        </fieldset>

        <Field label="Title" required>
          {({ id }) => (
            <Input
              id={id}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={isPrivate ? 'e.g. Reassess systemic therapy' : 'e.g. Managing side effects'}
            />
          )}
        </Field>

        <Field
          label={isPrivate ? 'Clinical observation' : 'Message'}
          description={
            isPrivate
              ? 'Clinical observations, follow-up planning and reminders.'
              : 'Write in simple, plain language the patient will understand.'
          }
          required
        >
          {({ id, describedBy }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              rows={6}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
            />
          )}
        </Field>

        {/* The consequence restated immediately above the save control. */}
        <Surface
          elevation="sunken"
          radius="md"
          inset="sm"
          className={cn(
            'flex items-start gap-2.5',
            isPrivate ? 'bg-[var(--surface-inverse)]' : 'bg-[var(--status-success-surface)]',
          )}
        >
          <Icon
            icon={isPrivate ? Lock : Eye}
            size="sm"
            className={cn('mt-0.5 shrink-0', isPrivate ? 'text-white/70' : 'text-[var(--status-success-text)]')}
          />
          <Text
            level="caption"
            className={isPrivate ? 'text-white/85' : 'text-[var(--status-success-text)]'}
          >
            {isPrivate
              ? 'This note is private. It will not be shown to the patient at any point.'
              : 'This note will be visible to the patient, and they will be notified.'}
          </Text>
        </Surface>

        {error && (
          <Surface
            elevation="sunken"
            radius="md"
            inset="sm"
            role="alert"
            className="bg-[var(--status-danger-surface)]"
          >
            <Text level="caption" tone="danger">
              {error}
            </Text>
          </Surface>
        )}
      </form>
    </FocusLayer>
  )
}
