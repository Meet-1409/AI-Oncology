import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { StatusIndicator } from './status-indicator'

describe('StatusIndicator', () => {
  it('renders its text regardless of tone', () => {
    render(<StatusIndicator tone="danger">Processing failed</StatusIndicator>)
    expect(screen.getByText('Processing failed')).toBeInTheDocument()
  })

  it('has no structural accessibility violations', async () => {
    const { container } = render(<StatusIndicator tone="warning" dot>Pending</StatusIndicator>)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('adds a decorative dot without duplicating the status as text', () => {
    const { container } = render(
      <StatusIndicator tone="success" dot>
        Completed
      </StatusIndicator>,
    )
    // The dot is a second, non-text channel [00 §16.2] — it must never be the
    // only way the status is communicated, so it carries no accessible text.
    const dot = container.querySelector('[aria-hidden]')
    expect(dot).not.toBeNull()
    expect(screen.getByText('Completed')).toBeInTheDocument()
  })
})
