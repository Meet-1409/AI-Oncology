import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'jest-axe'
import { EvidenceView } from './EvidenceView'
import type { Report } from '@/types'

function makeReport(overrides: Partial<Report> & Pick<Report, 'id' | 'name'>): Report {
  return {
    patientId: 'p1',
    type: 'MRI',
    hospital: 'Sunrise Cancer Institute',
    uploadDate: '2026-01-02',
    reportDate: '2026-01-01',
    status: 'processed',
    fileSizeKb: 1200,
    fileKind: 'pdf',
    ...overrides,
  }
}

const EARLIER = makeReport({ id: 'r1', name: 'Baseline MRI', reportDate: '2026-01-01' })
const LATER = makeReport({ id: 'r2', name: 'Follow-up MRI', reportDate: '2026-03-01' })

describe('EvidenceView', () => {
  it('shows an upload prompt when there are no reports [09.4 §22]', () => {
    render(<EvidenceView reports={[]} onOpenReport={vi.fn()} onUpload={vi.fn()} />)
    expect(screen.getByText('No reports uploaded yet')).toBeInTheDocument()
  })

  it('opens a report when its row is clicked outside compare mode', async () => {
    const onOpenReport = vi.fn()
    render(<EvidenceView reports={[EARLIER, LATER]} onOpenReport={onOpenReport} />)

    await userEvent.click(screen.getByText('Baseline MRI'))
    expect(onOpenReport).toHaveBeenCalledWith(EARLIER)
  })

  it('lets an oncologist select exactly two reports and compare them [09.4 §14]', async () => {
    const onCompare = vi.fn()
    render(
      <EvidenceView reports={[EARLIER, LATER]} onOpenReport={vi.fn()} onCompare={onCompare} />,
    )

    await userEvent.click(screen.getByRole('button', { name: /compare/i }))

    // Compare confirmation is disabled until exactly two reports are selected.
    expect(screen.getByRole('button', { name: /compare selected/i })).toBeDisabled()

    await userEvent.click(screen.getByText('Baseline MRI'))
    await userEvent.click(screen.getByText('Follow-up MRI'))

    const confirm = screen.getByRole('button', { name: /compare selected/i })
    expect(confirm).toBeEnabled()

    await userEvent.click(confirm)
    expect(onCompare).toHaveBeenCalledWith(EARLIER, LATER)
  })

  it('does not offer comparison when onCompare is not provided (patient view)', () => {
    render(<EvidenceView reports={[EARLIER, LATER]} onOpenReport={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /^compare$/i })).not.toBeInTheDocument()
  })

  it('has no structural accessibility violations in compare-selection mode', async () => {
    const { container } = render(
      <EvidenceView reports={[EARLIER, LATER]} onOpenReport={vi.fn()} onCompare={vi.fn()} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /^compare$/i }))
    expect(await axe(container)).toHaveNoViolations()
  })
})
