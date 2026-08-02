import { useState } from 'react'
import type { FormEvent } from 'react'
import { Control, Field, Input, Select, Surface, Text, Textarea } from '@/components/primitives'
import { FocusLayer } from '@/components/patterns'
import { useCreateTask } from '@/data/queries'
import type { TaskPriority } from '@/types'

/**
 * Assigning an Action — in Focus above Patient Space [09.8 §5].
 *
 * Only oncologists create tasks [09.8 §19]. The categories are the documented set
 * [09.8 §7], with a custom option, and instructions are written for the patient in
 * plain language [09.8 §9].
 */

const TASK_TEMPLATES = [
  'Upload CT Report',
  'Upload MRI Report',
  'Upload PET Scan Report',
  'Upload Pathology Report',
  'Upload Blood Test',
  'Upload Prescription',
  'Upload Discharge Summary',
  'Update Current Medication',
  'Upload Other Medical Documents',
  'Custom Task',
] as const

const PRIORITIES: readonly { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export interface TaskComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  assignedBy: string
}

export function TaskComposer({ open, onOpenChange, patientId, assignedBy }: TaskComposerProps) {
  const createTask = useCreateTask()

  const [template, setTemplate] = useState<string>(TASK_TEMPLATES[0])
  const [customTitle, setCustomTitle] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [requiresUpload, setRequiresUpload] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isCustom = template === 'Custom Task'
  const title = isCustom ? customTitle : template

  function reset() {
    setTemplate(TASK_TEMPLATES[0])
    setCustomTitle('')
    setDescription('')
    setInstructions('')
    setDueDate('')
    setPriority('medium')
    setRequiresUpload(true)
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim() || !description.trim()) {
      setError('Enter a task and a short description of what the patient should do.')
      return
    }
    setError(null)

    try {
      await createTask.mutateAsync({
        patientId,
        title: title.trim(),
        description: description.trim(),
        instructions:
          instructions.trim() || 'Please complete this when you are able to.',
        assignedDate: new Date().toISOString().slice(0, 10),
        ...(dueDate ? { dueDate } : {}),
        priority,
        assignedBy,
        requiresUpload,
      })
      onOpenChange(false)
      setTimeout(reset, 250)
    } catch {
      setError('The task could not be assigned. Your details have been kept — try again.')
    }
  }

  return (
    <FocusLayer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setTimeout(reset, 250)
      }}
      title="Assign a task"
      description="The patient is notified as soon as this is assigned."
      footer={
        <>
          <Control intent="quiet" onClick={() => onOpenChange(false)}>
            Cancel
          </Control>
          <Control intent="primary" onClick={handleSubmit} disabled={createTask.isPending}>
            {createTask.isPending ? 'Assigning…' : 'Assign task'}
          </Control>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <Field label="Task" required>
          {({ id }) => (
            <Select
              id={id}
              options={TASK_TEMPLATES.map((t) => ({ value: t, label: t }))}
              value={template}
              onChange={(event) => setTemplate(event.target.value)}
            />
          )}
        </Field>

        {isCustom && (
          <Field label="Task title" required>
            {({ id }) => (
              <Input
                id={id}
                value={customTitle}
                onChange={(event) => setCustomTitle(event.target.value)}
                placeholder="What are you asking for?"
              />
            )}
          </Field>
        )}

        <Field
          label="Short description"
          description="Shown to the patient first. Keep it plain and specific."
          required
        >
          {({ id, describedBy }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="e.g. Please upload your PET-CT once it is done."
            />
          )}
        </Field>

        <Field
          label="Instructions"
          description="Any extra detail that will help the patient complete this."
        >
          {({ id, describedBy }) => (
            <Textarea
              id={id}
              aria-describedby={describedBy}
              rows={3}
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Due date">
            {({ id }) => (
              <Input
                id={id}
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            )}
          </Field>
          <Field label="Priority">
            {({ id }) => (
              <Select
                id={id}
                options={PRIORITIES}
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
              />
            )}
          </Field>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            checked={requiresUpload}
            onChange={(event) => setRequiresUpload(event.target.checked)}
            className="size-5 rounded border-[var(--border-strong)] accent-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          />
          <Text as="span" level="secondary" tone="body">
            This task requires the patient to upload a document
          </Text>
        </label>

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
