import { Surface, Text } from '@/components/primitives'
import { StatusIndicator } from '@/components/primitives'
import { Reveal } from '@/components/motion'
import { calculateAge, formatDate } from '@/lib/format'
import type { PatientRecord } from '@/types'

/**
 * Patient information [09.3 §6-9].
 *
 * Presented as continuous, readable clinical context rather than a grid of boxes
 * [04 §10]. Grouping comes from space and typography.
 */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[var(--border-subtle)] py-2 last:border-0">
      <dt className="shrink-0">
        <Text as="span" level="caption" tone="muted">
          {label}
        </Text>
      </dt>
      <dd className="min-w-0 text-right">
        <Text as="span" level="secondary" tone="body">
          {value}
        </Text>
      </dd>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <Text as="h3" level="subheading" tone="primary">
        {title}
      </Text>
      <dl className="mt-3">{children}</dl>
    </section>
  )
}

function listOrNone(values: readonly string[]): string {
  return values.length > 0 ? values.join(', ') : 'None recorded'
}

/** A freshly signed-in patient has real fields with nothing in them yet — an
 * honest "not yet recorded" beats a blank cell or a NaN computed from it. */
function orNotRecorded(value: string): string {
  return value.trim() ? value : 'Not yet recorded'
}

export function PatientOverview({ patient }: { patient: PatientRecord }) {
  const hasBodyMetrics = patient.heightCm > 0 && patient.weightKg > 0
  const bmi = hasBodyMetrics
    ? (patient.weightKg / (patient.heightCm / 100) ** 2).toFixed(1)
    : 'Not yet recorded'

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Reveal index={0}>
        <Surface elevation="raised" radius="lg" border="subtle" inset="md" className="space-y-6">
          <Group title="Patient">
            <Row label="Patient ID" value={patient.patientCode} />
            <Row label="Age" value={patient.dob ? `${calculateAge(patient.dob)} years` : 'Not yet recorded'} />
            <Row label="Gender" value={patient.gender} />
            <Row label="Date of birth" value={patient.dob ? formatDate(patient.dob) : 'Not yet recorded'} />
            <Row label="Blood group" value={orNotRecorded(patient.bloodGroup)} />
            <Row label="Height" value={patient.heightCm > 0 ? `${patient.heightCm} cm` : 'Not yet recorded'} />
            <Row label="Weight" value={patient.weightKg > 0 ? `${patient.weightKg} kg` : 'Not yet recorded'} />
            <Row label="BMI" value={bmi} />
          </Group>

          <Group title="Diagnosis">
            <Row label="Primary cancer" value={orNotRecorded(patient.primaryCancer)} />
            <Row label="Primary site" value={orNotRecorded(patient.primarySite)} />
            <Row label="Stage" value={orNotRecorded(patient.stage)} />
            <Row
              label="Diagnosed"
              value={patient.diagnosisDate ? formatDate(patient.diagnosisDate) : 'Not yet recorded'}
            />
            <Row label="Current treatment" value={orNotRecorded(patient.currentTreatment)} />
          </Group>
        </Surface>
      </Reveal>

      <Reveal index={1}>
        <Surface elevation="raised" radius="lg" border="subtle" inset="md" className="space-y-6">
          <Group title="Medical information">
            <Row label="Known allergies" value={listOrNone(patient.allergies)} />
            <Row label="Current medications" value={listOrNone(patient.currentMedications)} />
            <Row label="Previous treatments" value={listOrNone(patient.previousTreatments)} />
            <Row label="Past surgeries" value={listOrNone(patient.pastSurgeries)} />
            <Row label="Family history" value={orNotRecorded(patient.familyHistory)} />
            <Row label="Smoking history" value={orNotRecorded(patient.smokingHistory)} />
            <Row label="Alcohol history" value={orNotRecorded(patient.alcoholHistory)} />
          </Group>

          <section>
            <Text as="h3" level="subheading" tone="primary">
              Comorbidities
            </Text>
            {patient.comorbidities.length === 0 ? (
              <Text level="secondary" tone="muted" className="mt-3">
                No other medical conditions recorded.
              </Text>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {patient.comorbidities.map((condition) => (
                  <li key={condition}>
                    <StatusIndicator tone="warning">{condition}</StatusIndicator>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Surface>
      </Reveal>
    </div>
  )
}
