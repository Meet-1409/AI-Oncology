import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  BrainCircuit,
  Boxes,
  ClipboardCheck,
  Layers,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react'
import { Icon } from '@/components/primitives'
import {
  CinematicAction,
  CinematicJump,
  EdgeLabel,
  Grain,
  Hairline,
  LightField,
  Marquee,
  Ordinal,
  Rise,
  Settle,
} from '@/components/cinematic'
import { useReducedMotion } from '@/components/motion'
import { paths } from '@/routes/paths'
import { cn } from '@/lib/utils'

/**
 * The Entry — Depth 0.
 *
 * A cinematic introduction, not a landing page [04 §14]. The visitor descends
 * through one continuous environment: the statement, then the body as a field of
 * points, then the stations — About, Features, How It Works, Contact [03 §3].
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

/** Phrases for the drifting strip. Each also appears as real content below. */
const STRIP = [
  'Every report in one place',
  'The body, in view',
  'The journey, in order',
  'Evidence behind every summary',
  'Built for hospital use',
] as const

const FEATURES = [
  {
    icon: Layers,
    title: 'Every report, one record',
    body: 'Pathology, imaging and laboratory results from any hospital, collected into a single record — so nobody has to carry a folder of paper to an appointment.',
  },
  {
    icon: BrainCircuit,
    title: 'Summaries you can check',
    body: 'Every summary shows which report it came from and how sure it is. The original document is always one tap away, and it is always the final word.',
  },
  {
    icon: Activity,
    title: 'The journey, in order',
    body: 'Diagnosis, treatment, surgery and follow-up laid out in the order they happened, so the history can be read rather than pieced together.',
  },
  {
    icon: Boxes,
    title: 'The body, in view',
    body: 'A view of the body showing where the disease is and how serious it is. Turn it, tap any part, and see what is known about that part.',
  },
  {
    icon: ClipboardCheck,
    title: 'Requests that finish themselves',
    body: 'The oncologist asks for what they need. The patient answers in a few taps. The record updates on its own.',
  },
  {
    icon: ShieldCheck,
    title: 'Built for clinical trust',
    body: 'Each person sees only what they should. Everything is encrypted and every action is recorded, as hospital use requires.',
  },
] as const

const STEPS = [
  {
    icon: UploadCloud,
    title: 'Reports come together',
    body: 'Patients add results from any hospital or laboratory. The original file is kept exactly as it was issued — nothing is altered.',
  },
  {
    icon: BrainCircuit,
    title: 'The record organizes itself',
    body: 'Reports are read, sorted and placed in time, building one continuous picture instead of a pile of documents.',
  },
  {
    icon: ClipboardCheck,
    title: 'The oncologist reviews it',
    body: 'Every statement traces back to the document behind it, so nothing has to be taken on trust.',
  },
] as const

function Station({
  id,
  index,
  eyebrow,
  title,
  children,
}: {
  id: string
  index: number
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="mx-auto w-full max-w-6xl px-6 py-28 sm:px-10">
      <Settle className="flex items-center gap-4">
        <Ordinal value={index} />
        <span className="h-px w-10 bg-[var(--cinema-line-strong)]" />
        <EdgeLabel>{eyebrow}</EdgeLabel>
      </Settle>

      {/* The heading rises from behind a mask — it arrives rather than appears. */}
      <Rise
        as="h2"
        beat={1}
        className="mt-7 max-w-4xl text-[clamp(1.9rem,4.4vw,3.4rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-[var(--cinema-ink)]"
      >
        {title}
      </Rise>

      <Settle beat={2} className="mt-14">
        {children}
      </Settle>
    </section>
  )
}

export default function EntrySpace() {
  const reduced = useReducedMotion()
  const progressRef = useRef(0)
  const cinematicRef = useRef<HTMLDivElement>(null)

  const [struck, setStruck] = useState(reduced)
  const [withdrawn, setWithdrawn] = useState(reduced)
  const [scrolled, setScrolled] = useState(false)
  const [pastHero, setPastHero] = useState(false)

  // The opening: the word held close, a stroke drawn across it, the camera
  // withdrawing to reveal the figure it was standing in front of.
  useEffect(() => {
    if (reduced) return
    const strike = setTimeout(() => setStruck(true), 800)
    const withdraw = setTimeout(() => setWithdrawn(true), 1850)
    return () => {
      clearTimeout(strike)
      clearTimeout(withdraw)
    }
  }, [reduced])

  // Scroll progress across the cinematic section drives the camera.
  useEffect(() => {
    let frame = 0
    function onScroll() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const height = cinematicRef.current?.offsetHeight ?? window.innerHeight * 3
        const raw = window.scrollY / Math.max(1, height - window.innerHeight)
        progressRef.current = Math.min(1, Math.max(0, raw))
        setScrolled(window.scrollY > 40)
        // Once the reader reaches the stations the field is no longer in front
        // of anything, so it withdraws rather than drifting across the text.
        setPastHero(progressRef.current > 0.82)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <main className="relative min-h-svh overflow-x-clip bg-[var(--cinema-void)] text-[var(--cinema-ink)]">
      {/* ---- Layer 0: the light. ---- */}
      <LightField className="fixed inset-0 z-0" />

      {/* ---- Layer 2: the statement. Beneath the figure, deliberately. ---- */}
      <div ref={cinematicRef} className="relative z-10 h-[300svh]">
        <div className="sticky top-0 flex h-svh flex-col items-center justify-center">
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
          <h1
            className={cn(
              'relative select-none px-6 text-center font-[650] leading-[0.86] tracking-[-0.045em]',
              'text-[clamp(3.5rem,17.5vw,13rem)]',
              'transition-transform duration-[var(--cinema-withdraw)] ease-[var(--motion-ease-enter)]',
              'motion-reduce:transition-none',
              withdrawn ? 'scale-100' : 'scale-[1.6]',
            )}
          >
            <span className="relative inline-block bg-gradient-to-b from-white via-white to-[#7ba6ba] bg-clip-text text-transparent">
              CANCER
              <span
                aria-hidden
                className={cn(
                  'absolute left-0 top-1/2 h-[0.05em] -translate-y-1/2 origin-left rounded-full',
                  'bg-[#c22e23] shadow-[0_0_28px_rgba(194,46,35,0.7)]',
                  'transition-[width] ease-[var(--motion-ease-enter)] motion-reduce:transition-none',
                  struck ? 'w-full duration-[var(--cinema-draw)]' : 'w-0 duration-0',
                )}
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

          {/* Actions sit above the field so they stay crisp and clickable. */}
          <div
            className={cn(
              'relative z-30 mt-10 flex flex-wrap items-center justify-center gap-3 px-6',
              'transition-opacity delay-200 duration-[var(--cinema-settle)] ease-[var(--motion-ease-enter)]',
              'motion-reduce:transition-none motion-reduce:delay-0',
              withdrawn ? 'opacity-100' : 'opacity-0',
            )}
          >
            <CinematicAction to={paths.enter}>Sign in</CinematicAction>
            <CinematicJump href="#how-it-works">See how it works</CinematicJump>
          </div>

          {/* The strip, anchored to the bottom of the frame. */}
          <div
            className={cn(
              'absolute inset-x-0 bottom-0 z-30',
              'transition-opacity duration-[var(--cinema-settle)]',
              withdrawn && !scrolled ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Marquee items={STRIP} />
          </div>
        </div>
      </div>

      {/* ---- Layer 3: the figure, IN FRONT of the statement. ----
          Screen blending guarantees the points can only add light, so the word
          beneath them never loses contrast; the depth is real but costs nothing
          in legibility. Pointer events pass straight through. */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none fixed inset-0 z-20',
          'transition-opacity duration-[var(--motion-spatial)] ease-[var(--motion-ease-standard)]',
          pastHero ? 'opacity-0' : 'opacity-100',
        )}
        style={{ mixBlendMode: 'screen' }}
      >
        <Suspense fallback={null}>
          <EntryScene progressRef={progressRef} />
        </Suspense>
      </div>

      {/* ---- Layer 4: grain over the whole frame. ---- */}
      <Grain className="fixed inset-0 z-[25]" />

      {/* ---- Persistent header. ---- */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-5 sm:px-10',
          'transition-colors duration-[var(--motion-spatial)]',
          scrolled && 'bg-[var(--cinema-veil)] backdrop-blur-md',
        )}
      >
        <span className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-white/10">
            <Icon icon={Activity} size="xs" className="text-[var(--cinema-ink)]" />
          </span>
          <span className="text-caption font-medium tracking-wide text-[var(--cinema-ink)]/80">
            AI Oncology
          </span>
        </span>

        <nav className="flex items-center gap-1 sm:gap-2">
          {[
            { href: '#about', label: 'About' },
            { href: '#features', label: 'Features' },
            { href: '#contact', label: 'Contact' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hidden rounded-full px-3.5 py-1.5 text-caption text-[var(--cinema-ink)]/60 transition-colors duration-[var(--motion-quick)] hover:text-[var(--cinema-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cinema-ink)] sm:block"
            >
              {item.label}
            </a>
          ))}
          <Link
            to={paths.enter}
            className="rounded-full border border-[var(--cinema-line-strong)] px-4 py-1.5 text-caption text-[var(--cinema-ink)]/85 transition-colors duration-[var(--motion-quick)] hover:border-[var(--cinema-ink)] hover:text-[var(--cinema-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--cinema-ink)]"
          >
            Sign in
          </Link>
        </nav>
      </header>

      {/* ---- Stations. Above the withdrawing field. ---- */}
      <div className="relative z-30 bg-gradient-to-b from-transparent via-[var(--cinema-void)]/92 to-[var(--cinema-void)]">
        <Station
          id="about"
          index={1}
          eyebrow="About"
          title="A patient's history should be understood, not reconstructed."
        >
          <div className="grid gap-10 sm:grid-cols-2">
            <p className="text-body leading-relaxed text-[var(--cinema-ink)]/70">
              Cancer care produces scans, biopsies and blood tests at many different
              hospitals, sometimes over years. By the time of the next appointment,
              that history is scattered across documents that were never meant to be
              read side by side.
            </p>
            <p className="text-body leading-relaxed text-[var(--cinema-ink)]/70">
              This platform brings those reports into one record, puts them in order,
              and shows them as one continuous picture — with every statement it makes
              traceable to the document it came from.
            </p>
          </div>
        </Station>

        <Station
          id="features"
          index={2}
          eyebrow="Features"
          title="Built for the way oncology actually works."
        >
          {/* A hairline grid rather than cards. Space and one line do the
              grouping, exactly as the reference compositions do. */}
          <div className="grid gap-px overflow-hidden rounded-2xl bg-[var(--cinema-line)] sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group bg-[var(--cinema-void)] p-8 transition-colors duration-[var(--motion-reveal)] hover:bg-[#0a1017]"
              >
                <span className="flex size-10 items-center justify-center rounded-full bg-white/[0.06] transition-colors duration-[var(--motion-reveal)] group-hover:bg-[#2f7a97]/30">
                  <Icon icon={feature.icon} size="sm" className="text-[#8fb6c7]" />
                </span>
                <h3 className="mt-6 text-subheading text-[var(--cinema-ink)]">{feature.title}</h3>
                <p className="mt-3 text-secondary leading-relaxed text-[var(--cinema-ink)]/60">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </Station>

        <Station
          id="how-it-works"
          index={3}
          eyebrow="How it works"
          title="From scattered documents to one clear picture."
        >
          <ol className="grid gap-14 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title}>
                <div className="flex items-center gap-4">
                  <Ordinal value={index + 1} />
                  <Hairline className="flex-1" />
                  <Icon icon={step.icon} size="sm" className="text-[#8fb6c7]" />
                </div>
                <h3 className="mt-6 text-subheading text-[var(--cinema-ink)]">{step.title}</h3>
                <p className="mt-3 text-secondary leading-relaxed text-[var(--cinema-ink)]/60">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </Station>

        <Station id="contact" index={4} eyebrow="Contact" title="Bring it to your hospital.">
          <div className="grid gap-14 lg:grid-cols-2">
            <div>
              <p className="max-w-md text-body leading-relaxed text-[var(--cinema-ink)]/70">
                For questions about using the platform in a hospital or clinic, reach
                our team directly.
              </p>
              <ul className="mt-10 space-y-5">
                {[
                  { icon: Mail, value: 'contact@aioncology.example' },
                  { icon: Phone, value: '+91 22 4000 1234' },
                  { icon: MapPin, value: 'Sunrise Cancer Institute, Mumbai, India' },
                ].map((item) => (
                  <li key={item.value} className="flex items-center gap-4">
                    <Icon icon={item.icon} size="sm" className="text-[#8fb6c7]" />
                    <span className="text-secondary text-[var(--cinema-ink)]/75">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[var(--cinema-line)] bg-white/[0.025] p-9 backdrop-blur-sm">
              <EdgeLabel>Already registered</EdgeLabel>
              <h3 className="mt-5 text-title text-[var(--cinema-ink)]">
                Sign in to continue.
              </h3>
              <p className="mt-3 text-secondary leading-relaxed text-[var(--cinema-ink)]/60">
                Patient information cannot be reached without signing in. Nothing on
                this page is anyone's medical record.
              </p>
              <CinematicAction to={paths.enter} className="mt-8">
                Sign in
              </CinematicAction>
            </div>
          </div>
        </Station>

        <footer className="border-t border-[var(--cinema-line)]">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row sm:px-10">
            <span className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-md bg-white/10">
                <Icon icon={Activity} size="xs" className="text-[var(--cinema-ink)]" />
              </span>
              <span className="text-caption text-[var(--cinema-ink)]/50">
                AI Oncology Patient Intelligence Platform
              </span>
            </span>
            <span className="text-caption text-[var(--cinema-ink)]/35">
              Assists the oncologist. Never replaces clinical judgement.
            </span>
          </div>
        </footer>
      </div>
    </main>
  )
}
