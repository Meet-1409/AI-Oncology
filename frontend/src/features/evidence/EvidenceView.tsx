import { useMemo, useState } from 'react'
import { Check, FileText, GitCompare, Image as ImageIcon, Search, UploadCloud } from 'lucide-react'
import { Control, Field, Icon, Input, Select, Text } from '@/components/primitives'
import { EmptyState, ProcessingStatusIndicator } from '@/components/patterns'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Report } from '@/types'

/**
 * Evidence (Report Management).
 *
 * A continuous, browsable set rather than a grid of cards [09.4 §5]. Search,
 * filter and sort are the shared implementations from the design system, because
 * the same interaction is specified across four feature documents.
 *
 * Where Evidence is reached from an organ or a Journey event it arrives already
 * scoped to that context, with no manual filtering required [09.4 §5].
 */

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'name', label: 'Report name' },
  { value: 'type', label: 'Report type' },
  { value: 'hospital', label: 'Hospital' },
] as const

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'processing', label: 'Processing' },
  { value: 'processed', label: 'Processed' },
  { value: 'failed', label: 'Processing failed' },
] as const

type SortKey = (typeof SORT_OPTIONS)[number]['value']

export interface EvidenceViewProps {
  reports: readonly Report[]
  onOpenReport: (report: Report) => void
  onUpload?: (() => void) | undefined
  /** Describes an active contextual scope, e.g. reports for a selected organ. */
  scopeLabel?: string | undefined
  onClearScope?: (() => void) | undefined
  /** Comparing reports is an oncologist action [09.4 §14]. */
  onCompare?: ((fromReport: Report, toReport: Report) => void) | undefined
  className?: string
}

export function EvidenceView({
  reports,
  onOpenReport,
  onUpload,
  scopeLabel,
  onClearScope,
  onCompare,
  className,
}: EvidenceViewProps) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<SortKey>('newest')
  const [compareMode, setCompareMode] = useState(false)
  const [selected, setSelected] = useState<readonly Report[]>([])

  const exitCompareMode = () => {
    setCompareMode(false)
    setSelected([])
  }

  const toggleSelected = (report: Report) => {
    setSelected((current) => {
      if (current.some((r) => r.id === report.id)) {
        return current.filter((r) => r.id !== report.id)
      }
      // Only two reports are ever compared at once [09.4 §14]; selecting a
      // third replaces the first rather than growing the set.
      return current.length < 2 ? [...current, report] : [current[1]!, report]
    })
  }

  const typeOptions = useMemo(
    () => [
      { value: 'all', label: 'All types' },
      ...Array.from(new Set(reports.map((r) => r.type)))
        .sort()
        .map((t) => ({ value: t, label: t })),
    ],
    [reports],
  )

  const visible = useMemo(() => {
    let list = [...reports]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.hospital.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q),
      )
    }
    if (type !== 'all') list = list.filter((r) => r.type === type)
    if (status !== 'all') list = list.filter((r) => r.status === status)

    list.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return b.reportDate.localeCompare(a.reportDate)
        case 'oldest':
          return a.reportDate.localeCompare(b.reportDate)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'type':
          return a.type.localeCompare(b.type)
        case 'hospital':
          return a.hospital.localeCompare(b.hospital)
      }
    })
    return list
  }, [reports, query, type, status, sort])

  if (reports.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No reports uploaded yet"
        description="Reports appear here as they are uploaded, organized automatically by type and date."
        action={
          onUpload && (
            <Control intent="primary" size="sm" onClick={onUpload}>
              <Icon icon={UploadCloud} size="xs" />
              Upload a report
            </Control>
          )
        }
        className={className}
      />
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {scopeLabel && (
        <div className="flex items-center justify-between gap-3 rounded-md bg-[var(--accent-subtle)] px-3 py-2">
          <Text level="caption" tone="accent">
            Showing evidence for {scopeLabel}
          </Text>
          {onClearScope && (
            <Control size="sm" intent="quiet" onClick={onClearScope}>
              Show all
            </Control>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Search reports" className="min-w-[200px] flex-1">
          {({ id }) => (
            <div className="relative">
              <Icon
                icon={Search}
                size="sm"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-subtle)]"
              />
              <Input
                id={id}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, type or hospital"
                className="pl-9"
              />
            </div>
          )}
        </Field>

        <Field label="Type" className="w-40">
          {({ id }) => (
            <Select
              id={id}
              options={typeOptions}
              value={type}
              onChange={(event) => setType(event.target.value)}
            />
          )}
        </Field>

        <Field label="Status" className="w-44">
          {({ id }) => (
            <Select
              id={id}
              options={STATUS_OPTIONS}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            />
          )}
        </Field>

        <Field label="Order" className="w-40">
          {({ id }) => (
            <Select
              id={id}
              options={SORT_OPTIONS}
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
            />
          )}
        </Field>

        {onCompare && !compareMode && visible.length >= 2 && (
          <Control intent="secondary" onClick={() => setCompareMode(true)}>
            <Icon icon={GitCompare} size="sm" />
            Compare
          </Control>
        )}

        {onUpload && (
          <Control intent="primary" onClick={onUpload}>
            <Icon icon={UploadCloud} size="sm" />
            Upload
          </Control>
        )}
      </div>

      {compareMode && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-[var(--surface-sunken)] px-3 py-2.5">
          <Text level="secondary" tone="body">
            {selected.length === 0 && 'Select two reports to compare.'}
            {selected.length === 1 && 'Select one more report to compare.'}
            {selected.length === 2 &&
              `Comparing ${selected[0]!.name} with ${selected[1]!.name}.`}
          </Text>
          <div className="flex gap-2">
            <Control size="sm" intent="quiet" onClick={exitCompareMode}>
              Cancel
            </Control>
            <Control
              size="sm"
              intent="primary"
              disabled={selected.length !== 2}
              onClick={() => {
                if (selected.length === 2 && onCompare) {
                  onCompare(selected[0]!, selected[1]!)
                  exitCompareMode()
                }
              }}
            >
              <Icon icon={GitCompare} size="xs" />
              Compare selected
            </Control>
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matching reports"
          description="Nothing matched these filters. Try a different search term, type or status."
        />
      ) : (
        <ul className="divide-y divide-[var(--border-subtle)]">
          {visible.map((report) => {
            const isSelected = selected.some((r) => r.id === report.id)
            return (
              <li key={report.id}>
                <button
                  type="button"
                  aria-pressed={compareMode ? isSelected : undefined}
                  onClick={() => (compareMode ? toggleSelected(report) : onOpenReport(report))}
                  className={cn(
                    'flex w-full items-center gap-3.5 px-2 py-3 text-left',
                    'transition-colors duration-[var(--motion-quick)] hover:bg-[var(--surface-sunken)]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
                    isSelected && 'bg-[var(--accent-subtle)] hover:bg-[var(--accent-subtle)]',
                  )}
                >
                  {compareMode ? (
                    <span
                      aria-hidden
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-md border',
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--text-on-accent)]'
                          : 'border-[var(--border-default)] text-transparent',
                      )}
                    >
                      <Icon icon={Check} size="sm" />
                    </span>
                  ) : (
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-[var(--surface-sunken)]">
                      <Icon
                        icon={report.fileKind === 'image' ? ImageIcon : FileText}
                        size="sm"
                        className="text-[var(--text-subtle)]"
                      />
                    </span>
                  )}

                  <span className="min-w-0 flex-1">
                    <Text level="secondary" tone="primary" weight="medium" truncate>
                      {report.name}
                    </Text>
                    <Text level="caption" tone="muted" truncate>
                      {report.type} · {report.hospital} · {formatDate(report.reportDate)}
                    </Text>
                  </span>

                  <ProcessingStatusIndicator status={report.status} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <Text level="caption" tone="subtle">
        {visible.length} of {reports.length} report{reports.length === 1 ? '' : 's'}
      </Text>
    </div>
  )
}
