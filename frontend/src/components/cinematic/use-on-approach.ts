import { useEffect, useRef, useState } from 'react'

/**
 * Fires once, when the element first enters the viewport.
 *
 * Kept in its own module rather than beside the components that consume it,
 * matching the convention in components/motion: a file exports components or it
 * exports hooks, never both.
 */
export function useOnApproach<T extends HTMLElement>(rootMargin = '0px 0px -10% 0px') {
  const ref = useRef<T>(null)
  const [approached, setApproached] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Without IntersectionObserver the content is simply shown. Degrading to
    // visible is the only acceptable failure mode for a reveal — a reader must
    // never lose content because an observer was unavailable.
    if (typeof IntersectionObserver === 'undefined') {
      setApproached(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setApproached(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [rootMargin])

  return { ref, approached }
}
