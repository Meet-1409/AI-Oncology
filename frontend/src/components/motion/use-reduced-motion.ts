import { useSyncExternalStore } from 'react'
import { prefersReducedMotion, watchReducedMotion } from '@/lib/capability'

/**
 * Live subscription to the operating system reduced-motion setting.
 *
 * Respecting this setting is mandatory [00 §11.9], and it must apply without a
 * reload — a user who enables it mid-session sees the change immediately.
 *
 * useSyncExternalStore rather than useEffect + useState so the value is correct on
 * first paint and cannot tear during concurrent rendering.
 */
/** Adapts the capability watcher to the zero-argument callback useSyncExternalStore expects. */
function subscribe(onStoreChange: () => void): () => void {
  return watchReducedMotion(() => onStoreChange())
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    prefersReducedMotion,
    // Server snapshot: assume reduced. Motion is an enhancement, so defaulting to
    // "no motion" can never produce a worse experience than the reverse.
    () => true,
  )
}
