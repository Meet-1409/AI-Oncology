import type { ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Icon } from '@/components/primitives/icon'
import { Text } from '@/components/primitives/text'

/**
 * Focus — Depth 3.
 *
 * A single report, event, task or note, opened in place above the space the user
 * is already in. Focus NEVER replaces the space behind it [04 §4]: the parent stays
 * mounted and visible, dimmed and receded, so the user never loses context.
 *
 * Built on Radix Dialog for focus trapping, Escape handling, scroll locking and
 * aria-modal — behaviour that must be correct by construction rather than
 * retrofitted [00 §16]. Focus moves into the layer on open and returns to the
 * originating element on close [blueprint 04 §3].
 */

export interface FocusLayerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Required: every Focus layer is announced by name to assistive technology. */
  title: string
  /** Optional supporting line beneath the title. */
  description?: string
  /** Shown in the header, before the title — status, date, category. */
  eyebrow?: ReactNode
  /** Actions pinned to the foot of the layer. */
  footer?: ReactNode
  children: ReactNode
  className?: string
}

export function FocusLayer({
  open,
  onOpenChange,
  title,
  description,
  eyebrow,
  footer,
  children,
  className,
}: FocusLayerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* The parent space stays visible through the scrim — it recedes, it does
            not disappear [04 §4]. */}
        <Dialog.Overlay
          className={cn(
            'ao-scrim fixed inset-0 z-40 bg-[var(--surface-scrim)] backdrop-blur-[3px]',
          )}
        />
        <Dialog.Content
          className={cn(
            'ao-panel fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col',
            'rounded-t-2xl bg-[var(--surface-raised)] shadow-focus',
            // On larger viewports Focus is a centred layer; on mobile it is a
            // full-width sheet, with the parent still behind [blueprint 04 §4.2].
            // Centring lives in the keyframes (see index.css) — a translate
            // utility here would be overwritten by the animation's transform.
            'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:max-h-[86vh] sm:w-[min(46rem,92vw)]',
            'sm:rounded-2xl',
            'will-change-[transform,opacity]',
            className,
          )}
        >
          <header className="flex items-start gap-4 border-b border-[var(--border-subtle)] px-6 py-5">
            <div className="min-w-0 flex-1">
              {eyebrow && <div className="mb-1.5 flex items-center gap-2">{eyebrow}</div>}
              <Dialog.Title asChild>
                <Text as="h2" level="heading" tone="primary">
                  {title}
                </Text>
              </Dialog.Title>
              {description && (
                <Dialog.Description asChild>
                  <Text level="secondary" tone="muted" measure="comfortable" className="mt-1">
                    {description}
                  </Text>
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close
              className={cn(
                'shrink-0 rounded-md p-2 text-[var(--text-subtle)]',
                'transition-colors duration-[var(--motion-quick)]',
                'hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
              )}
            >
              <Icon icon={X} size="sm" label="Close" />
            </Dialog.Close>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {footer && (
            <footer className="flex items-center justify-end gap-3 border-t border-[var(--border-subtle)] px-6 py-4">
              {footer}
            </footer>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
