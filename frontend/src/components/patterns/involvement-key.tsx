import { Text } from '@/components/primitives'
import { INVOLVEMENT_BANDS, involvementColor, involvementLabel, involvementMeaning, isNotAssessed } from '@/lib/status'
import { cn } from '@/lib/utils'

/**
 * What the Body's surfaces mean — contract v2.
 *
 * Exists because the single most important rendering decision in v2 is one a
 * user cannot be expected to infer: that a SMOOTH pale organ and a HATCHED pale
 * organ mean different things. Smooth is "we looked, and found nothing".
 * Hatched is "we never looked". Colour alone cannot carry that — every
 * saturated hue is spoken for by disease, and a second grey reads as lighting.
 *
 * Each row states the meaning in plain language rather than naming the band,
 * because "not assessed" is exactly the phrase a patient will read as
 * reassurance if it is left to stand on its own.
 */
export function InvolvementKey({ className }: { className?: string }) {
  return (
    <dl className={cn('space-y-3', className)}>
      {INVOLVEMENT_BANDS.map((band) => {
        const hatched = isNotAssessed(band)
        return (
          <div key={band} className="flex items-start gap-3">
            <span
              aria-hidden
              className={cn(
                'mt-0.5 size-4 shrink-0 rounded-[3px] ring-1 ring-[var(--border-default)]',
                // The hatch is drawn in currentColor, so one class serves every
                // band that ever needs it without a second colour declaration.
                hatched && 'ao-hatch',
              )}
              style={
                hatched
                  ? { color: involvementColor(band) }
                  : { backgroundColor: involvementColor(band) }
              }
            />
            <div className="min-w-0">
              <dt>
                <Text as="span" level="caption" tone="primary" weight="medium">
                  {involvementLabel(band)}
                </Text>
              </dt>
              <dd>
                <Text level="caption" tone="muted">
                  {involvementMeaning(band)}
                </Text>
              </dd>
            </div>
          </div>
        )
      })}
    </dl>
  )
}
