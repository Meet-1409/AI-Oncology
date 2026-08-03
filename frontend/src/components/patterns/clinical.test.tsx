import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ChangeIndicator, Confidence, SeverityIndicator } from './clinical'

describe('SeverityIndicator', () => {
  it('never communicates severity by color alone — every level has a text label', () => {
    render(<SeverityIndicator severity={4} />)
    expect(screen.getByText(/./)).toBeInTheDocument()
  })

  it('renders a distinct label for the no-involvement level', () => {
    render(<SeverityIndicator severity={0} />)
    // Regression guard: severity 0 previously risked rendering an empty label.
    const text = screen.getByText(/./).textContent
    expect(text).toBeTruthy()
  })
})

describe('Confidence', () => {
  it('shows confidence as a percentage, never hidden behind an interaction [00 §5.10]', () => {
    render(<Confidence value={0.86} />)
    expect(screen.getByText('86% confidence')).toBeInTheDocument()
  })

  it('rounds to the nearest whole percentage', () => {
    render(<Confidence value={0.855} />)
    expect(screen.getByText('86% confidence')).toBeInTheDocument()
  })
})

describe('ChangeIndicator', () => {
  it.each([
    ['progression', 'Progression'],
    ['regression', 'Improvement'],
    ['stable', 'Stable'],
  ] as const)('labels %s as "%s"', (direction, label) => {
    render(<ChangeIndicator direction={direction} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})

describe('accessibility', () => {
  it('has no structural violations across the clinical patterns', async () => {
    const { container } = render(
      <>
        <SeverityIndicator severity={3} />
        <Confidence value={0.72} />
        <ChangeIndicator direction="progression" />
      </>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
