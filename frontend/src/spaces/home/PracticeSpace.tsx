import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Icon, Text } from '@/components/primitives'
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
 * THE BODY IS THE SCREEN. It is not a card in the right-hand column; it
 * stands in the room, full height, lit by the same source as everything else,
 * with no border and no panel behind it. The roster is set beside it as a
 * quiet index — names are how you reach a patient, but the body is what this
 * product is.
 *
 * No demo roster ships with this product — patients appear here only once
 * they exist for real [00 §5.8]. Both the empty and the populated state use
 * this same staging, so a practice that gains its first patient does not have
 * to be re-learned.
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

/**
 * A row, not a card.
 *
 * Deliberately has no avatar colour. Colour in this product means disease;
 * a cheerful identity swatch beside a cancer patient's name is both noise and
 * — next to the severity scale — a genuine misread waiting to happen. The
 * rule is what gives the interface its silence.
 */
function PatientRow({ patient, index }: { patient: PatientRecord; index: number }) {
  return (
    <Reveal index={index}>
      <Link
        to={paths.patient(patient.id)}
        className={[
          'group relative flex items-baseline gap-4 border-b border-[var(--border-subtle)]',
          'py-4 no-underline transition-colors duration-[var(--motion-quick)]',
          'hover:border-[var(--border-strong)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
        ].join(' ')}
      >
        {/* The hairline that draws itself under the row on approach. The only
            hover affordance — a row that lifts or fills would reintroduce the
            card this layout exists to remove. */}
        <span
          aria-hidden
          className={[
            'pointer-events-none absolute inset-x-0 bottom-[-1px] h-px origin-left scale-x-0',
            'bg-[var(--text-primary)] transition-transform duration-[var(--motion-reveal)]',
            'ease-[var(--motion-ease-enter)] group-hover:scale-x-100',
          ].join(' ')}
        />
        <span className="min-w-0 flex-1">
          <Text as="span" level="heading" tone="primary" className="block truncate font-display">
            {patient.name}
          </Text>
          <Text as="span" level="caption" tone="muted" className="mt-0.5 block truncate">
            {summarise(patient)}
          </Text>
        </span>
        <Text as="span" level="micro" tone="subtle" className="shrink-0 uppercase">
          {patient.patientCode}
        </Text>
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
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
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
    <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6">
      {/* THE FIGURE.
          Absolutely placed and full height on desktop so it occupies the room
          rather than a box, and sits BEHIND the index — the names read over
          the body, the way the reference sites let their object cut through
          their type. Pointer events stay on, so it is still turnable. */}
      <div
        className={[
          'pointer-events-none absolute inset-y-0 right-0 hidden w-[54%] lg:block',
          'lg:[mask-image:linear-gradient(to_right,transparent,black_18%)]',
        ].join(' ')}
      >
        <DemoBodyPreview className="pointer-events-auto h-full w-full" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col py-12 sm:py-16 lg:max-w-[46%]">
        <Reveal>
          <Text as="p" level="micro" tone="subtle" className="uppercase">
            {hasPatients
              ? `${patients.length} under your care`
              : 'No patients yet'}
          </Text>
          <Text as="h1" level="display" tone="primary" className="mt-3 font-display">
            {doctorName ? doctorName : 'Your practice'}
          </Text>
        </Reveal>

        {hasPatients ? (
          <div className="mt-10 flex min-w-0 flex-col">
            {/* An underline, not a box. */}
            <label className="relative block border-b border-[var(--border-default)] pb-2">
              <span className="sr-only">Search your patients</span>
              <Icon
                icon={Search}
                size="sm"
                className="pointer-events-none absolute left-0 top-1 text-[var(--text-subtle)]"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, ID or diagnosis"
                className={[
                  'w-full bg-transparent pl-7 text-body text-[var(--text-body-color)]',
                  'placeholder:text-[var(--text-subtle)] focus-visible:outline-none',
                ].join(' ')}
              />
            </label>

            {visible.length === 0 ? (
              <Text level="secondary" tone="muted" className="mt-6">
                No patient matches “{query.trim()}”.
              </Text>
            ) : (
              // Re-keyed on the query so the narrowed list re-enters rather
              // than snapping. Filtering is the one moment this screen has
              // motion to spare, and a list that reassembles makes the search
              // feel like it did something.
              <ul key={query.trim()} className="mt-2 flex flex-col">
                {visible.map((patient, index) => (
                  <li key={patient.id}>
                    <PatientRow patient={patient} index={index} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <Reveal index={1}>
            <Text level="body" tone="muted" className="mt-8 max-w-[44ch]">
              This is a real, empty practice — nothing here is invented. As soon
              as a patient is under your care, they will appear here, with
              whatever needs your attention shown first.
            </Text>
            <Text level="caption" tone="subtle" className="mt-10 max-w-[44ch]">
              Beside you is a healthy demonstration model. Nothing on it is a
              patient record. Drag to turn it.
            </Text>
          </Reveal>
        )}
      </div>

      {/* Below lg the figure cannot share the frame with the index, so it takes
          its own band underneath rather than being dropped — on a tablet at a
          bedside it is still the point of the screen. */}
      <div className="relative mt-2 h-[46svh] w-full lg:hidden">
        <DemoBodyPreview className="h-full w-full" />
      </div>
    </div>
  )
}
