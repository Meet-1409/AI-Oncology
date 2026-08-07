/**
 * Formatting a measured quantity honestly.
 *
 * THE RULE: never render more precision than the uncertainty band supports.
 *
 * Inter-reader variability on single-lesion RECIST measurement reaches roughly
 * ±22–25%. A bare "+12.34%" claims four significant figures of a number two
 * radiologists would disagree about by a quarter of its value — so it is a
 * design error, not a formatting preference `[CLAUDE.md rule 4]`.
 *
 * These are pure functions and live in lib/ rather than in the component,
 * because the rounding is the part that can be WRONG, and wrong rounding on a
 * tumour measurement is not a cosmetic defect. Tested directly.
 */

/** Contract v2's measurement shape, structurally — kept local so lib/ stays leaf. */
export interface MeasurementLike {
  value: number
  unit: string
  /** Half-width of the reference band, same unit. Null when no evidence base exists. */
  uncertainty: number | null
  uncertaintyBasis: string | null
  /** False when a change is within measurement noise. Null when not applicable. */
  exceedsVariability: boolean | null
}

/**
 * Decimal places justified by an uncertainty band.
 *
 * A band of 2.5 justifies one decimal; a band of 0.05 justifies two; a band of
 * 12 justifies none. The rule is to show one place finer than the band's own
 * leading digit and no more, which is the ordinary convention for reporting a
 * value with its error.
 *
 * With no band we do NOT fall back to raw precision — an unqualified number is
 * exactly the false-precision problem. One decimal is the ceiling.
 */
export function precisionFor(uncertainty: number | null): number {
  if (uncertainty === null || !Number.isFinite(uncertainty) || uncertainty <= 0) return 1
  const magnitude = Math.floor(Math.log10(Math.abs(uncertainty)))
  // band >= 10 -> 0dp, band >= 1 -> 0dp, band >= 0.1 -> 1dp, band >= 0.01 -> 2dp
  return Math.max(0, Math.min(3, -magnitude - 1 + 1))
}

/** The value alone, rounded to the precision its band justifies. */
export function formatValue(measurement: MeasurementLike): string {
  const dp = precisionFor(measurement.uncertainty)
  return measurement.value.toFixed(dp)
}

/**
 * The value with its band, e.g. `34.2 ± 2.5 mm`.
 *
 * When there is no band the value is still rounded, and the caller is expected
 * to say the band is unknown rather than let a bare number imply precision.
 */
export function formatWithBand(measurement: MeasurementLike): string {
  const dp = precisionFor(measurement.uncertainty)
  const value = measurement.value.toFixed(dp)
  if (measurement.uncertainty === null) return `${value} ${measurement.unit}`.trim()
  return `${value} ± ${measurement.uncertainty.toFixed(dp)} ${measurement.unit}`.trim()
}

/**
 * A change, signed, rounded to what its band supports.
 *
 * The sign is explicit on purpose: "4 mm" and "+4 mm" read very differently
 * when the subject is a tumour.
 */
export function formatChange(measurement: MeasurementLike): string {
  const dp = precisionFor(measurement.uncertainty)
  const sign = measurement.value > 0 ? '+' : ''
  return `${sign}${measurement.value.toFixed(dp)} ${measurement.unit}`.trim()
}

/**
 * How a change should be read.
 *
 * `within-noise` is the case that matters. A change smaller than the band two
 * readers would disagree by is not evidence of anything, and rendering it the
 * same as a real change is how measurement noise becomes a clinical narrative.
 * `unknown` is honest rather than a shrug — with no evidence base for the band,
 * we cannot say whether the change is meaningful.
 */
export type ChangeReading = 'meaningful' | 'within-noise' | 'unknown'

export function readChange(measurement: MeasurementLike): ChangeReading {
  if (measurement.exceedsVariability === null) return 'unknown'
  return measurement.exceedsVariability ? 'meaningful' : 'within-noise'
}

/** Plain words for each reading. Never states a direction the data cannot support. */
export const CHANGE_MEANING: Readonly<Record<ChangeReading, string>> = {
  meaningful: 'Larger than the range two readers would normally differ by.',
  'within-noise':
    'Within the range two readers would normally differ by, so this may not be a real change.',
  unknown: 'There is no established range for this measurement, so it cannot be judged.',
}
