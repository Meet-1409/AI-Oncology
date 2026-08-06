import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { Icon } from '@/components/primitives'
import { CinematicAction, EdgeLabel, Grain, LightField, Marquee } from '@/components/cinematic'
import { useReducedMotion } from '@/components/motion'
import { paths } from '@/routes/paths'
import { cn } from '@/lib/utils'

/**
 * The Entry — Depth 0.
 *
 * ONE FRAME. Not a scrolling landing page.
 *
 * This used to descend through 300svh of stations — About, Features, How It
 * Works, Contact — with the camera driven by scroll position. That was removed
 * at the product owner's direction: the arrival is the whole statement, and a
 * marketing page underneath it diluted rather than supported it. What is left
 * is the composition that was always doing the work — the struck word, the
 * figure standing behind it, one sentence, one way in, and the strip.
 *
 * THE COMPOSITION IS BUILT ON DEPTH. The statement is not printed on top of the
 * scene; the scene passes THROUGH it. The point field is drawn above the
 * wordmark in screen blend, so points brighten the letters and never darken
 * them: the word sits inside the figure, and the frame reads as photographed
 * rather than stacked. That single layering decision does more for perceived
 * quality than any amount of additional animation, and it costs no legibility —
 * screen blending is incapable of reducing contrast.
 *
 * NO PATIENT INFORMATION IS REACHABLE HERE [04 §14], [03 §3]. The anatomical
 * form is anonymous and carries no clinical data.
 *
 * The 3D scene is loaded lazily and never blocks first paint. Every word is
 * readable with WebGL absent or reduced motion enabled.
 */

const EntryScene = lazy(() =>
  import('./scene/EntryScene').then((m) => ({ default: m.EntryScene })),
)

/** Phrases for the drifting strip. */
const STRIP = [
  'Every report in one place',
  'The body, in view',
  'The journey, in order',
  'Evidence behind every summary',
  'Built for hospital use',
] as const

export default function EntrySpace() {
  const reduced = useReducedMotion()

  // The scene still takes a progress ref — it drives the camera's distance.
  // With the scroll section gone it simply stays at 0, which is the composed
  // opening framing, so the scene component needs no special case.
  const progressRef = useRef(0)

  const [struck, setStruck] = useState(reduced)
  const [withdrawn, setWithdrawn] = useState(reduced)

  // The opening: the word held close, a stroke drawn across it, the camera
  // withdrawing to reveal the figure it was standing in front of. This is an
  // arrival, not a scroll effect, so it survives the section removal.
  useEffect(() => {
    if (reduced) return
    const strike = setTimeout(() => setStruck(true), 800)
    const withdraw = setTimeout(() => setWithdrawn(true), 1850)
    return () => {
      clearTimeout(strike)
      clearTimeout(withdraw)
    }
  }, [reduced])

  return (
    <main className="relative h-svh overflow-hidden bg-[var(--cinema-void)] text-[var(--cinema-ink)]">
      {/* ---- Layer 0: the light. ---- */}
      <LightField className="absolute inset-0 z-0" />

      {/* ---- Layer 2: the statement. Beneath the figure, deliberately. ---- */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center">
        {/* Corner labels. They frame the composition and tell the reader
            exactly where they are, which the reference compositions do and
            most landing pages forget. */}
        <div
          className={cn(
            'pointer-events-none absolute inset-x-6 top-24 flex justify-between sm:inset-x-10',
            'transition-opacity duration-[var(--cinema-settle)]',
            withdrawn ? 'opacity-100' : 'opacity-0',
          )}
        >
          <EdgeLabel>Patient Intelligence</EdgeLabel>
          <EdgeLabel className="hidden sm:block">For patients and oncologists</EdgeLabel>
        </div>

        {/* The word. Oversized to the point of touching the frame — the
            reference compositions all let display type run to the edges,
            which is what makes a hero feel composed rather than centred. */}
        {/* An editorial serif, not a grotesque.
            The word belongs to the person, not to the software — a heavy sans
            set it in the software's voice, which is exactly the wrong voice for
            this word. Light weight and open tracking rather than bold and
            tight: the statement carries by scale and restraint, and it stops
            shouting at someone who may have received this diagnosis last week.
            The strike is the only red on the screen, which is the same rule the
            whole product runs on. */}
        <h1
          className={cn(
            'relative select-none px-6 text-center font-normal leading-[0.9] tracking-[0.01em]',
            'font-editorial text-[clamp(4rem,19vw,15rem)]',
            'transition-transform duration-[var(--cinema-withdraw)] ease-[var(--motion-ease-enter)]',
            'motion-reduce:transition-none',
            withdrawn ? 'scale-100' : 'scale-[1.6]',
          )}
        >
          <span className="relative inline-block bg-gradient-to-b from-white via-white to-[#93b4c4] bg-clip-text text-transparent">
            Cancer
            <span
              aria-hidden
              className={cn(
                'absolute left-[-0.02em] top-1/2 h-[0.022em] -translate-y-1/2 origin-left rounded-full',
                'bg-[#c22e23] shadow-[0_0_26px_rgba(194,46,35,0.65)]',
                'transition-[width] ease-[var(--motion-ease-enter)] motion-reduce:transition-none',
                struck ? 'duration-[var(--cinema-draw)]' : 'duration-0',
              )}
              style={{ width: struck ? 'calc(100% + 0.04em)' : 0 }}
            />
          </span>
        </h1>

        <p
          className={cn(
            'mt-9 max-w-lg px-6 text-center text-body text-[var(--cinema-ink)]/70',
            'transition-opacity duration-[var(--cinema-settle)] ease-[var(--motion-ease-enter)]',
            'motion-reduce:transition-none',
            withdrawn ? 'opacity-100' : 'opacity-0',
          )}
        >
          One clear view of everything that has happened, and everything that is
          happening now — for the patient and the oncologist alike.
        </p>

        {/* The one way in. Sits above the field so it stays crisp and clickable. */}
        <div
          className={cn(
            'relative z-30 mt-10 flex flex-wrap items-center justify-center gap-3 px-6',
            'transition-opacity delay-200 duration-[var(--cinema-settle)] ease-[var(--motion-ease-enter)]',
            'motion-reduce:transition-none motion-reduce:delay-0',
            withdrawn ? 'opacity-100' : 'opacity-0',
          )}
        >
          <CinematicAction to={paths.enter}>Sign in</CinematicAction>
        </div>

        {/* The strip, anchored to the bottom of the frame. */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 z-30',
            'transition-opacity duration-[var(--cinema-settle)]',
            withdrawn ? 'opacity-100' : 'opacity-0',
          )}
        >
          <Marquee items={STRIP} />
        </div>
      </div>

      {/* ---- Layer 3: the figure, IN FRONT of the statement. ----
          Screen blending guarantees the points can only add light, so the word
          beneath them never loses contrast; the depth is real but costs nothing
          in legibility. Pointer events pass straight through. */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 top-0 h-svh z-20',
          // The figure owns the upper frame, where the wordmark is and where
          // the word cutting across the body is the whole point. Below that sit
          // the sentence and the action, and screen blending ADDS light — so an
          // un-faded figure behind them lifts the background toward the text
          // colour and quietly eats the contrast. The body fades out before it
          // reaches them. Legibility outranks the composition.
          //
          // The fade lands higher on a narrow screen: a tall viewport puts the
          // copy much closer to the figure's middle, so the desktop stop leaves
          // the paragraph sitting on the chest.
          '[mask-image:linear-gradient(to_bottom,black_0%,black_30%,rgba(0,0,0,0.16)_46%,transparent_58%)]',
          'md:[mask-image:linear-gradient(to_bottom,black_0%,black_52%,rgba(0,0,0,0.22)_68%,transparent_78%)]',
        )}
        style={{ mixBlendMode: 'screen' }}
      >
        <Suspense fallback={null}>
          <EntryScene progressRef={progressRef} />
        </Suspense>
      </div>

      {/* ---- Layer 4: grain over the whole frame. ---- */}
      <Grain className="absolute inset-0 z-[25]" />

      {/* ---- Header. Wordmark and the way in; there is nowhere else to go. ---- */}
      <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-white/10">
            <Icon icon={Activity} size="xs" className="text-[var(--cinema-ink)]" />
          </span>
          <span className="text-caption font-medium tracking-wide text-[var(--cinema-ink)]/80">
            AI Oncology
          </span>
        </span>

        <Link
          to={paths.enter}
          className={cn(
            'rounded-full border border-[var(--cinema-line-strong)] px-4 py-1.5 text-caption',
            'text-[var(--cinema-ink)]/85 transition-colors duration-[var(--motion-quick)]',
            'hover:border-[var(--cinema-ink)] hover:text-[var(--cinema-ink)]',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cinema-ink)]',
          )}
        >
          Sign in
        </Link>
      </header>
    </main>
  )
}
