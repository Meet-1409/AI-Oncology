import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command, CornerDownLeft, Search, UserRound, Settings2, Home } from 'lucide-react'
import type { IconComponent } from '@/components/primitives'
import { Control, Icon, Text } from '@/components/primitives'
import { Reveal, useReducedMotion } from '@/components/motion'
import { usePatients } from '@/data/queries'
import { useEnvironmentStore } from '@/state/environment-store'
import { useSessionStore } from '@/state/session-store'
import { paths } from '@/routes/paths'
import { duration } from '@/design/theme'
import { cn } from '@/lib/utils'

/**
 * The Intent Bar.
 *
 * A single always-available input for expressing intent, including patient search
 * [04 §5]. It replaces menus, which is what makes "users must never be required to
 * remember where a feature is located" [00 §10.6] achievable — anything is a
 * constant-time jump from anywhere.
 *
 * Opened with Ctrl/Cmd+K [blueprint 01 §2.5]. It owns Escape while open, so
 * Continuous Return does not fire underneath it.
 */

interface Destination {
  id: string
  label: string
  detail?: string
  icon: IconComponent
  to: string
}

export function IntentBar() {
  const navigate = useNavigate()
  const isOpen = useEnvironmentStore((s) => s.isIntentBarOpen)
  const open = useEnvironmentStore((s) => s.openIntentBar)
  const close = useEnvironmentStore((s) => s.closeIntentBar)
  const role = useSessionStore((s) => s.role)

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const reduced = useReducedMotion()

  // Mounted for exactly as long as it takes to close, not an instant unmount —
  // this is the command surface the whole environment is judged by, and an
  // abrupt disappearance reads as a page change rather than a dismissal
  // [00 §11.6]. `shown` is the visual state; `rendered` is whether it exists
  // in the DOM at all, lagging one closing transition behind `isOpen`.
  const [rendered, setRendered] = useState(false)
  const [shown, setShown] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (isOpen) {
      window.clearTimeout(closeTimer.current)
      setRendered(true)
      // Mount in the closed visual state and flip open next frame — a CSS
      // transition never animates a property that starts already at its
      // destination value.
      const frame = requestAnimationFrame(() => setShown(true))
      return () => cancelAnimationFrame(frame)
    }
    setShown(false)
    const ms = reduced ? 0 : duration.reveal + 40
    closeTimer.current = setTimeout(() => setRendered(false), ms)
    return () => window.clearTimeout(closeTimer.current)
  }, [isOpen, reduced])

  // Patients are only fetched for oncologists; a patient searches their own
  // records only [09.1 §13].
  const { data } = usePatients()
  const items = data?.items

  const destinations = useMemo<Destination[]>(() => {
    const patients = role === 'oncologist' ? (items ?? []) : []

    const base: Destination[] = [
      { id: 'home', label: 'Home', detail: 'Your arrival space', icon: Home, to: paths.home },
      { id: 'account', label: 'Account', detail: 'Profile, security, preferences', icon: Settings2, to: paths.account },
    ]

    const patientEntries: Destination[] = patients.map((patient) => ({
      id: patient.id,
      label: patient.name,
      detail: `${patient.patientCode} · ${patient.primaryCancer}`,
      icon: UserRound,
      to: paths.patient(patient.id),
    }))

    const all = [...patientEntries, ...base]
    if (!query.trim()) return all.slice(0, 8)

    const q = query.toLowerCase()
    return all
      .filter(
        (entry) =>
          entry.label.toLowerCase().includes(q) ||
          (entry.detail ?? '').toLowerCase().includes(q),
      )
      .slice(0, 8)
  }, [role, items, query])

  // Global shortcut.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        open()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActive(0)
      // Focus after paint so the input is mounted.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  function go(destination: Destination) {
    close()
    navigate(destination.to)
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Escape') {
      // Owned here so Continuous Return does not also fire [blueprint 01 §2.5].
      event.stopPropagation()
      close()
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((n) => Math.min(n + 1, destinations.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((n) => Math.max(n - 1, 0))
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const destination = destinations[active]
      if (destination) go(destination)
    }
  }

  return (
    <>
      <Control
        size="sm"
        intent="quiet"
        onClick={open}
        aria-label="Open search and navigation"
        aria-keyshortcuts="Control+K Meta+K"
      >
        <Icon icon={Search} size="xs" />
        <span className="hidden sm:inline">Search</span>
        <span
          aria-hidden
          className="hidden items-center gap-0.5 rounded border border-[var(--border-default)] px-1 py-0.5 text-micro text-[var(--text-subtle)] sm:inline-flex"
        >
          <Icon icon={Command} size="xs" />K
        </span>
      </Control>

      {rendered && (
        <div
          className={cn(
            'fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]',
            'bg-[var(--surface-scrim)] backdrop-blur-[3px] transition-[opacity,backdrop-filter] duration-[var(--motion-reveal)]',
            'ease-[var(--motion-ease-standard)] motion-reduce:transition-none',
            shown ? 'opacity-100' : 'opacity-0',
          )}
          onClick={close}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search and navigation"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={onKeyDown}
            className={cn(
              'w-full max-w-lg overflow-hidden rounded-xl bg-[var(--surface-raised)] shadow-overlay',
              'transition-[opacity,transform] duration-[var(--motion-reveal)]',
              'ease-[var(--motion-ease-enter)] motion-reduce:transition-none',
              shown ? 'translate-y-0 scale-100 opacity-100' : '-translate-y-1 scale-[0.98] opacity-0',
            )}
          >
            <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4">
              <Icon icon={Search} size="sm" className="shrink-0 text-[var(--text-subtle)]" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setActive(0)
                }}
                placeholder={
                  role === 'oncologist'
                    ? 'Search patients, or jump to a destination'
                    : 'Jump to a destination'
                }
                aria-label="Search"
                aria-autocomplete="list"
                className="h-14 flex-1 bg-transparent text-body text-[var(--text-primary)] outline-none placeholder:text-[var(--text-subtle)]"
              />
            </div>

            {destinations.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Text level="secondary" tone="muted">
                  Nothing matched that search.
                </Text>
              </div>
            ) : (
              <ul role="listbox" aria-label="Results" className="max-h-80 overflow-y-auto p-1.5">
                {destinations.map((destination, index) => (
                  <li key={destination.id}>
                    <Reveal index={index}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={index === active}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => go(destination)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left',
                          index === active ? 'bg-[var(--accent-subtle)]' : 'hover:bg-[var(--surface-sunken)]',
                        )}
                      >
                        <Icon
                          icon={destination.icon}
                          size="sm"
                          className={index === active ? 'text-[var(--accent)]' : 'text-[var(--text-subtle)]'}
                        />
                        <span className="min-w-0 flex-1">
                          <Text as="span" level="secondary" tone="primary" weight="medium" truncate>
                            {destination.label}
                          </Text>
                          {destination.detail && (
                            <Text level="caption" tone="muted" truncate>
                              {destination.detail}
                            </Text>
                          )}
                        </span>
                        {index === active && (
                          <Icon icon={CornerDownLeft} size="xs" className="text-[var(--text-subtle)]" />
                        )}
                      </button>
                    </Reveal>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  )
}
