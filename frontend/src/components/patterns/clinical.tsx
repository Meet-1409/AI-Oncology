import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Icon, StatusIndicator, Surface, Text } from '@/components/primitives'
import type { StatusTone } from '@/components/primitives'
import { useReducedMotion } from '@/components/motion'
import { severityColor, severityLabel } from '@/lib/status'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { EvidenceRef, ProcessingStatus, TaskPriority, TaskStatus, NoteType } from '@/types'

/**
 * Clinical patterns.
 *
 * Domain-aware presentation shared by every space. Centralised so that a status,
 * a severity or a confidence value is rendered identically everywhere — and so the
 * accessibility rules that protect them cannot be forgotten in one place.
 */

/* ---- Severity ------------------------------------------------------------ */

/**
 * Severity is never communicated by color alone [00 §16.2]: the swatch is
 * decorative and the label carries the meaning.
 */
export function SeverityIndicator({ severity, className }: { severity: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden
        // The ring is themed: the top of the severity scale is a very dark red
        // that loses its edge against a dark surface. It delineates the swatch
        // without altering a single severity value.
        className="severity-swatch size-3 shrink-0 rounded-full ring-1 ring-inset ring-[var(--severity-ring)]"
        style={{ background: severityColor(severity) }}
      />
      <Text as="span" level="caption" tone="body">
        {severityLabel(severity)}
      </Text>
    </span>
  )
}

/* ---- Status mapping ------------------------------------------------------ */

const PROCESSING: Record<ProcessingStatus, { label: string; tone: StatusTone }> = {
  uploaded: { label: 'Uploaded', tone: 'neutral' },
  processing: { label: 'Processing', tone: 'info' },
  processed: { label: 'Processed', tone: 'success' },
  failed: { label: 'Processing failed', tone: 'danger' },
}

export function ProcessingStatusIndicator({ status }: { status: ProcessingStatus }) {
  const meta = PROCESSING[status]
  return (
    <StatusIndicator tone={meta.tone} dot={status !== 'uploaded'}>
      {meta.label}
    </StatusIndicator>
  )
}

const TASK_STATUS: Record<TaskStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'Pending', tone: 'warning' },
  in_progress: { label: 'In progress', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

export function TaskStatusIndicator({ status }: { status: TaskStatus }) {
  const meta = TASK_STATUS[status]
  return <StatusIndicator tone={meta.tone} dot>{meta.label}</StatusIndicator>
}

const PRIORITY: Record<TaskPriority, { label: string; tone: StatusTone }> = {
  low: { label: 'Low priority', tone: 'neutral' },
  medium: { label: 'Medium priority', tone: 'info' },
  high: { label: 'High priority', tone: 'danger' },
}

export function PriorityIndicator({ priority }: { priority: TaskPriority }) {
  const meta = PRIORITY[priority]
  return <StatusIndicator tone={meta.tone}>{meta.label}</StatusIndicator>
}

/**
 * Note visibility must be unmistakable and stated in text, never color alone
 * [09.9 §5], [09.9 §22] — a private observation must never be mistaken for
 * something the patient can read.
 */
export function NoteVisibilityIndicator({ type }: { type: NoteType }) {
  return type === 'private' ? (
    <StatusIndicator tone="neutral" dot>
      Private — visible only to you
    </StatusIndicator>
  ) : (
    <StatusIndicator tone="success" dot>
      Shared — visible to the patient
    </StatusIndicator>
  )
}

/* ---- AI outputs ---------------------------------------------------------- */

/**
 * Every AI output displays its confidence, and confidence is never hidden behind
 * an extra interaction [00 §5.10], [09.7 §13].
 */
export function Confidence({ value, className }: { value: number; className?: string }) {
  const percent = Math.round(value * 100)
  const tone = percent >= 85 ? 'success' : percent >= 65 ? 'warning' : 'danger'
  const toneVar = `var(--status-${tone}-text)`
  const reduced = useReducedMotion()
  // A confidence figure fills in rather than appearing pre-filled — a CSS
  // transition only animates a style CHANGE, so the bar mounts empty and
  // catches up to its real value one frame later [00 §11.5].
  const [filled, setFilled] = useState(reduced)

  useEffect(() => {
    if (reduced) return
    const frame = requestAnimationFrame(() => setFilled(true))
    return () => cancelAnimationFrame(frame)
  }, [reduced])

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden
        className="h-1.5 w-16 overflow-hidden rounded-full bg-[var(--surface-sunken)]"
      >
        <span
          className="block h-full rounded-full transition-[width] duration-[var(--motion-reveal)] ease-[var(--motion-ease-enter)] motion-reduce:transition-none"
          style={{ width: filled ? `${percent}%` : '0%', background: toneVar }}
        />
      </span>
      <Text as="span" level="caption" tone="muted">
        {percent}% confidence
      </Text>
    </span>
  )
}

/**
 * Evidence is presented beside the statement it supports, and opening the source
 * never requires leaving the current space [08 §13].
 */
export function EvidenceList({
  items,
  hrefFor,
  className,
}: {
  items: readonly EvidenceRef[]
  hrefFor?: (reportId: string) => string
  className?: string
}) {
  if (items.length === 0) {
    return (
      <Text level="secondary" tone="muted">
        No supporting evidence is available yet.
      </Text>
    )
  }

  return (
    <ul className={cn('space-y-2.5', className)}>
      {items.map((evidence, index) => {
        const content = (
          <Surface
            elevation="sunken"
            radius="md"
            inset="sm"
            className="flex items-start gap-3 transition-colors duration-[var(--motion-quick)] hover:bg-[var(--surface-sunken)]"
          >
            <Icon icon={FileText} size="sm" className="mt-0.5 shrink-0 text-[var(--text-subtle)]" />
            <span className="min-w-0 flex-1">
              <Text level="secondary" tone="body">
                {evidence.finding}
              </Text>
              <Text level="caption" tone="muted" className="mt-0.5">
                {evidence.reportName} · {formatDate(evidence.reportDate)}
              </Text>
            </span>
          </Surface>
        )

        return (
          <li key={`${evidence.reportId}-${index}`}>
            {hrefFor ? (
              <Link
                to={hrefFor(evidence.reportId)}
                className="block rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              >
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        )
      })}
    </ul>
  )
}

/* ---- Change direction ---------------------------------------------------- */

const CHANGE = {
  progression: { icon: TrendingUp, tone: 'var(--status-danger-text)', label: 'Progression' },
  regression: { icon: TrendingDown, tone: 'var(--status-success-text)', label: 'Improvement' },
  stable: { icon: Minus, tone: 'var(--text-muted)', label: 'Stable' },
} as const

export type ChangeDirection = keyof typeof CHANGE

/** Direction is carried by icon shape and text, never color alone [00 §16.2]. */
export function ChangeIndicator({ direction }: { direction: ChangeDirection }) {
  const meta = CHANGE[direction]
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon icon={meta.icon} size="xs" className="shrink-0" style={{ color: meta.tone }} />
      <Text as="span" level="caption" tone="muted">
        {meta.label}
      </Text>
    </span>
  )
}
