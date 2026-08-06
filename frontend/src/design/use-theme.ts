import { useEffect } from 'react'

/**
 * Applies the appearance to the document.
 *
 * ONE THEME, BY DECISION. This product is a lit body in a dark volume — the
 * Entry, the Digital Twin and every space between them are the same room seen
 * from different distances. A light mode made that room a different room
 * halfway through, and the whole identity ("colour means disease, and the only
 * lit thing is the body") depends on the surround staying dark. So the theme is
 * fixed rather than preferred, and the toggle is gone.
 *
 * The token layer keeps its light values. They are what the flat write-surfaces
 * were built against and what a future high-contrast or print mode would start
 * from; nothing reads them today.
 *
 * `color-scheme` is set alongside `data-theme` so the browser's own furniture —
 * form controls, scrollbars, the flash of background before first paint —
 * follows too. Without it a dark application keeps white scrollbars and white
 * autofill, which is the detail that gives away a theme applied only in CSS.
 */
export function useTheme(): void {
  useEffect(() => {
    const root = document.documentElement
    root.dataset['theme'] = 'dark'
    root.style.colorScheme = 'dark'
  }, [])
}
