import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search, Users } from 'lucide-react'
import { Icon, StatusIndicator, Surface, Text } from '@/components/primitives'
import { ErrorState, LoadingSurface } from '@/components/patterns'
import { Reveal } from '@/components/motion'
import { DemoBodyPreview } from '@/features/body'
import { usePatients, useSession } from '@/data/queries'
import { paths } from '@/routes/paths'
import { calculateAge } from '@/lib/format'
import type { PatientRecord } from '@/types'

/**
 * Practice Space — the oncologist's arrival point, Depth 1.
 *
 * No demo roster ships with this product — patients appear here only once
 * they exist for real [00 §5.8]. Until then this space is honest about
 * having nothing yet, and uses the moment to show what the Digital Twin
 * looks like once a patient's record is open.
 *
 * The two states are the SAME layout, not two different screens: patients on
 * the left, the Body on the right. An empty practice that rearranges itself
 * the moment a first patient arrives would teach the oncologist a layout they
 * immediately have to unlearn.
 */

/** Only what the record actually states — never a severity we inferred. */
function summarise(patient: PatientRecord): string {
  const parts = [
    patient.primaryCancer,
    patient.stage,
    patient.dob ? `${calculateAge(patient.dob)} yrs` : '',
  ].filter((part) => part.trim().length > 0)
  return parts.length > 0 ? parts.join(' · ') : 'Nothing recorded yet'
}

function PatientRow({ patient, index }: { patient: PatientRecord; index: number }) {
  return (
    <Reveal index={index}>
      <Link to={paths.patient(patient.id)} className="block no-underline">
        <Surface
          elevation="raised"
          radius="lg"
          border="subtle"
          inset="md"
          interactive
          className="flex items-center gap-4"
        >
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold text-white"
            style={{ backgroundColor: patient.avatarColor }}
          >
            {patient.name.slice(0, 1).toUpperCase()}
          </span>

          <span className="min-w-0 flex-1">
            <Text
              as="span"
              level="secondary"
              tone="primary"
              weight="medium"
              className="block truncate"
            >
              {patient.name}
            </Text>
            <Text as="span" level="caption" tone="muted" className="block truncate">
              {patient.patientCode} · {summarise(patient)}
            </Text>
          </span>

          {patient.treatmentStatus && (
            <StatusIndicator tone="neutral" className="hidden shrink-0 sm:inline-flex">
              {patient.treatmentStatus.replace(/-/g, ' ')}
            </StatusIndicator>
          )}

          <Icon icon={ChevronRight} size="sm" className="shrink-0 text-[var(--text-subtle)]" />
        </Surface>
      </Link>
    </Reveal>
  )
}

export default function PracticeSpace() {
  const session = useSession()
  const { data, isLoading, isError, refetch } = usePatients()
  const [query, setQuery] = useState('')

  const patients = useMemo(() => data?.items ?? [], [data])
  const doctorName = session.data?.user.name ?? ''

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return patients
    return patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(q) ||
        patient.patientCode.toLowerCase().includes(q) ||
        patient.primaryCancer.toLowerCase().includes(q),
    )
  }, [patients, query])

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <LoadingSurface lines={4} label="Loading your practice" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
        <ErrorState
          title="Your practice could not be loaded"
          description="Check your connection and try again."
          onRetry={() => void refetch()}
        />
      </div>
    )
  }

  const hasPatients = patients.length > 0

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Reveal>
        <Text as="h1" level="title" tone="primary">
          {doctorName ? `Good to see you, ${doctorName}` : 'Your practice'}
        </Text>
        <Text level="secondary" tone="body" className="mt-2 max-w-xl">
          {hasPatients
            ? `${patients.length} patient${patients.length === 1 ? '' : 's'} under your care.`
            : 'Everyone under your care will appear here, with whatever needs attention shown first.'}
        </Text>
      </Reveal>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-start">
        {hasPatients ? (
          // min-w-0: a grid child defaults to min-width:auto, so a long patient
          // name or diagnosis pushes the column wider than its track instead of
          // truncating, and the whole page scrolls sideways on a phone.
          <div className="flex min-w-0 flex-col gap-4">
            {/* Search sits above the list it filters, not somewhere else on the
                page — the control and the thing it changes stay together. */}
            <label className="relative block">
              <span className="sr-only">Search your patients</span>
              <Icon
                icon={Search}
                size="sm"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, ID or diagnosis"
                className={[
                  'w-full rounded-lg border bg-[var(--surface-raised)] py-2.5 pl-9 pr-3',
                  'text-body text-[var(--text-body-color)] border-[var(--border-default)]',
                  'placeholder:text-[var(--text-subtle)]',
                  'transition-[border-color,box-shadow] duration-[var(--motion-quick)]',
                  'focus-visible:outline-none focus-visible:border-[var(--focus-ring)]',
                  'focus-visible:ring-2 focus-visible:ring-[var(--accent-subtle)]',
                ].join(' ')}
              />
            </label>

            {visible.length === 0 ? (
              <Surface elevation="raised" radius="lg" border="subtle" inset="lg">
                <Text level="secondary" tone="muted">
                  No patient matches “{query.trim()}”.
                </Text>
              </Surface>
            ) : (
              <ul className="flex flex-col gap-2">
                {visible.map((patient, index) => (
                  <li key={patient.id}>
                    <PatientRow patient={patient} index={index} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <Reveal index={0}>
            <Surface
              elevation="raised"
              radius="2xl"
              border="subtle"
              inset="xl"
              className="flex h-full flex-col justify-center gap-4"
            >
              <span className="flex size-12 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)]">
                <Icon icon={Users} size="md" />
              </span>
              <div>
                <Text as="h2" level="heading" tone="primary">
                  No patients yet
                </Text>
                <Text level="secondary" tone="muted" className="mt-2 max-w-[42ch]">
                  This is a real, empty practice — nothing here is invented. As
                  soon as a patient is under your care, they'll appear in this
                  space with whatever needs your attention shown first.
                </Text>
              </div>
            </Surface>
          </Reveal>
        )}

        <Reveal index={1}>
          <Surface
            elevation="raised"
            radius="2xl"
            border="subtle"
            className="flex h-full flex-col overflow-hidden"
          >
            <div className="px-6 pt-6 sm:px-8 sm:pt-8">
              <Text as="h2" level="heading" tone="primary">
                The Digital Twin
              </Text>
              <Text level="secondary" tone="muted" className="mt-1.5">
                A live, healthy demonstration model — drag to turn it.
              </Text>
            </div>
            <div className="relative mt-4 min-h-[320px] flex-1 overflow-hidden bg-[var(--body-volume)]">
              <DemoBodyPreview className="h-full w-full" />
            </div>
          </Surface>
        </Reveal>
      </div>
    </div>
  )
}
