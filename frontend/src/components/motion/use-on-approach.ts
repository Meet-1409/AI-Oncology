import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/**
 * Whether an element has scrolled into view — for content on a long page that
 * reveals as the user reaches it, rather than all at once on mount [00 §10.10].
 *
 * A fresh, app-owned implementation, not a reuse of the cinematic layer's
 * identically-purposed hook: that one is Entry-only, and importing it here
 * would cross the architecture boundary `tools/check-architecture.mjs`
 * enforces [04 §14]. Fires once, then disconnects — a repeating reveal on
 * every scroll back into view would read as attention-seeking rather than
 * as content settling into place.
 */
export function useOnApproach<T extends Element>(threshold = 0.12): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return

    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, visible])

  return [ref, visible]
}
