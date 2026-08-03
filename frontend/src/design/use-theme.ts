import { useEffect } from 'react'
import { usePreferencesStore } from '@/state/preferences-store'
import type { ThemePreference } from '@/state/preferences-store'

/**
 * Applies the theme preference to the document [09.10 §8].
 *
 * Written to `data-theme` on the root element, which is where the dark
 * semantic layer in tokens.css is scoped. Every component consumes semantic
 * tokens, so this one attribute retints the entire application — no component
 * knows a theme exists, and none has to.
 *
 * `color-scheme` is set alongside it so the browser's own furniture — form
 * controls, scrollbars, the flash of background before first paint — follows
 * too. Without it a dark application keeps white scrollbars and white
 * autofill, which is the detail that gives away a theme applied only in CSS.
 */
export function useTheme(): void {
  const theme = usePreferencesStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement

    const apply = (resolved: 'light' | 'dark') => {
      root.dataset['theme'] = resolved
      root.style.colorScheme = resolved
    }

    if (theme !== 'system') {
      apply(theme)
      return
    }

    // Following the system means following it as it changes, not only as it was
    // when the application started.
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => apply(query.matches ? 'dark' : 'light')
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [theme])
}

/** Labels for the theme preference, for the Account space. */
export const THEME_LABEL: Readonly<Record<ThemePreference, string>> = {
  dark: 'Dark',
  light: 'Light',
  system: 'Match my device',
}
