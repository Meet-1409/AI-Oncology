import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * User preferences [09.10 §8].
 *
 * Reduced motion is deliberately absent: it follows the operating system setting
 * automatically and is not a preference the user must discover here [09.10 §8].
 */

export type ThemePreference = 'light' | 'dark' | 'system'
export type DateFormat = 'dd-mmm-yyyy' | 'mm-dd-yyyy'
export type TimeFormat = '12h' | '24h'

export interface PreferencesState {
  theme: ThemePreference
  language: string
  dateFormat: DateFormat
  timeFormat: TimeFormat
  timeZone: string

  setTheme: (theme: ThemePreference) => void
  setLanguage: (language: string) => void
  setDateFormat: (dateFormat: DateFormat) => void
  setTimeFormat: (timeFormat: TimeFormat) => void
  setTimeZone: (timeZone: string) => void
}

function detectTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      // Dark by default. The Entry is a lit volume in darkness and the Body is
      // a lit volume in darkness; a light application between them reads as a
      // different product [04 §27]. Light and system remain available [09.10 §8].
      theme: 'dark',
      language: 'en',
      dateFormat: 'dd-mmm-yyyy',
      timeFormat: '24h',
      timeZone: detectTimeZone(),

      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setDateFormat: (dateFormat) => set({ dateFormat }),
      setTimeFormat: (timeFormat) => set({ timeFormat }),
      setTimeZone: (timeZone) => set({ timeZone }),
    }),
    { name: 'ao.preferences' },
  ),
)
