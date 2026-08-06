import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useReducedMotion } from './use-reduced-motion'

/**
 * Content that changes in place.
 *
 * `Reveal` plays an entrance. It cannot play an EXIT, because by the time React
 * has re-rendered, the outgoing content is already gone — which is why re-keying
 * a Reveal still reads as a hard cut with a fade tacked on the end. Tab panels,
 * the Account sections and the Contextual Orbit all swap this way, and all of
 * them looked instant.
 *
 * This holds the outgoing content for one exit beat, then brings the incoming
 * content in. Both halves are short and on the same easing, so a tab change
 * reads as one movement rather than two events.
 *
 * WHY IT DOES NOT CROSS-FADE. Overlapping the two panels would need them
 * absolutely positioned, which collapses the container's height and makes the
 * page jump. Sequential is also the honest reading: this content REPLACED that
 * content, it did not blend into it. Clinical panels must never appear
 * momentarily superimposed — two sets of values on screen at once, however
 * briefly, is a misread risk that no amount of polish is worth.
 *
 * Direction is vertical and tiny (6px). Anything larger competes with the page's
 * own scroll position for the reader's attention.
 *
 * Under reduced motion the swap is immediate. No information is lost, only the
 * movement [00 §11.9].
 */

export interface SwapProps {
  /** Changing this plays the swap. Usually the active tab id. */
  swapKey: string
  children: ReactNode
  className?: string
}

/** Exit is deliberately quicker than entry — leaving should not be dwelt on. */
const EXIT_MS = 110

export function Swap({ swapKey, children, className }: SwapProps) {
  const reduced = useReducedMotion()

  const [shown, setShown] = useState<{ key: string; node: ReactNode }>({
    key: swapKey,
    node: children,
  })
  const [phase, setPhase] = useState<'in' | 'out'>('in')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (reduced) {
      setShown({ key: swapKey, node: children })
      setPhase('in')
      return
    }

    // Same panel, new content (a value updated, a list filtered): update in
    // place. Replaying the swap on every data change would make the panel
    // flicker while someone is reading it.
    if (swapKey === shown.key) {
      setShown({ key: swapKey, node: children })
      return
    }

    setPhase('out')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setShown({ key: swapKey, node: children })
      setPhase('in')
    }, EXIT_MS)

    return () => clearTimeout(timer.current)
    // `children` is intentionally excluded from the dependency list that
    // triggers a swap — only the key does. It is read fresh inside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swapKey, children, reduced])

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <div
      className={cn(
        'transition-[opacity,transform] ease-[var(--motion-ease-enter)]',
        'motion-reduce:transition-none',
        phase === 'out'
          ? 'translate-y-[-6px] opacity-0 duration-[110ms]'
          : 'translate-y-0 opacity-100 duration-[var(--motion-reveal)]',
        className,
      )}
    >
      {shown.node}
    </div>
  )
}
