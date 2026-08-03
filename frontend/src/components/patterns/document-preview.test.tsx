import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { DocumentPreview } from './document-preview'
import type { Report } from '@/types'

const REPORT: Report = {
  id: 'r1',
  patientId: 'p1',
  name: 'Contrast-Enhanced MRI — Breast',
  type: 'MRI',
  hospital: 'Sunrise Cancer Institute',
  uploadDate: '2026-03-09',
  reportDate: '2026-03-08',
  status: 'processed',
  fileSizeKb: 4200,
  fileKind: 'pdf',
}

describe('DocumentPreview', () => {
  it('starts at 100% zoom and supports zoom in/out within documented bounds [09.4 §16]', async () => {
    render(<DocumentPreview report={REPORT} />)
    expect(screen.getByText('100%')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    expect(screen.getByText('125%')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
    await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('never zooms below 50% or above 250%', async () => {
    render(<DocumentPreview report={REPORT} />)

    for (let i = 0; i < 10; i++) {
      await userEvent.click(screen.getByRole('button', { name: 'Zoom out' }))
    }
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled()

    for (let i = 0; i < 20; i++) {
      await userEvent.click(screen.getByRole('button', { name: 'Zoom in' }))
    }
    expect(screen.getByText('250%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
  })

  it('honestly reports one known page rather than inventing a page count [00 §5.8]', () => {
    render(<DocumentPreview report={REPORT} />)
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled()
  })

  it('has no structural accessibility violations, including disabled controls [00 §16.4]', async () => {
    const { container } = render(<DocumentPreview report={REPORT} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
