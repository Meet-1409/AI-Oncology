import { useEffect, useRef } from 'react'
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

export function useDepthSync(): void {
  const location = useLocation()
  const setDepth = useEnvironmentStore((s) => s.setDepth)
  const previous = useRef<{ depth: Depth; spaceKey: string } | null>(null)

  useEffect(() => {
    const depth = depthOf(location.pathname)
    const spaceKey = spaceKeyOf(location.pathname)
    const prior = previous.current

    const direction: TransitionDirection = prior
      ? directionBetween(prior.depth, depth, prior.spaceKey === spaceKey)
      : 'none'

    previous.current = { depth, spaceKey }
    setDepth(depth, direction)
  }, [location.pathname, setDepth])
}
