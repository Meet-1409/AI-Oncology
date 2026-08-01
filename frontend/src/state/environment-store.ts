import { create } from 'zustand'
import type { Depth } from '@/routes/paths'

/**
 * Environment state — where the user is inside the continuous environment.
 *
 * Deliberately NOT persisted: this describes the current session's position, and
 * restoring a stale depth stack on reload would misrepresent where the user is.
 *
 * Depth is explicit state rather than a route side-effect, because Focus opens
 * *above* a space without replacing it [04 §4] — behaviour a route swap cannot
 * express. The router reflects this stack; it does not own it.
 */

export type TransitionDirection = 'deeper' | 'shallower' | 'lateral' | 'none'

export interface EnvironmentState {
  /** Current depth level, 0-3. */
  depth: Depth
  /** Direction of the transition in flight, used to choose the motion. */
  direction: TransitionDirection
  /** True while a spatial transition is running. */
  isTransitioning: boolean
  /** Open state of the Intent Bar, which exists at every depth. */
  isIntentBarOpen: boolean

  setDepth: (depth: Depth, direction: TransitionDirection) => void
  setTransitioning: (isTransitioning: boolean) => void
  openIntentBar: () => void
  closeIntentBar: () => void
  toggleIntentBar: () => void
}

export const useEnvironmentStore = create<EnvironmentState>()((set) => ({
  depth: 0,
  direction: 'none',
  isTransitioning: false,
  isIntentBarOpen: false,

  setDepth: (depth, direction) => set({ depth, direction }),
  setTransitioning: (isTransitioning) => set({ isTransitioning }),
  openIntentBar: () => set({ isIntentBarOpen: true }),
  closeIntentBar: () => set({ isIntentBarOpen: false }),
  toggleIntentBar: () => set((s) => ({ isIntentBarOpen: !s.isIntentBarOpen })),
}))
