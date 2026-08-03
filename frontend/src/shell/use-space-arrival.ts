import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Arriving at a space puts you at the top of it.
 *
 * A browser keeps the scroll position across an in-app navigation, so opening a
 * patient from halfway down a list drops you halfway down their record — past
 * their name, past the Body, into the middle of something. It reads as a broken
 * page rather than as arriving somewhere.
 *
 * Scoped to the PATHNAME only. Selected organ, clinical date and comparison all
 * live in the query string because they modify the space in place rather than
 * navigating [00 §15.5]; scrolling on those would yank the page to the top every
 * time an oncologist scrubbed through time.
 *
 * The jump is instant rather than smoothed: a smooth scroll would run alongside
 * the spatial transition and the two would fight, and it would still be moving
 * after the space had finished arriving.
 */
export function useSpaceArrival(): void {
  const { pathname } = useLocation()
  const previous = useRef<string | null>(null)

  useEffect(() => {
    if (previous.current === pathname) return
    const isFirstRender = previous.current === null
    previous.current = pathname
    // Not on first render: a deep link may point into a space the browser has
    // already restored a position for, and overriding that loses the place the
    // user actually asked for.
    if (isFirstRender) return
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname])
}
