import { useLayoutEffect, useRef, useState } from 'react'
import type { IconComponent } from '@/components/primitives'
import { Icon } from '@/components/primitives'
import { useReducedMotion } from '@/components/motion'
import { cn } from '@/lib/utils'

/**
 * A row of section tabs with a sliding active indicator.
 *
 * Patient Space's Contextual Orbit and Account's section tabs used to
 * hand-roll the same underline-tab markup separately, each swapping the
 * active border instantly rather than transitioning it — the single-source-
 * of-truth rule this codebase already states for itself is exactly why that
 * duplication belongs here instead, in one real, reusable implementation.
 */

export interface TabRailItem<T extends string> {
  id: T
  label: string
  icon?: IconComponent
  /** A secondary label shown in parentheses beside the primary one. */
  secondary?: string
}

export interface TabRailProps<T extends string> {
  items: readonly TabRailItem<T>[]
  active: T
  onSelect: (id: T) => void
  'aria-label': string
  className?: string
}

export function TabRail<T extends string>({
  items,
  active,
  onSelect,
  className,
  ...aria
}: TabRailProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef(new Map<T, HTMLButtonElement>())
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)
  const reduced = useReducedMotion()

  useLayoutEffect(() => {
    const container = containerRef.current
    const button = buttonRefs.current.get(active)
    if (!container || !button) return
    const containerRect = container.getBoundingClientRect()
    const buttonRect = button.getBoundingClientRect()
    setIndicator({ left: buttonRect.left - containerRect.left, width: buttonRect.width })
  }, [active, items])

  return (
    <nav className={cn('border-b border-[var(--border-subtle)]', className)} aria-label={aria['aria-label']}>
      <div ref={containerRef} className="relative">
        <ul className="-mb-px flex flex-wrap gap-1 overflow-x-auto">
          {items.map((item) => {
            const isActive = item.id === active
            return (
              <li key={item.id}>
                <button
                  ref={(el) => {
                    if (el) buttonRefs.current.set(item.id, el)
                    else buttonRefs.current.delete(item.id)
                  }}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap px-3.5 py-2.5',
                    'transition-colors duration-[var(--motion-quick)]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
                    isActive
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  )}
                >
                  {item.icon && <Icon icon={item.icon} size="sm" />}
                  <span className="text-secondary font-medium">{item.label}</span>
                  {item.secondary && (
                    <span className="text-caption text-[var(--text-subtle)]">({item.secondary})</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        {/* The sliding indicator. Position always reflects the active tab
            immediately — reduced motion removes only the transition between
            positions, never the correct end state [00 §11.9]. */}
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute bottom-0 h-0.5 bg-[var(--accent)]',
            !reduced &&
              'transition-[left,width] duration-[var(--motion-quick)] ease-[var(--motion-ease-standard)]',
          )}
          style={{
            left: indicator?.left ?? 0,
            width: indicator?.width ?? 0,
            opacity: indicator ? 1 : 0,
          }}
        />
      </div>
    </nav>
  )
}
