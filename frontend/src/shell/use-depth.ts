import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { depthOf } from '@/routes/paths'
import type { Depth } from '@/routes/paths'
import { useEnvironmentStore } from '@/state/environment-store'
import type { TransitionDirection } from '@/state/environment-store'

/**
 * Keeps the environment's depth in step with the address.
 *
 * Depth is explicit state, not a route side-effect [blueprint 00 §3.2]: Focus opens
 * *above* a space without replacing it [04 §4], which a route swap cannot express.
 * The router reflects the depth stack; it does not own it.
 *
 * Direction is derived by comparing against the previous depth, because motion must
 * communicate where the user came from as well as where they are [00 §11.4].
 */

function directionBetween(from: Depth, to: Depth, sameSpace: boolean): TransitionDirection {
  if (to > from) return 'deeper'
  if (to < from) return 'shallower'
  // Same depth: moving between two patients is lateral movement, not a depth
  // change, and must feel continuous [09.3 §5].
  return sameSpace ? 'none' : 'lateral'
}

/** The stable identity of a space, so patient-to-patient reads as lateral. */
function spaceKeyOf(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] === 'patient' && segments[1]) return `patient:${segments[1]}`
  return segments[0] ?? 'entry'
}

interface Tracked {
  pathname: string
  depth: Depth
  spaceKey: string
  direction: TransitionDirection
}

/**
 * Returns the direction for the CURRENT render.
 *
 * DERIVED DURING RENDER, NOT IN AN EFFECT. This used to publish the direction
 * from `useEffect`, which runs after the first paint of the new space — so the
 * transition had already begun with the previous value, and every navigation
 * played the generic fade regardless of which way the user actually moved. The
 * render-phase update below is React's documented pattern for adjusting state
 * when a prop changes; it re-renders immediately, before anything is shown.
 *
 * The store is still written, because other surfaces read depth from it. It is
 * simply no longer the source the transition reads.
 */
export function useDepthSync(): TransitionDirection {
  const location = useLocation()
  const setDepth = useEnvironmentStore((s) => s.setDepth)

  const [tracked, setTracked] = useState<Tracked>(() => {
    const depth = depthOf(location.pathname)
    // The shell does not exist at Depth 0 — Entry and sign-in render outside
    // it — so on the very first render there is no previous render to compare
    // against. The store is module-level and outlives the shell, so it still
    // holds the depth the user came from. Without this, signing in always
    // reported 'none' and played the generic fade instead of the descent.
    const priorDepth = useEnvironmentStore.getState().depth
    return {
      pathname: location.pathname,
      depth,
      spaceKey: spaceKeyOf(location.pathname),
      direction: directionBetween(priorDepth, depth, false),
    }
  })

  if (tracked.pathname !== location.pathname) {
    const depth = depthOf(location.pathname)
    const spaceKey = spaceKeyOf(location.pathname)
    setTracked({
      pathname: location.pathname,
      depth,
      spaceKey,
      direction: directionBetween(tracked.depth, depth, tracked.spaceKey === spaceKey),
    })
  }

  useEffect(() => {
    setDepth(tracked.depth, tracked.direction)
  }, [tracked, setDepth])

  return tracked.direction
}
