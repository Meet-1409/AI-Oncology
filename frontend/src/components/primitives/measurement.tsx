import { Text } from './text'
import {
  CHANGE_MEANING,
  formatChange,
  formatWithBand,
  readChange,
} from '@/lib/measurement'
import type { MeasurementLike } from '@/lib/measurement'
import { cn } from '@/lib/utils'

/**
 * A measured quantity, rendered with its uncertainty.
 *
 * THIS EXISTS SO NOBODY REACHES FOR `.toFixed()`.
 *
 * Inter-reader variability on single-lesion RECIST measurement reaches roughly
 * ±22–25%, so a bare "+12.34%" claims four significant figures of a number two
 * radiologists would disagree about by a quarter of its value `[CLAUDE.md rule
 * 4]`. The rounding rule lives in `lib/measurement.ts` and is tested there; this
 * component is only the presentation of it.
 *
 * Deliberately built before any v2 screen consumes it. A primitive that arrives
 * after its consumers arrives too late — by then every call site has already
 * formatted a number by hand, and each one is a separate place to get it wrong.
 */

export interface MeasurementProps {
  measurement: MeasurementLike
  /**
   * A change rather than an absolute value. Signs the number, and renders a
   * change within measurement noise differently from a real one.
   */
  asChange?: boolean
  /** Show what the band is derived from. Off in dense lists, on in detail views. */
  showBasis?: boolean
  className?: string
}

export function Measurement({
  measurement,
  asChange = false,
  showBasis = false,
  className,
}: MeasurementProps) {
  const reading = asChange ? readChange(measurement) : null

  return (
    <span className={cn('inline-flex flex-col gap-0.5', className)}>
      <span className="inline-flex items-baseline gap-1.5">
        <Text
          as="span"
          level="secondary"
          // A change that may not be real must not be read with the same weight
          // as one that is. Muting it is the whole point of the distinction —
          // rendering both identically is how measurement noise becomes a
          // clinical narrative.
          tone={reading === 'within-noise' ? 'muted' : 'primary'}
          weight="medium"
          className="tabular-nums"
        >
          {asChange ? formatChange(measurement) : formatWithBand(measurement)}
        </Text>

        {reading === 'within-noise' && (
          <Text as="span" level="caption" tone="muted">
            within measurement variation
          </Text>
        )}
        {reading === 'unknown' && (
          <Text as="span" level="caption" tone="subtle">
            range unknown
          </Text>
        )}
      </span>

      {/* The band itself, for a change — the absolute form already carries it
          inline via formatWithBand. */}
      {asChange && measurement.uncertainty !== null && (
        <Text as="span" level="caption" tone="subtle" className="tabular-nums">
          ± {measurement.uncertainty} {measurement.unit}
        </Text>
      )}

      {reading && (
        <Text as="span" level="caption" tone="muted">
          {CHANGE_MEANING[reading]}
        </Text>
      )}

      {showBasis && measurement.uncertaintyBasis && (
        <Text as="span" level="caption" tone="subtle">
          Range from: {measurement.uncertaintyBasis}
        </Text>
      )}

      {/* No band and not a change: say so rather than let a bare number imply
          a precision nothing supports. */}
      {!asChange && measurement.uncertainty === null && (
        <Text as="span" level="caption" tone="subtle">
          No established range for this measurement.
        </Text>
      )}
    </span>
  )
}
