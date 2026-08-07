import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { Icon, Text } from '@/components/primitives'
import { useIntegrityStore } from '@/state/integrity-store'
import { cn } from '@/lib/utils'

/**
 * State-level integrity notices — the one inverted surface in the product.
 *
 * WHY INVERTED AND NOT AMBER
 *
 * The conventional warning band is amber or red. Neither is available here:
 * `colour means disease` (BLUEPRINT 03 §7), so a warning hue on a screen whose
 * only red is a tumour would read as a clinical claim. Inversion carries the
 * same salience and costs no hue — and because nothing else in the product
 * inverts, it cannot be mistaken for chrome or for a finding.
 *
 * WHY IT CANNOT BE DISMISSED
 *
 * `CLAUDE.md` rule 5 requires synthetic findings to be shown, not footnoted.
 * There is no dismiss control — not disabled, not hidden, absent. The only
 * affordance is collapsing to a one-line strip, which is still on screen. The
 * full text returns on the next reload, because the store does not persist.
 */

export function IntegrityNotices({ className }: { className?: string }) {
  const notices = useIntegrityStore((s) => s.notices)
  const expanded = useIntegrityStore((s) => s.expanded)
  const collapse = useIntegrityStore((s) => s.collapse)
  const expand = useIntegrityStore((s) => s.expand)

  const list = Object.values(notices)

  // Announce only notices that arrive DURING the session. The band itself is
  // not a live region: it is present on load, and a live region would
  // re-announce it on every navigation, which is noise rather than safety.
  const [announcement, setAnnouncement] = useState('')
  const known = useRef<Set<string>>(new Set())

  useEffect(() => {
    const fresh = list.filter((notice) => !known.current.has(notice.id))
    for (const notice of list) known.current.add(notice.id)
    if (fresh.length > 0 && known.current.size > fresh.length) {
      setAnnouncement(fresh.map((notice) => notice.summary).join(' '))
    }
  }, [list])

  if (list.length === 0) return null

  return (
    <section
      role="region"
      aria-label="System notices"
      className={cn('ao-integrity bg-[var(--surface-inverse)]', className)}
    >
      <span aria-live="polite" className="sr-only">
        {announcement}
      </span>

      <ul className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        {list.map((notice) => {
          const isOpen = expanded[notice.id] ?? true
          return (
            <li
              key={notice.id}
              className="flex items-start gap-3 border-b border-black/10 py-2.5 last:border-0"
            >
              <Icon
                icon={AlertTriangle}
                size="sm"
                className="mt-0.5 shrink-0 text-[var(--text-on-inverse)]"
              />

              <div className="min-w-0 flex-1">
                <Text as="p" level="caption" tone="onInverse" weight="medium">
                  {notice.summary}
                </Text>

                {/* grid-template-rows 0fr -> 1fr animates to content height
                    without measuring it. Collapsed content is hidden from the
                    accessibility tree too, so a screen reader is not read a
                    paragraph the sighted reader cannot see. */}
                <div
                  className={cn(
                    'ao-integrity-detail grid',
                    isOpen ? 'grid-rows-[1fr] pt-1' : 'grid-rows-[0fr]',
                  )}
                >
                  <div className="overflow-hidden" aria-hidden={!isOpen}>
                    <Text as="p" level="caption" tone="onInverse" className="opacity-80">
                      {notice.detail}
                    </Text>
                  </div>
                </div>
              </div>

              {/* Collapse only. There is no dismiss — see the note above. */}
              <button
                type="button"
                onClick={() => (isOpen ? collapse(notice.id) : expand(notice.id))}
                aria-expanded={isOpen}
                className={cn(
                  'ao-integrity-toggle -m-1 shrink-0 rounded p-1',
                  'text-[var(--text-on-inverse)] opacity-70 transition-opacity',
                  'hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2',
                  'focus-visible:outline-[var(--text-on-inverse)]',
                )}
              >
                <span className="sr-only">
                  {isOpen ? 'Collapse this notice' : 'Read this notice in full'}
                </span>
                <Icon
                  icon={ChevronDown}
                  size="sm"
                  className={cn(
                    'transition-transform duration-[var(--motion-quick)]',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
