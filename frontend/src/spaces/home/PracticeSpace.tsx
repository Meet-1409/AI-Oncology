import { Users } from 'lucide-react'
import { Icon, Surface, Text } from '@/components/primitives'
import { ErrorState, LoadingSurface } from '@/components/patterns'
import { Reveal } from '@/components/motion'
import { DemoBodyPreview } from '@/features/body'
import { usePatients, useSession } from '@/data/queries'

/**
 * Practice Space — the oncologist's arrival point, Depth 1.
 *
 * No demo roster ships with this product — patients appear here only once
 * they exist for real [00 §5.8]. Until then this space is honest about
 * having nothing yet, and uses the moment to show what the Digital Twin
 * looks like once a patient's record is open.
 */

export default function PracticeSpace() {
  const session = useSession()
  const { data, isLoading, isError, refetch } = usePatients()

  const patients = data?.items ?? []
  const doctorName = session.data?.user.name ?? ''

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

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Reveal>
        <Text as="h1" level="title" tone="primary">
          {doctorName ? `Good to see you, ${doctorName}` : 'Your practice'}
        </Text>
        <Text level="secondary" tone="body" className="mt-2 max-w-xl">
          {patients.length > 0
            ? `${patients.length} patient${patients.length === 1 ? '' : 's'} under your care.`
            : 'Everyone under your care will appear here, with whatever needs attention shown first.'}
        </Text>
      </Reveal>

      {patients.length === 0 ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-stretch">
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
      ) : (
        <section className="mt-8">
          <Text as="h2" level="micro" tone="subtle">
            Your patients
          </Text>
          <ul className="mt-2 divide-y divide-[var(--border-subtle)]">
            {patients.map((patient, index) => (
              <Reveal key={patient.id} index={index}>
                <li className="py-3.5">
                  <Text level="secondary" tone="primary" weight="medium">
                    {patient.name}
                  </Text>
                  <Text level="caption" tone="muted">
                    {patient.patientCode}
                  </Text>
                </li>
              </Reveal>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
