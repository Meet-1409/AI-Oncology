import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { TransitionDirection } from '@/state/environment-store'

/**
 * Travelling between spaces.
 *
 * Transitions are spatial: entering uses zoom-in, leaving uses zoom-out [04 §6],
 * and direction encodes depth so the user always knows which way they moved
 * [00 §11.4].
 *
 * BOTH SPACES ANIMATE AT ONCE. The space being left is held mounted and played
 * out while the arriving one plays in, overlapping in the same frame. This is
 * the difference between an application that feels continuous and one that
 * feels like separate pages: animating only the arrival leaves an empty frame
 * in between, and an empty frame is a page change however carefully it is
 * eased. It is what [04 §6] means by "sudden page changes must be avoided".
 *
 * Blur carries the depth. Scale on its own reads as an effect applied to a
 * page; scale together with focus reads as moving through space, because that
 * is what happens when a lens moves.
 *
 * Under reduced motion both layers collapse to an immediate cross-fade [04 §6]:
 * the leaving layer is not rendered and the arriving one is simply present. No
 * information is lost [00 §11.9].
 */

const ENTER: Record<TransitionDirection, string> = {
  deeper: 'animate-[space-enter-deeper_var(--motion-spatial)]',
  shallower: 'animate-[space-enter-shallower_var(--motion-spatial)]',
  lateral: 'animate-[space-enter-lateral_var(--motion-spatial)]',
  none: 'animate-[space-enter-fade_var(--motion-reveal)]',
}

const EXIT: Record<TransitionDirection, string> = {
  deeper: 'animate-[space-exit-deeper_var(--motion-spatial)]',
  shallower: 'animate-[space-exit-shallower_var(--motion-spatial)]',
  lateral: 'animate-[space-exit-lateral_var(--motion-spatial)]',
  none: 'animate-[space-exit-fade_var(--motion-reveal)]',
}

interface Layer {
  key: string
  content: ReactNode
}

export interface SpaceTransitionProps {
  /** Direction of travel, from the environment store. */
  direction: TransitionDirection
  /** Distinguishes one space from the next so the animation replays. */
  transitionKey: string
  children: ReactNode
  className?: string
}

export function SpaceTransition({
  direction,
  transitionKey,
  children,
  className,
}: SpaceTransitionProps) {
  const [current, setCurrent] = useState<Layer>({ key: transitionKey, content: children })
  const [leaving, setLeaving] = useState<Layer | null>(null)
  const [travel, setTravel] = useState<TransitionDirection>('none')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    setCurrent((layer) => {
      if (layer.key === transitionKey) {
        // Same space, new content — the space updated in place rather than
        // being travelled to. Swapping without replaying the arrival animation
        // is what stops every data refresh looking like navigation.
        return { ...layer, content: children }
      }

      setLeaving(layer)
      setTravel(direction)

      // The frozen copy is released on a timer rather than on animationend,
      // because animationend does not fire in a backgrounded tab — the
      // outgoing space would then stay pinned over the new one on return.
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setLeaving(null), spatialDuration() + 40)

      return { key: transitionKey, content: children }
    })
  }, [transitionKey, direction, children])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <div className={cn('relative isolate', className)}>
      {leaving && (
        <div
          key={leaving.key}
          aria-hidden
          // Frozen mid-departure. Hidden from assistive technology and from
          // pointer events the moment it starts leaving, so a screen reader
          // never announces two spaces at once and a click never lands in the
          // one on its way out.
          className={cn('space-layer space-leaving', EXIT[travel])}
        >
          {leaving.content}
        </div>
      )}

      <div key={current.key} className={cn('flex flex-1 flex-col space-layer', ENTER[travel])}>
        {current.content}
      </div>
    </div>
  )
}

/**
 * The spatial duration currently in force, in milliseconds.
 *
 * Read from the token rather than hard-coded, so reduced motion — which sets it
 * to 0ms — also removes the wait before the outgoing layer is released.
 */
function spatialDuration(): number {
  if (typeof window === 'undefined') return 380
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--motion-spatial')
    .trim()
  const value = Number.parseFloat(raw)
  if (!Number.isFinite(value)) return 380
  return raw.endsWith('ms') ? value : value * 1000
}
