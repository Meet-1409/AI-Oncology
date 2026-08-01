import { Bell, Command, UserRound } from 'lucide-react'
import { AppShell } from '@/shell'
import { Control, Icon, StatusIndicator, Text } from '@/components/primitives'

/**
 * Mounts the real AppShell around the showcase — DEVELOPMENT ONLY.
 *
 * The shell is production structure, but no production space exists to mount it in
 * until Feature 4. Rendering it here means the shell is genuinely exercised —
 * persistent regions, depth sync, Continuous Return and the skip link all run —
 * rather than shipped untested.
 *
 * The slot content below is illustrative only. Real identity, Signals and Intent
 * Bar content is supplied by the spaces that own that data.
 */
export function ShowcaseShell() {
  return (
    <AppShell
      context={
        <div className="flex min-w-0 items-center gap-2">
          <StatusIndicator tone="warning">Dev</StatusIndicator>
          <Text level="caption" tone="muted" truncate>
            Design System Showcase
          </Text>
        </div>
      }
      intent={
        <Control size="sm" intent="quiet" aria-label="Open intent bar">
          <Icon icon={Command} size="xs" />
          Search
        </Control>
      }
      signals={
        <Control size="icon" intent="quiet" aria-label="Signals">
          <Icon icon={Bell} size="sm" />
        </Control>
      }
      identity={
        <Control size="icon" intent="quiet" aria-label="Account">
          <Icon icon={UserRound} size="sm" />
        </Control>
      }
    />
  )
}
