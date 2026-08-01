import { useEffect, useState } from 'react'
import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import type { TransitionDirection } from '@/state/environment-store'

/**
 * Entering and leaving a space.
 *
 * Transitions are spatial: entering uses zoom-in, leaving uses zoom-out [04 §6],
 * and direction encodes depth so the user always knows which way they moved
 * [00 §11.4].
 *
 * Only transform and opacity animate. Animating layout-affecting properties in a
 * continuous transition is what breaks the 60fps target [00 §13.5].
 *
 * Under reduced motion the duration token resolves to 0ms and the space simply
 * appears — spatial transitions become immediate cross-fades [04 §6], losing no
 * information [00 §11.9].
 */

/** The state a space animates *from*, by direction of travel. */
const ENTER_FROM: Record<TransitionDirection, string> = {
  // Arriving deeper: the space grows into place, as though moving toward it.
  deeper: 'scale-[0.985] opacity-0',
  // Returning outward: the space settles back from slightly beyond.
  shallower: 'scale-[1.012] opacity-0',
  // Lateral movement between peers carries no depth cue [09.3 §5].
  lateral: 'opacity-0',
  none: 'opacity-0',
}

export interface SpaceTransitionProps extends HTMLAttributes<HTMLDivElement> {
  /** Direction of travel, from the environment store. */
  direction: TransitionDirection
  /** Distinguishes one space from the next so the animation replays. */
  transitionKey: string
}

function SpaceTransitionInner({
  direction,
  className,
  children,
  ...props
}: Omit<SpaceTransitionProps, 'transitionKey'>) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    // Next frame, so the browser paints the "from" state before transitioning.
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      className={cn(
        'transition-[opacity,transform] duration-[var(--motion-spatial)]',
        'ease-[var(--motion-ease-enter)] will-change-[transform,opacity]',
        entered ? 'scale-100 opacity-100' : ENTER_FROM[direction],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SpaceTransition({ transitionKey, ...props }: SpaceTransitionProps) {
  // Remounting on key change is what makes the enter animation replay for the
  // next space rather than only on first render.
  return <SpaceTransitionInner key={transitionKey} {...props} />
}
