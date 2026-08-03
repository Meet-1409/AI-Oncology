/**
 * The shell — depth, motion orchestration and persistent regions.
 *
 * The shell owns where things are; it never owns clinical content.
 */

export { AppShell } from './AppShell'
export type { AppShellProps } from './AppShell'
export { useDepthSync } from './use-depth'
export { useSpaceArrival } from './use-space-arrival'
export { useContinuousReturn } from './use-continuous-return'
export {
  useViewTransition,
  supportsViewTransitions,
  sharedElement,
  sharedNames,
} from './use-view-transition'
