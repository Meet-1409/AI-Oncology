import type { ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Control, Icon } from '@/components/primitives'
import { SpaceTransition } from '@/components/motion'
import { useEnvironmentStore } from '@/state/environment-store'
import { useDepthSync } from './use-depth'
import { useContinuousReturn } from './use-continuous-return'
import { useSpaceArrival } from './use-space-arrival'

/**
 * The application shell — the permanent structure of the environment.
 *
 * Everything the user sees lives inside this. The shell owns depth, motion
 * orchestration and the persistent regions; it owns no clinical content.
 *
 * Persistent regions are SLOTS rather than fixed components. Identity, Signals and
 * the Intent Bar exist at every depth [blueprint 01 §1.3], but what they contain
 * depends on the session and the current space — so spaces supply the content and
 * the shell guarantees the position. This is what lets the shell be complete now,
 * before the features that fill it exist.
 *
 * There is deliberately no sidebar and no menu bar: a permanent list of links
 * implies a flat set of equally-available destinations, which contradicts a depth
 * model where what is reachable depends on where you are [00 §10.5].
 */

export interface AppShellProps {
  /** Current user identity. Always visible — the primary "who am I" cue. */
  identity?: ReactNode
  /** Signals surface. Arrives without interrupting clinical work [04 §20]. */
  signals?: ReactNode
  /** Intent Bar trigger. Constant-time jump from anywhere [04 §5]. */
  intent?: ReactNode
  /**
   * Context for the current space — the current Patient Case when inside one.
   * Depth and current Patient Case must always be identifiable [03 §23].
   */
  context?: ReactNode
}

export function AppShell({ identity, signals, intent, context }: AppShellProps) {
  const location = useLocation()
  const direction = useEnvironmentStore((s) => s.direction)

  // Keep depth in step with the address, bind Continuous Return globally, and
  // put every arrival at the top of the space it arrived at.
  useDepthSync()
  const ascend = useContinuousReturn()
  useSpaceArrival()

  const depth = useEnvironmentStore((s) => s.depth)

  return (
    <div className="flex min-h-svh flex-col bg-[var(--surface-base)]">
      {/* Skip link: keyboard users must not traverse the persistent regions to
          reach content on every navigation [00 §16.1]. */}
      <a
        href="#space-content"
        className={cn(
          'sr-only focus:not-sr-only',
          'focus:absolute focus:left-4 focus:top-4 focus:z-[60]',
          'focus:rounded-md focus:bg-[var(--surface-raised)] focus:px-4 focus:py-2',
          'focus:shadow-overlay focus:outline-2 focus:outline-offset-2 focus:outline-[var(--focus-ring)]',
        )}
      >
        Skip to content
      </a>

      {/* Persistent region. Quiet, low, and never a navigation menu. */}
      <div
        className={cn(
          'sticky top-0 z-30 flex items-center gap-3 px-4 py-3 sm:px-6',
          'border-b border-[var(--border-subtle)]',
          'bg-[color-mix(in_srgb,var(--surface-base)_88%,transparent)] backdrop-blur-md',
        )}
      >
        {/* The way back, made visible.
            Continuous Return is bound to Escape [04 §5], and a keyboard shortcut
            nobody can see is not a way back for a patient on a tablet. The same
            single action, in the place the eye already looks for it, appearing
            only where there is somewhere to ascend to. */}
        {depth > 1 && (
          <Control
            size="icon"
            intent="quiet"
            onClick={ascend}
            aria-label="Back"
            title="Back (Esc)"
          >
            <Icon icon={ArrowLeft} size="sm" />
          </Control>
        )}
        {context}
        <div className="flex-1" />
        {intent}
        {signals}
        {identity}
      </div>

      <main id="space-content" className="flex flex-1 flex-col">
        <SpaceTransition
          direction={direction}
          transitionKey={location.pathname}
          className="flex flex-1 flex-col"
        >
          {/* Nested routes mean a parent space stays mounted while a Focus layer
              renders above it — the mechanism behind "Focus never replaces the
              space behind it" [04 §4]. */}
          <Outlet />
        </SpaceTransition>
      </main>
    </div>
  )
}
