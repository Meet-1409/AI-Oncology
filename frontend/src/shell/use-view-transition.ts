import { useCallback } from 'react'
import { useReducedMotion } from '@/components/motion'

/**
 * Shared element continuity.
 *
 * "The element selected transforms into the space entered" [04 §6] is the core
 * transition contract. Implemented with the native View Transitions API: the
 * browser captures the old and new states and interpolates elements that share a
 * `view-transition-name`, across different DOM trees.
 *
 * Degradation is total and safe. Where the API is unavailable, or the user prefers
 * reduced motion, the update applies immediately with no animation — which is
 * exactly the documented reduced-motion behaviour, and loses no information
 * [00 §11.9].
 */

/**
 * The DOM lib declares startViewTransition unconditionally, but it is genuinely
 * absent in some browsers, so it is probed at runtime rather than trusted.
 */
export function supportsViewTransitions(): boolean {
  if (typeof document === 'undefined') return false
  return typeof document.startViewTransition === 'function'
}

/**
 * Runs a state update inside a view transition when possible.
 *
 * The callback must perform the navigation or state change synchronously; the
 * browser snapshots the DOM before and after it runs.
 */
export function useViewTransition() {
  const reduced = useReducedMotion()

  return useCallback(
    (update: () => void) => {
      if (reduced || !supportsViewTransitions()) {
        update()
        return
      }
      document.startViewTransition(update)
    },
    [reduced],
  )
}

/**
 * Assigns a shared element name.
 *
 * The same name on the origin element and its destination is what tells the
 * browser they are the same object moving through the environment. Names must be
 * unique within a single document state.
 */
export function sharedElement(name: string): { style: { viewTransitionName: string } } {
  return { style: { viewTransitionName: name } }
}

/** Canonical shared element names, so origin and destination cannot disagree. */
export const sharedNames = {
  patient: (patientId: string) => `patient-${patientId}`,
  report: (reportId: string) => `report-${reportId}`,
  event: (eventId: string) => `event-${eventId}`,
  task: (taskId: string) => `task-${taskId}`,
  note: (noteId: string) => `note-${noteId}`,
} as const
