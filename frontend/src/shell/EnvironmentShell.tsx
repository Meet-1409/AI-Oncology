import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Activity, Bell, LogOut, UserRound } from 'lucide-react'
import { Control, Icon, StatusIndicator, Text } from '@/components/primitives'
import { FocusLayer } from '@/components/patterns'
import { SignalsView } from '@/features/signals'
import { useSession, useSignOut, useSignals } from '@/data/queries'
import { useSessionStore } from '@/state/session-store'
import { paths } from '@/routes/paths'
import { AppShell } from './AppShell'
import { IntentBar } from './IntentBar'

/**
 * The authenticated environment.
 *
 * Supplies the shell's persistent region slots with real content and guards every
 * space behind a session. Authorization itself is enforced by the backend
 * [02 §7]; this guard is a second lock and a navigation convenience, never the
 * only protection.
 */
export function EnvironmentShell() {
  const { isAuthenticated } = useSessionStore()
  const session = useSession()
  const signOut = useSignOut()
  const navigate = useNavigate()
  const { data: signalData } = useSignals()

  const [signalsOpen, setSignalsOpen] = useState(false)
  const [signOutOpen, setSignOutOpen] = useState(false)

  if (!isAuthenticated) {
    return <Navigate to={paths.enter} replace />
  }

  const unread = (signalData?.items ?? []).filter((signal) => !signal.read).length
  const user = session.data?.user

  return (
    <>
      <AppShell
        context={
          <Link
            to={paths.home}
            className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-[var(--accent)]">
              <Icon icon={Activity} size="xs" className="text-[var(--text-on-accent)]" />
            </span>
            <Text as="span" level="caption" tone="primary" weight="medium">
              AI Oncology
            </Text>
          </Link>
        }
        signals={
          <Control
            size="icon"
            intent="quiet"
            onClick={() => setSignalsOpen(true)}
            aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
            className="relative"
          >
            <Icon icon={Bell} size="sm" />
            {unread > 0 && (
              <span
                aria-hidden
                className="signal-dot absolute right-2 top-2 size-2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--surface-base)]"
              />
            )}
          </Control>
        }
        identity={
          <>
            <Control
              size="icon"
              intent="quiet"
              onClick={() => navigate(paths.account)}
              aria-label={user ? `Account — ${user.name}` : 'Account'}
            >
              <Icon icon={UserRound} size="sm" />
            </Control>
            <Control
              size="icon"
              intent="quiet"
              onClick={() => setSignOutOpen(true)}
              aria-label="Sign out"
            >
              <Icon icon={LogOut} size="sm" />
            </Control>
          </>
        }
        intent={<IntentBar />}
      />

      {/* Signals open in place and never interrupt clinical work [04 §20]. */}
      <FocusLayer
        open={signalsOpen}
        onOpenChange={setSignalsOpen}
        title="Notifications"
        eyebrow={
          unread > 0 ? <StatusIndicator tone="accent">{unread} unread</StatusIndicator> : undefined
        }
      >
        <SignalsView />
      </FocusLayer>

      {/* Signing out is confirmed, then ascends out of the environment [03 §22]. */}
      <FocusLayer
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title="Sign out?"
        description="You will need to sign in again to reach patient information."
        footer={
          <>
            <Control intent="quiet" onClick={() => setSignOutOpen(false)}>
              Stay signed in
            </Control>
            <Control
              intent="danger"
              onClick={() => {
                signOut()
                navigate(paths.entry)
              }}
            >
              Sign out
            </Control>
          </>
        }
      >
        <Text level="secondary" tone="muted">
          Any work you have saved is kept. Nothing is lost by signing out.
        </Text>
      </FocusLayer>
    </>
  )
}
