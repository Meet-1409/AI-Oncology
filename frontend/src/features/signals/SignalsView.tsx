import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Bell, CheckCheck, ListChecks, Sparkles, StickyNote, UploadCloud } from 'lucide-react'
import type { IconComponent } from '@/components/primitives'
import { Control, Icon, Text } from '@/components/primitives'
import { EmptyState, LoadingSurface } from '@/components/patterns'
import { Reveal } from '@/components/motion'
import { useMarkAllSignalsRead, useMarkSignalRead, useSignals } from '@/data/queries'
import { formatRelativeTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { NotificationCategory } from '@/types'

/**
 * Signals (Notifications).
 *
 * Short, categorised and dismissible [04 §20]. Selecting a Signal is a navigation
 * action — it moves the user directly into the relevant space.
 *
 * Signals never interrupt clinical work: they are announced politely to assistive
 * technology, never assertively, so a Signal cannot cut across a doctor reading
 * clinical information.
 */

const CATEGORY_ICON: Record<NotificationCategory, IconComponent> = {
  'task-assigned': ListChecks,
  'task-completed': ListChecks,
  'report-uploaded': UploadCloud,
  'note-added': StickyNote,
  'ai-processed': Sparkles,
  system: AlertTriangle,
}

export function SignalsView({ className }: { className?: string }) {
  const navigate = useNavigate()
  const { data, isLoading } = useSignals()
  const markRead = useMarkSignalRead()
  const markAllRead = useMarkAllSignalsRead()

  const signals = data?.items ?? []
  const unread = signals.filter((signal) => !signal.read).length

  if (isLoading) {
    return <LoadingSurface lines={3} label="Loading notifications" className={className} />
  }

  if (signals.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="You're up to date"
        description="Updates about tasks, uploads and notes appear here."
        className={className}
      />
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {unread > 0 && (
        <div className="flex items-center justify-between gap-3">
          <Text level="caption" tone="muted">
            {unread} unread
          </Text>
          <Control intent="quiet" size="sm" onClick={() => markAllRead.mutate()}>
            <Icon icon={CheckCheck} size="xs" />
            Mark all as read
          </Control>
        </div>
      )}

      <ul className="divide-y divide-[var(--border-subtle)]" aria-live="polite">
        {signals.map((signal, index) => (
          <li key={signal.id}>
            <Reveal index={index}>
            <button
              type="button"
              onClick={() => {
                markRead.mutate(signal.id)
                if (signal.link) navigate(signal.link)
              }}
              className={cn(
                'flex w-full items-start gap-3 px-2 py-3 text-left',
                'transition-colors duration-[var(--motion-quick)] hover:bg-[var(--surface-sunken)]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
              )}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-md',
                  signal.read ? 'bg-[var(--surface-sunken)]' : 'bg-[var(--accent-subtle)]',
                )}
              >
                <Icon
                  icon={CATEGORY_ICON[signal.category]}
                  size="xs"
                  className={signal.read ? 'text-[var(--text-subtle)]' : 'text-[var(--accent)]'}
                />
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <Text
                    as="span"
                    level="secondary"
                    tone="primary"
                    weight={signal.read ? 'regular' : 'medium'}
                  >
                    {signal.title}
                  </Text>
                  {!signal.read && (
                    <>
                      <span aria-hidden className="size-1.5 rounded-full bg-[var(--accent)]" />
                      <span className="sr-only">(unread)</span>
                    </>
                  )}
                </span>
                <Text level="caption" tone="muted">
                  {signal.message}
                </Text>
                <Text level="micro" tone="subtle" className="mt-0.5">
                  {formatRelativeTime(signal.date)}
                </Text>
              </span>
            </button>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  )
}
