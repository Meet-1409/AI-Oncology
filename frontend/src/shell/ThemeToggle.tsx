import { Moon, Sun } from 'lucide-react'
import { Control, Icon } from '@/components/primitives'
import { usePreferencesStore } from '@/state/preferences-store'

/**
 * Light/dark, one click away.
 *
 * The full preference (including "match my device") still lives in Account,
 * but a toggle this central to how the whole product looks shouldn't require
 * a trip to settings to reach [00 §10.6]. Toggling here always sets an
 * explicit preference — the deliberate choice overrides "system" the same
 * way choosing a theme in Account would.
 */
export function ThemeToggle() {
  const theme = usePreferencesStore((s) => s.theme)
  const setTheme = usePreferencesStore((s) => s.setTheme)

  const resolvedDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches)

  return (
    <Control
      size="icon"
      intent="quiet"
      onClick={() => setTheme(resolvedDark ? 'light' : 'dark')}
      aria-label={resolvedDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={resolvedDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      <Icon icon={resolvedDark ? Sun : Moon} size="sm" />
    </Control>
  )
}
