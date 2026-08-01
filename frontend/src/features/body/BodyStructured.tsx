import { Control, Surface, Text } from '@/components/primitives'
import { EvidenceList, SeverityIndicator } from '@/components/patterns'
import { ORGANS, REGION_LABEL, organLabel } from './anatomy'
import type { OrganDefinition } from './anatomy'
import type { BodyViewModel, OrganState } from './use-body-view-model'
import { cn } from '@/lib/utils'

/**
 * The Body — structured equivalent.
 *
 * NOT a degraded fallback. Every 3D view must have an equivalent non-3D
 * representation [00 §12.6], and screen reader users must be able to reach every
 * piece of information available to sighted users [00 §16.5].
 *
 * It consumes the same view-model as the 3D scene, so the two cannot drift: every
 * organ, severity, note and item of evidence present in the scene is present here,
 * with identical selection behaviour.
 *
 * Used when WebGL is unavailable, when rendering fails [09.6 §20], and as the
 * accessible representation alongside the scene at all times.
 */

const REGION_ORDER: OrganDefinition['region'][] = [
  'head-neck',
  'thorax',
  'abdomen',
  'pelvis',
  'systemic',
]

function OrganRow({
  organ,
  selected,
  onSelect,
  reportHref,
}: {
  organ: OrganState
  selected: boolean
  onSelect: () => void
  reportHref?: ((reportId: string) => string) | undefined
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          'w-full rounded-md border px-3 py-2.5 text-left',
          'transition-colors duration-[var(--motion-quick)]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
          selected
            ? 'border-[var(--accent-border)] bg-[var(--accent-subtle)]'
            : 'border-transparent hover:bg-[var(--surface-sunken)]',
        )}
      >
        <span className="flex items-center justify-between gap-3">
          <Text as="span" level="secondary" tone="primary" weight="medium">
            {organ.label}
          </Text>
          <SeverityIndicator severity={organ.severity} />
        </span>
        {organ.note && (
          <Text level="caption" tone="muted" className="mt-1">
            {organ.note}
          </Text>
        )}
      </button>

      {selected && organ.evidence && (
        <div className="mt-2 pl-3">
          <Text level="micro" tone="subtle" className="mb-1.5">
            Supporting evidence
          </Text>
          <EvidenceList items={[organ.evidence]} hrefFor={reportHref} />
        </div>
      )}
    </li>
  )
}

export interface BodyStructuredProps {
  model: BodyViewModel
  selectedOrgan: string | null
  onSelectOrgan: (organId: string) => void
  reportHref?: ((reportId: string) => string) | undefined
  /** Shown when this is standing in for a failed or unavailable 3D scene. */
  reason?: string
  onRetry?: (() => void) | undefined
  className?: string
}

export function BodyStructured({
  model,
  selectedOrgan,
  onSelectOrgan,
  reportHref,
  reason,
  onRetry,
  className,
}: BodyStructuredProps) {
  const byRegion = REGION_ORDER.map((region) => {
    const organs =
      region === 'systemic'
        ? (['lymph-nodes', 'bones'] as const).map((id) => model.organAt(id)).filter(Boolean)
        : ORGANS.filter((organ) => organ.region === region)
            .map((organ) => model.organAt(organ.id))
            .filter(Boolean)

    return { region, organs: organs as OrganState[] }
  }).filter((group) => group.organs.length > 0)

  return (
    <div className={cn('space-y-5', className)}>
      {reason && (
        <Surface
          elevation="sunken"
          radius="md"
          inset="sm"
          role="status"
          className="flex items-start justify-between gap-3"
        >
          <Text level="caption" tone="muted">
            {reason}
          </Text>
          {onRetry && (
            <Control intent="quiet" size="sm" onClick={onRetry}>
              Try again
            </Control>
          )}
        </Surface>
      )}

      {model.current && (
        <Text level="secondary" tone="body" measure="comfortable">
          {model.current.overallAssessment}
        </Text>
      )}

      {byRegion.map((group) => (
        <section key={group.region}>
          <Text level="micro" tone="subtle" as="h3">
            {REGION_LABEL[group.region]}
          </Text>
          <ul className="mt-2 space-y-1">
            {group.organs.map((organ) => (
              <OrganRow
                key={organ.organId}
                organ={organ}
                selected={selectedOrgan === organ.organId}
                onSelect={() => onSelectOrgan(organ.organId)}
                reportHref={reportHref}
              />
            ))}
          </ul>
        </section>
      ))}

      <Text level="caption" tone="subtle">
        {model.involved.length === 0
          ? 'No disease involvement is recorded for this date.'
          : `${model.involved.length} site${model.involved.length === 1 ? '' : 's'} with recorded involvement: ${model.involved
              .map((organ) => organLabel(organ.organId))
              .join(', ')}.`}
      </Text>
    </div>
  )
}
