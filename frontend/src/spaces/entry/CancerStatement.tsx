import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '@/components/motion'
import { cn } from '@/lib/utils'

/**
 * The opening statement.
 *
 * The first screen begins on the word, held close, then a stroke crosses it and
 * the camera pulls back to reveal the platform. It is the platform's identity in
 * one gesture: the disease, and the intent to strike it out.
 *
 * Deliberately restrained. The Entry must communicate quality and trust and be
 * memorable [04 §14], while never becoming flashy or game-like [00 §10.17]. The
 * motion is slow and certain rather than energetic.
 *
 * Under reduced motion the sequence resolves immediately to its final state: the
 * word struck through and the camera at rest. No information is lost [00 §11.9].
 */

type Phase = 'held' | 'striking' | 'withdrawn'

const HOLD_MS = 900
const STRIKE_MS = 1100

export function CancerStatement({ onSettled }: { onSettled?: () => void }) {
  const reduced = useReducedMotion()
  const [phase, setPhase] = useState<Phase>(reduced ? 'withdrawn' : 'held')
  const settledRef = useRef(false)

  useEffect(() => {
    if (reduced) {
      if (!settledRef.current) {
        settledRef.current = true
        onSettled?.()
      }
      return
    }

    const toStriking = setTimeout(() => setPhase('striking'), HOLD_MS)
    const toWithdrawn = setTimeout(() => {
      setPhase('withdrawn')
      if (!settledRef.current) {
        settledRef.current = true
        onSettled?.()
      }
    }, HOLD_MS + STRIKE_MS)

    return () => {
      clearTimeout(toStriking)
      clearTimeout(toWithdrawn)
    }
  }, [reduced, onSettled])

  const struck = phase === 'striking' || phase === 'withdrawn'
  const withdrawn = phase === 'withdrawn'

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden px-6">
      <div
        className={cn(
          'relative transition-transform ease-[var(--motion-ease-enter)]',
          'motion-reduce:transition-none',
          // The camera begins close on the word and withdraws to reveal context.
          withdrawn ? 'scale-100 duration-[1400ms]' : 'scale-[1.9] duration-[1400ms]',
        )}
      >
        <h1
          className={cn(
            'select-none text-center font-semibold tracking-[-0.04em] text-[var(--text-primary)]',
            'text-[clamp(3rem,16vw,11rem)] leading-none',
          )}
        >
          <span className="relative inline-block">
            CANCER
            {/* The stroke is drawn across the word rather than appearing at once. */}
            <span
              aria-hidden
              className={cn(
                'absolute left-0 top-1/2 h-[0.06em] -translate-y-1/2 rounded-full',
                'bg-[var(--color-severity-4)] origin-left',
                'transition-[width] ease-[var(--motion-ease-enter)] motion-reduce:transition-none',
                struck ? 'w-full duration-[900ms]' : 'w-0 duration-0',
              )}
            />
          </span>
        </h1>
      </div>

      <p
        className={cn(
          'absolute inset-x-0 bottom-[14vh] mx-auto max-w-md px-6 text-center',
          'text-secondary text-[var(--text-muted)]',
          'transition-opacity duration-[var(--motion-spatial)] ease-[var(--motion-ease-enter)]',
          'motion-reduce:transition-none',
          withdrawn ? 'opacity-100' : 'opacity-0',
        )}
      >
        One organized view of a patient's entire cancer journey.
      </p>
    </div>
  )
}
