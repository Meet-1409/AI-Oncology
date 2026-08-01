import { Sparkles } from 'lucide-react'
import { Icon, StatusIndicator, Surface, Text } from '@/components/primitives'
import { ChangeIndicator, Confidence, EmptyState, EvidenceList } from '@/components/patterns'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Understanding } from '@/data/contract/domain'

/**
 * Understanding (Patient Intelligence).
 *
 * A readable, continuous clinical narrative rather than a grid of metric boxes
 * [09.7 §4]. This is what the oncologist reads first, so no doctor has to search
 * for the state of their patient.
 *
 * Evidence and confidence are attached to the statement they support, never
 * collected in a separate area [09.7 §4], [08 §13] — verification never requires
 * leaving the space.
 */

const SEVERITY_TONE = {
  Mild: 'neutral',
  Moderate: 'warning',
  Severe: 'danger',
  Critical: 'danger',
} as const

export interface UnderstandingViewProps {
  understanding: Understanding | null
  reportHref?: ((reportId: string) => string) | undefined
  onSelectOrgan?: ((organLabel: string) => void) | undefined
  className?: string
}

export function UnderstandingView({
  understanding,
  reportHref,
  onSelectOrgan,
  className,
}: UnderstandingViewProps) {
  if (!understanding) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No clinical overview available"
        description="An overview is generated automatically once enough validated reports are available for this patient."
        className={className}
      />
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Clinical summary, with its confidence beside it rather than hidden. */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Icon icon={Sparkles} size="sm" className="text-[var(--accent)]" />
            <Text as="h3" level="subheading" tone="primary">
              Clinical summary
            </Text>
          </span>
          <Confidence value={understanding.confidence} />
        </div>
        <Text level="body" tone="body" measure="comfortable" className="mt-3">
          {understanding.clinicalSummary}
        </Text>
        <Text level="caption" tone="subtle" className="mt-2">
          Generated {formatDate(understanding.generatedDate)}. The original reports remain
          the source of truth.
        </Text>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Disease overview */}
        <Surface elevation="raised" radius="lg" border="subtle" inset="md">
          <Text as="h3" level="subheading" tone="primary">
            Disease
          </Text>
          <dl className="mt-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <dt>
                <Text as="span" level="caption" tone="muted">
                  Current status
                </Text>
              </dt>
              <dd className="text-right">
                <Text as="span" level="secondary" tone="primary">
                  {understanding.currentDiseaseStatus}
                </Text>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>
                <Text as="span" level="caption" tone="muted">
                  Severity
                </Text>
              </dt>
              <dd>
                <StatusIndicator tone={SEVERITY_TONE[understanding.diseaseSeverity]}>
                  {understanding.diseaseSeverity}
                </StatusIndicator>
              </dd>
            </div>
            <div>
              <dt className="mb-1.5">
                <Text as="span" level="caption" tone="muted">
                  Affected sites
                </Text>
              </dt>
              <dd>
                {understanding.affectedOrgans.length === 0 ? (
                  <Text level="secondary" tone="muted">
                    No active disease sites identified.
                  </Text>
                ) : (
                  <ul className="flex flex-wrap gap-1.5">
                    {understanding.affectedOrgans.map((organ) => (
                      <li key={organ}>
                        {onSelectOrgan ? (
                          <button
                            type="button"
                            onClick={() => onSelectOrgan(organ)}
                            className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                          >
                            <StatusIndicator tone="danger">{organ}</StatusIndicator>
                          </button>
                        ) : (
                          <StatusIndicator tone="danger">{organ}</StatusIndicator>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
          </dl>
        </Surface>

        {/* Treatment overview */}
        <Surface elevation="raised" radius="lg" border="subtle" inset="md">
          <Text as="h3" level="subheading" tone="primary">
            Treatment
          </Text>
          <dl className="mt-3 space-y-3">
            <div>
              <dt>
                <Text as="span" level="caption" tone="muted">
                  Current
                </Text>
              </dt>
              <dd className="mt-0.5">
                <Text level="secondary" tone="body">
                  {understanding.treatmentOverview.current}
                </Text>
              </dd>
            </div>
            {understanding.treatmentOverview.previous.length > 0 && (
              <div>
                <dt>
                  <Text as="span" level="caption" tone="muted">
                    Previous
                  </Text>
                </dt>
                <dd className="mt-1">
                  <ul className="list-disc space-y-0.5 pl-4">
                    {understanding.treatmentOverview.previous.map((treatment) => (
                      <li key={treatment}>
                        <Text as="span" level="secondary" tone="body">
                          {treatment}
                        </Text>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            )}
            <div>
              <dt>
                <Text as="span" level="caption" tone="muted">
                  Recent change
                </Text>
              </dt>
              <dd className="mt-0.5">
                <Text level="secondary" tone="body">
                  {understanding.treatmentOverview.recentChange}
                </Text>
              </dd>
            </div>
          </dl>
        </Surface>
      </div>

      {/* Disease progression */}
      <section>
        <Text as="h3" level="subheading" tone="primary">
          How this has changed
        </Text>
        <ul className="mt-3 space-y-3">
          {understanding.recentChanges.map((change) => (
            <li key={change.label} className="flex items-start gap-3">
              <span className="mt-0.5 shrink-0">
                <ChangeIndicator direction={change.type} />
              </span>
              <span className="min-w-0">
                <Text level="secondary" tone="primary" weight="medium">
                  {change.label}
                </Text>
                <Text level="caption" tone="muted" className="mt-0.5">
                  {change.description}
                </Text>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Supporting evidence — every AI output traces to its source [00 §5.9]. */}
      <section>
        <Text as="h3" level="subheading" tone="primary">
          Supporting evidence
        </Text>
        <div className="mt-3">
          <EvidenceList items={understanding.supportingEvidence} hrefFor={reportHref} />
        </div>
      </section>
    </div>
  )
}
