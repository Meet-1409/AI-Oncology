import type { ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import type { IconComponent } from '@/components/primitives'
import { Control, Icon, Surface, Text } from '@/components/primitives'
import { cn } from '@/lib/utils'

/**
 * System states.
 *
 * Every empty space explains why it is empty and offers the next action where
 * appropriate [04 §22]. Every error explains the problem, explains what to do
 * next, avoids technical language and allows recovery [04 §23].
 *
 * These live in the design system so no space invents its own phrasing or layout.
 */

export interface EmptyStateProps {
  icon: IconComponent
  title: string
  /** Why the space is empty — never a bare "no results". */
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl px-6 py-14 text-center',
        'border border-dashed border-[var(--border-default)] bg-[var(--surface-base)]',
        className,
      )}
    >
      {/* The mark breathes.
          There are seven of these across the application, and a patient with
          nothing recorded yet sees several at once. Identical frozen blocks
          read as an interface that has stopped working rather than one that is
          waiting — and this is the first thing a newly diagnosed patient sees.
          One slow pulse on the same rhythm as the Digital Twin's breath ties
          the empty state to the product's own motif and says "ready", not
          "broken". Stops entirely under reduced motion. */}
      <span
        className={cn(
          'relative flex size-11 items-center justify-center rounded-full',
          'bg-[var(--surface-sunken)]',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 rounded-full border border-[var(--border-default)]',
            'motion-safe:animate-[empty-breathe_4.6s_ease-in-out_infinite]',
          )}
        />
        <Icon icon={icon} size="md" className="text-[var(--text-subtle)]" />
      </span>
      <div className="space-y-1">
        <Text level="subheading" tone="primary">
          {title}
        </Text>
        <Text level="secondary" tone="muted" measure="narrow" className="mx-auto">
          {description}
        </Text>
      </div>
      {action}
    </div>
  )
}

export interface ErrorStateProps {
  title: string
  description: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ title, description, onRetry, className }: ErrorStateProps) {
  return (
    <Surface
      elevation="raised"
      radius="lg"
      inset="lg"
      role="alert"
      className={cn('border border-[var(--status-danger-border)]', className)}
    >
      <div className="flex items-start gap-3">
        <Icon icon={AlertCircle} size="md" className="mt-0.5 text-[var(--status-danger-text)]" />
        <div className="min-w-0 flex-1 space-y-1">
          <Text level="subheading" tone="primary">
            {title}
          </Text>
          <Text level="secondary" tone="muted" measure="comfortable">
            {description}
          </Text>
          {onRetry && (
            <Control intent="secondary" size="sm" onClick={onRetry} className="mt-3">
              <Icon icon={RefreshCw} size="xs" />
              Try again
            </Control>
          )}
        </div>
      </div>
    </Surface>
  )
}

/**
 * Loading.
 *
 * A blank screen is never displayed [00 §13.7]. The structure of a space appears
 * before its detail, so nothing shifts when content arrives [04 §21].
 */
export function LoadingSurface({
  lines = 3,
  className,
  label = 'Loading',
}: {
  lines?: number
  className?: string
  label?: string
}) {
  return (
    <div className={cn('space-y-3', className)} role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          aria-hidden
          className="h-4 animate-pulse rounded-sm bg-[var(--surface-sunken)]"
          style={{ width: `${100 - index * 12}%` }}
        />
      ))}
    </div>
  )
}
