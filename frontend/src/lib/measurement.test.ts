import { describe, expect, it } from 'vitest'
import {
  formatChange,
  formatValue,
  formatWithBand,
  precisionFor,
  readChange,
} from './measurement'
import type { MeasurementLike } from './measurement'

/**
 * Measurement rounding is tested directly because it is the part that can be
 * WRONG, and wrong rounding on a tumour measurement is not a cosmetic defect
 * `[CLAUDE.md: tests first for anything involving measurement]`.
 */

function m(partial: Partial<MeasurementLike>): MeasurementLike {
  return {
    value: 0,
    unit: 'mm',
    uncertainty: null,
    uncertaintyBasis: null,
    exceedsVariability: null,
    ...partial,
  }
}

describe('precisionFor', () => {
  it('shows no decimals when the band is a whole unit or larger', () => {
    expect(precisionFor(12)).toBe(0)
    expect(precisionFor(2.5)).toBe(0)
    expect(precisionFor(1)).toBe(0)
  })

  it('shows one decimal when the band is a tenth', () => {
    expect(precisionFor(0.5)).toBe(1)
    expect(precisionFor(0.1)).toBe(1)
  })

  it('shows two decimals when the band is a hundredth', () => {
    expect(precisionFor(0.05)).toBe(2)
  })

  it('caps precision rather than trusting a vanishingly small band', () => {
    expect(precisionFor(0.0000001)).toBeLessThanOrEqual(3)
  })

  it('does not fall back to raw precision when there is no band', () => {
    // An unqualified number is exactly the false-precision problem.
    expect(precisionFor(null)).toBe(1)
    expect(precisionFor(0)).toBe(1)
    expect(precisionFor(Number.NaN)).toBe(1)
  })
})

describe('formatValue', () => {
  it('never renders more precision than the band supports', () => {
    // The case CLAUDE.md rule 4 names: ±2.5 cannot justify four significant figures.
    expect(formatValue(m({ value: 12.3456, uncertainty: 2.5 }))).toBe('12')
  })

  it('keeps precision the band does justify', () => {
    expect(formatValue(m({ value: 12.3456, uncertainty: 0.05 }))).toBe('12.35')
  })
})

describe('formatWithBand', () => {
  it('renders the band at the same precision as the value', () => {
    expect(formatWithBand(m({ value: 34.21, uncertainty: 0.5, unit: 'mm' }))).toBe(
      '34.2 ± 0.5 mm',
    )
  })

  it('omits the band when there is none, without implying precision', () => {
    expect(formatWithBand(m({ value: 34.2137, uncertainty: null, unit: 'mm' }))).toBe('34.2 mm')
  })
})

describe('formatChange', () => {
  it('signs an increase explicitly', () => {
    // "4 mm" and "+4 mm" read very differently when the subject is a tumour.
    expect(formatChange(m({ value: 4.2, uncertainty: 2, unit: 'mm' }))).toBe('+4 mm')
  })

  it('carries the minus sign through', () => {
    expect(formatChange(m({ value: -4.2, uncertainty: 2, unit: 'mm' }))).toBe('-4 mm')
  })
})

describe('readChange', () => {
  it('reports a change inside the band as possibly not real', () => {
    expect(readChange(m({ value: 1.2, exceedsVariability: false }))).toBe('within-noise')
  })

  it('reports a change beyond the band as meaningful', () => {
    expect(readChange(m({ value: 9.4, exceedsVariability: true }))).toBe('meaningful')
  })

  it('says unknown rather than guessing when there is no evidence base', () => {
    expect(readChange(m({ value: 9.4, exceedsVariability: null }))).toBe('unknown')
  })
})
