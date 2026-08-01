import type { HTMLAttributes, ReactNode } from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Status indication.
 *
 * The single most important rule in this file: status is NEVER communicated by
 * color alone [00 §16.2]. The text is not optional decoration next to a colored
 * dot — the text IS the status, and the color reinforces it.
 *
 * This is enforced structurally: `children` is required, so a color-only status
 * indicator cannot be constructed.
 *
 * Applies to report processing status [09.4 §15], task status and priority
 * [09.8 §8], note visibility [09.9 §5] and timeline event categories [09.5 §8].
 */

const indicatorVariants = cva(
  [
    'inline-flex items-center gap-1.5 whitespace-nowrap',
    'rounded-full border px-2.5 py-0.5 text-caption font-medium',
  ],
  {
    variants: {
      tone: {
        neutral: [
          'bg-[var(--status-neutral-surface)] text-[var(--status-neutral-text)]',
          'border-[var(--status-neutral-border)]',
        ],
        accent: 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent-border)]',
        success: [
          'bg-[var(--status-success-surface)] text-[var(--status-success-text)]',
          'border-[var(--status-success-border)]',
        ],
        warning: [
          'bg-[var(--status-warning-surface)] text-[var(--status-warning-text)]',
          'border-[var(--status-warning-border)]',
        ],
        danger: [
          'bg-[var(--status-danger-surface)] text-[var(--status-danger-text)]',
          'border-[var(--status-danger-border)]',
        ],
        info: [
          'bg-[var(--status-info-surface)] text-[var(--status-info-text)]',
          'border-[var(--status-info-border)]',
        ],
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export type StatusTone = NonNullable<VariantProps<typeof indicatorVariants>['tone']>

export interface StatusIndicatorProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof indicatorVariants> {
  /** Required. The status must always be readable as text [00 §16.2]. */
  children: ReactNode
  /** Adds a shape cue alongside color, for a second non-text channel. */
  dot?: boolean
}

export function StatusIndicator({
  tone,
  dot = false,
  children,
  className,
  ...props
}: StatusIndicatorProps) {
  return (
    <span className={cn(indicatorVariants({ tone }), className)} {...props}>
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
