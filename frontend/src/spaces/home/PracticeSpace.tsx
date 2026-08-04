import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search, Users } from 'lucide-react'
import { Field, Icon, Input, StatusIndicator, Surface, Text } from '@/components/primitives'
import { EmptyState, ErrorState, LoadingSurface } from '@/components/patterns'
import { Reveal } from '@/components/motion'
import { DemoBodyPreview } from '@/features/body'
import { usePatients, useSession } from '@/data/queries'
import { paths } from '@/routes/paths'
import { sharedNames } from '@/shell'
import { cn } from '@/lib/utils'
import type { PatientRecord, TreatmentStatus } from '@/types'

/**
 * Practice Space — the oncologist's arrival point, Depth 1.
 *
 * A calm surface answering one question: which patient needs this oncologist next
 * [09.2 §1]. Patients are presented as recognisable presences carrying enough
 * clinical context to be identified without opening them [09.2 §5] — not as rows
 * in an administrative table.
 */

const TREATMENT_STATUS: Record<TreatmentStatus, { label: string; tone: 'info' | 'success' | 'neutral' | 'warning' | 'danger' }> = {
  'active-treatment': { label: 'Active treatment', tone: 'info' },
  'in-remission': { label: 'In remission', tone: 'success' },
  'follow-up': { label: 'Follow-up', tone: 'neutral' },
  'newly-diagnosed': { label: 'Newly diagnosed', tone: 'warning' },
  'palliative-care': { label: 'Palliative care', tone: 'danger' },
}

function PatientPresence({ patient, index }: { patient: PatientRecord; index: number }) {
  const status = TREATMENT_STATUS[patient.treatmentStatus]

  return (
    <Reveal index={index}>
      <Link
        to={paths.patient(patient.id)}
        // The presence transforms into the space it becomes [04 §6].
        style={{ viewTransitionName: sharedNames.patient(patient.id) }}
        className={cn(
          'group flex items-center gap-4 rounded-lg px-3 py-3.5',
          // A presence that can be opened lifts to meet the pointer rather than
          // only tinting — real depth feedback for the row this whole space
          // exists to make easy to reach [09.2 §1].
          'transition-[transform,background-color,box-shadow] duration-[var(--motion-quick)]',
          'ease-[var(--motion-ease-standard)]',
          'hover:-translate-y-0.5 hover:bg-[var(--surface-raised)] hover:shadow-lifted',
          'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
        )}
      >
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-caption font-semibold text-white"
          style={{ background: patient.avatarColor }}
        >
          {patient.name
            .split(' ')
            .slice(0, 2)
            .map((part) => part[0])
            .join('')}
        </span>

        <span className="min-w-0 flex-1">
          <Text as="span" level="secondary" tone="primary" weight="medium" truncate>
            {patient.name}
          </Text>
          <Text level="caption" tone="muted" truncate>
            {patient.patientCode} · {patient.primaryCancer} · {patient.stage}
          </Text>
        </span>

        <StatusIndicator tone={status.tone}>{status.label}</StatusIndicator>
        <Icon
          icon={ChevronRight}
          size="sm"
          className="shrink-0 text-[var(--text-subtle)] transition-transform duration-[var(--motion-quick)] group-hover:translate-x-0.5"
        />
      </Link>
    </Reveal>
  )
}

export default function PracticeSpace() {
  const session = useSession()
  const { data, isLoading, isError, refetch } = usePatients()
  const [query, setQuery] = useState('')

  const patients = data?.items ?? []

  const visible = useMemo(() => {
    if (!query.trim()) return patients
    const q = query.toLowerCase()
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(q) ||
        patient.patientCode.toLowerCase().includes(q) ||
        (patient.mobile ?? '').includes(q),
    )
  }, [patients, query])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <LoadingSurface lines={4} label="Loading your patients" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState
          title="Your patients could not be loaded"
          description="Check your connection and try again."
          onRetry={() => void refetch()}
        />
      </div>
    )
  }

  const doctorName = session.data?.user.name ?? ''

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header>
        <Text as="h1" level="title" tone="primary">
          {doctorName ? `Good to see you, ${doctorName.replace(/^Dr\.\s*/, '')}` : 'Your practice'}
        </Text>
        <Text level="secondary" tone="muted" className="mt-1">
          {today} · {patients.length} patient{patients.length === 1 ? '' : 's'} under your care
        </Text>
        {/* What this space is for, stated rather than inferred [04 §28]. */}
        <Text level="secondary" tone="body" className="mt-3 max-w-xl">
          Everyone under your care, with whatever needs attention shown first.
          Open a patient to see their full record.
        </Text>
      </header>

      {/* Patients on the left; finding one and the Digital Twin on the right
          [09.2 §1] — the search narrows the list beside it rather than a
          second, disconnected filter. Stacks on narrow viewports, list
          first, since the list is what the space exists to answer. */}
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <section>
          <Text as="h2" level="micro" tone="subtle">
            Your patients
          </Text>

          {visible.length === 0 ? (
            <EmptyState
              icon={patients.length === 0 ? Users : Search}
              title={patients.length === 0 ? 'No assigned patients' : 'No matching patients'}
              description={
                patients.length === 0
                  ? 'Patients assigned to you will appear here.'
                  : 'Nothing matched that search. Try a name, patient ID or mobile number.'
              }
              className="mt-3"
            />
          ) : (
            <ul className="mt-2 divide-y divide-[var(--border-subtle)]">
              {visible.map((patient, index) => (
                <li key={patient.id}>
                  <PatientPresence patient={patient} index={index} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="lg:sticky lg:top-6">
          <Surface elevation="raised" radius="xl" border="subtle" inset="lg" className="space-y-5">
            <Field label="Find a patient">
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
                    placeholder="Name, patient ID or mobile number"
                    className="pl-9"
                  />
                </div>
              )}
            </Field>

            <div>
              <Text level="micro" tone="subtle" className="mb-2">
                Digital Twin
              </Text>
              {/* Decorative only — every organ here is healthy by
                  construction, never a real patient's data [00 §5.8]. */}
              <div className="relative h-64 overflow-hidden rounded-lg bg-[var(--body-volume)]">
                <DemoBodyPreview className="h-full w-full" />
              </div>
              <Text level="caption" tone="muted" className="mt-2">
                A demo view — drag to turn it. Open a patient to see their own.
              </Text>
            </div>
          </Surface>
        </aside>
      </div>
    </div>
  )
}
