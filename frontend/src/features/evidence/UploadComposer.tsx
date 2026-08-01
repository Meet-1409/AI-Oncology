import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CheckCircle2, UploadCloud } from 'lucide-react'
import { Control, Field, Icon, Input, Select, Surface, Text } from '@/components/primitives'
import { FocusLayer } from '@/components/patterns'
import { useUploadReport } from '@/data/queries'
import type { ReportType } from '@/types'

/**
 * Upload — in place, in Focus above the current space [09.4 §6].
 *
 * The patient never leaves their space to upload. Progress is reported, and a
 * failure keeps the chosen file and entered details so retry costs nothing and the
 * user's position is never lost [09.8 §21].
 */

const REPORT_TYPES: readonly ReportType[] = [
  'Pathology',
  'CT Scan',
  'MRI',
  'PET Scan',
  'Blood Test',
  'Biopsy',
  'Histopathology',
  'Surgery Report',
  'Discharge Summary',
  'Prescription',
  'Follow-up Report',
  'Other',
]

const ACCEPTED = '.pdf,.jpg,.jpeg,.png'
const MAX_BYTES = 25 * 1024 * 1024

export interface UploadComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: string
  /** Present when uploading to satisfy a specific task [09.8 §12]. */
  taskId?: string | undefined
  defaultName?: string | undefined
}

export function UploadComposer({
  open,
  onOpenChange,
  patientId,
  taskId,
  defaultName,
}: UploadComposerProps) {
  const upload = useUploadReport()
  const fileInput = useRef<HTMLInputElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState(defaultName ?? '')
  const [type, setType] = useState<ReportType>('Other')
  const [hospital, setHospital] = useState('')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  function reset() {
    setFile(null)
    setName(defaultName ?? '')
    setType('Other')
    setHospital('')
    setProgress(0)
    setError(null)
    setDone(false)
  }

  function pickFile(selected: File | undefined) {
    if (!selected) return
    if (selected.size > MAX_BYTES) {
      setError('That file is larger than 25MB. Choose a smaller file, or split the document.')
      return
    }
    if (!/\.(pdf|jpe?g|png)$/i.test(selected.name)) {
      setError('That file type is not supported. Upload a PDF, JPG or PNG.')
      return
    }
    setError(null)
    setFile(selected)
    if (!name) setName(selected.name.replace(/\.[^.]+$/, ''))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!file) {
      setError('Choose a file to upload.')
      return
    }
    if (!name.trim() || !hospital.trim()) {
      setError('Enter a report name and the hospital or laboratory it came from.')
      return
    }

    setError(null)
    try {
      await upload.mutateAsync({
        patientId,
        file,
        name: name.trim(),
        type,
        hospital: hospital.trim(),
        ...(taskId ? { taskId } : {}),
        onProgress: setProgress,
      })
      setDone(true)
    } catch {
      // The file and details are deliberately preserved so retry is one click.
      setError('The upload did not complete. Your file and details have been kept — try again.')
      setProgress(0)
    }
  }

  return (
    <FocusLayer
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setTimeout(reset, 250)
      }}
      title={done ? 'Upload complete' : 'Upload a report'}
      description={
        done
          ? undefined
          : 'PDF, JPG or PNG. The original document is preserved exactly as issued.'
      }
      footer={
        done ? (
          <Control intent="primary" onClick={() => onOpenChange(false)}>
            Done
          </Control>
        ) : (
          <>
            <Control intent="quiet" onClick={() => onOpenChange(false)}>
              Cancel
            </Control>
            <Control
              intent="primary"
              onClick={handleSubmit}
              disabled={upload.isPending}
            >
              {upload.isPending ? `Uploading ${Math.round(progress * 100)}%` : 'Upload report'}
            </Control>
          </>
        )
      }
    >
      {done ? (
        <div className="py-4 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-[var(--status-success-surface)]">
            <Icon icon={CheckCircle2} size="md" className="text-[var(--status-success-text)]" />
          </span>
          <Text level="body" tone="body" className="mt-4">
            {name} has been uploaded and added to the timeline. Analysis is in progress and
            findings will appear shortly.
          </Text>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                pickFile(event.dataTransfer.files[0])
              }}
              className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-[var(--border-default)] bg-[var(--surface-sunken)] px-4 py-8 transition-colors duration-[var(--motion-quick)] hover:border-[var(--accent-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              <Icon icon={UploadCloud} size="lg" className="text-[var(--text-subtle)]" />
              <Text level="secondary" tone={file ? 'primary' : 'muted'}>
                {file ? file.name : 'Drag a file here, or choose one'}
              </Text>
              <Text level="caption" tone="subtle">
                PDF, JPG or PNG, up to 25MB
              </Text>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPTED}
              className="sr-only"
              onChange={(event) => pickFile(event.target.files?.[0])}
            />
          </div>

          {upload.isPending && (
            <div>
              <span
                className="block h-1.5 overflow-hidden rounded-full bg-[var(--surface-sunken)]"
                role="progressbar"
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Upload progress"
              >
                <span
                  className="block h-full rounded-full bg-[var(--accent)] transition-[width] duration-[var(--motion-quick)]"
                  style={{ width: `${progress * 100}%` }}
                />
              </span>
            </div>
          )}

          <Field label="Report name" required>
            {({ id }) => (
              <Input
                id={id}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Follow-up CT Chest"
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Report type" required>
              {({ id }) => (
                <Select
                  id={id}
                  options={REPORT_TYPES.map((t) => ({ value: t, label: t }))}
                  value={type}
                  onChange={(event) => setType(event.target.value as ReportType)}
                />
              )}
            </Field>
            <Field label="Hospital or laboratory" required>
              {({ id }) => (
                <Input
                  id={id}
                  value={hospital}
                  onChange={(event) => setHospital(event.target.value)}
                  placeholder="Where it was issued"
                />
              )}
            </Field>
          </div>

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
      )}
    </FocusLayer>
  )
}
