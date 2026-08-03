import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Icon } from '@/components/primitives'
import { cn } from '@/lib/utils'

/**
 * Cinematic controls — the Entry only [04 §14].
 *
 * Fully-rounded actions and tiny tracked-out edge labels. Both reference
 * compositions use exactly this pair: a pill or circle to act, and a 10px
 * uppercase label to orient. The clinical Control primitive stays rectangular
 * and sized for repeated daily use; this is a different job.
 *
 * Every control here is a real link or button with a visible focus ring and a
 * text label. None of them communicates anything by shape alone.
 */

export interface CinematicActionProps {
  to: string
  children: ReactNode
  /** Solid reads as the primary way forward; outline as the alternative. */
  variant?: 'solid' | 'outline'
  className?: string
}

export function CinematicAction({
  to,
  children,
  variant = 'solid',
  className,
}: CinematicActionProps) {
  return (
    <Link
      to={to}
      className={cn(
        'group inline-flex items-center gap-3 rounded-full py-2 pl-7 pr-2',
        'text-secondary font-medium',
        'transition-colors duration-[var(--motion-quick)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cinema-ink)]',
        variant === 'solid'
          ? 'bg-[var(--cinema-ink)] text-[var(--cinema-void)] hover:bg-white'
          : 'border border-[var(--cinema-line-strong)] text-[var(--cinema-ink)] hover:border-[var(--cinema-ink)]',
        className,
      )}
    >
      {children}
      {/* The circle is the reference's signature: the action ends in a disc that
          the arrow travels across on hover. */}
      <span
        aria-hidden
        className={cn(
          'flex size-9 items-center justify-center overflow-hidden rounded-full',
          variant === 'solid' ? 'bg-[var(--cinema-void)]/10' : 'bg-[var(--cinema-ink)]/10',
        )}
      >
        <Icon
          icon={ArrowRight}
          size="sm"
          className={cn(
            'transition-transform duration-[var(--motion-reveal)] ease-[var(--motion-ease-enter)]',
            'group-hover:translate-x-5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0',
          )}
        />
      </span>
    </Link>
  )
}

/**
 * An anchor-style action, for movement within the Entry rather than out of it.
 */
export function CinematicJump({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <a
      href={href}
      className={cn(
        'group inline-flex items-center gap-3 rounded-full border border-[var(--cinema-line-strong)]',
        'py-2 pl-7 pr-2 text-secondary font-medium text-[var(--cinema-ink)]',
        'transition-colors duration-[var(--motion-quick)] hover:border-[var(--cinema-ink)]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cinema-ink)]',
        className,
      )}
    >
      {children}
      <span
        aria-hidden
        className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-[var(--cinema-ink)]/10"
      >
        <Icon
          icon={ArrowRight}
          size="sm"
          className={cn(
            'rotate-90 transition-transform duration-[var(--motion-reveal)] ease-[var(--motion-ease-enter)]',
            'group-hover:translate-y-5 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0',
          )}
        />
      </span>
    </a>
  )
}

/**
 * A tiny tracked-out label.
 *
 * Used at the edges of the frame and above headings. It is the quiet half of the
 * type contrast that makes the enormous half work.
 */
export function EdgeLabel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span className={cn('block text-edge uppercase text-[var(--cinema-ink)]/45', className)}>
      {children}
    </span>
  )
}

/** A numbered index, as used beside the steps in the reference compositions. */
export function Ordinal({ value }: { value: number }) {
  return (
    <span
      aria-hidden
      className="text-edge tabular-nums text-[var(--cinema-ink)]/35"
    >
      {String(value).padStart(2, '0')}
    </span>
  )
}
