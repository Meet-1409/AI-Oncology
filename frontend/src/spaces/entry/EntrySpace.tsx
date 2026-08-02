import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
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
 * NO PATIENT INFORMATION IS REACHABLE HERE [04 §14], [03 §3]. The anatomical form
 * is anonymous and carries no clinical data.
 *
 * The 3D scene is loaded lazily and never blocks first paint. Every word is
 * readable with WebGL absent or reduced motion enabled.
 */

const EntryScene = lazy(() =>
  import('./scene/EntryScene').then((m) => ({ default: m.EntryScene })),
)

const FEATURES = [
  {
    icon: Layers,
    title: 'Every report, one record',
    body: 'Pathology, imaging and laboratory results from any hospital, organized automatically into a single patient record.',
  },
  {
    icon: BrainCircuit,
    title: 'Summaries you can verify',
    body: 'Each summary shows the evidence it came from and how confident it is. The original report always remains the source of truth.',
  },
  {
    icon: Activity,
    title: 'The journey, in order',
    body: 'Diagnosis, treatment, surgery and follow-up arranged in time, so a patient history can be understood rather than reconstructed.',
  },
  {
    icon: Boxes,
    title: 'The body at the centre',
    body: 'An interactive anatomical view showing where disease is, how severe it is, and how it has changed — rotated, compared, moved through time.',
  },
  {
    icon: ClipboardCheck,
    title: 'Requests that complete themselves',
    body: 'Oncologists request what they need; patients respond in a few taps, and the record updates on its own.',
  },
  {
    icon: ShieldCheck,
    title: 'Built for clinical trust',
    body: 'Role-based access, encrypted storage and a complete audit history, appropriate for hospital use.',
  },
] as const

const STEPS = [
  {
    icon: UploadCloud,
    title: 'Reports come together',
    body: 'Patients upload results from any hospital or laboratory. Originals are preserved exactly as issued.',
  },
  {
    icon: BrainCircuit,
    title: 'The record organizes itself',
    body: 'Reports are read, classified and placed in time, building one continuous clinical picture.',
  },
  {
    icon: ClipboardCheck,
    title: 'The oncologist reviews with confidence',
    body: 'Every finding traces back to the document it came from, so nothing has to be taken on trust.',
  },
] as const

/** Reveals a section as it enters the viewport. */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

function Station({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  const { ref, visible } = useInView<HTMLElement>()

  return (
    <section
      id={id}
      ref={ref}
      className={cn(
        'mx-auto w-full max-w-5xl px-6 py-28',
        'transition-[opacity,transform] duration-[900ms] ease-[var(--motion-ease-enter)]',
        'motion-reduce:transition-none',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
      )}
    >
      <p className="text-micro uppercase tracking-[0.18em] text-[#5f8ba0]">{eyebrow}</p>
      <h2 className="mt-4 max-w-3xl text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-white">
        {title}
      </h2>
      <div className="mt-12">{children}</div>
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

  // The opening: the word held close, a stroke drawn across it, the camera
  // withdrawing to reveal the figure behind.
  useEffect(() => {
    if (reduced) return
    const strike = setTimeout(() => setStruck(true), 850)
    const withdraw = setTimeout(() => setWithdrawn(true), 1950)
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
    <main className="relative min-h-svh bg-[#05080c] text-white">
      {/* The scene sits behind everything and persists as the visitor descends —
          one continuous environment rather than separate screens. */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <Suspense fallback={null}>
          <EntryScene progressRef={progressRef} />
        </Suspense>
        {/* Depth: a vignette and a soft core glow give the darkness volume. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(47,122,151,0.16), transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 90% 70% at 50% 50%, transparent 35%, rgba(5,8,12,0.85) 100%)',
          }}
        />
      </div>

      {/* Quiet persistent header. */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-30 flex items-center justify-between px-6 py-5 sm:px-10',
          'transition-colors duration-[var(--motion-spatial)]',
          scrolled && 'bg-[#05080c]/70 backdrop-blur-md',
        )}
      >
        <span className="flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-md bg-white/10">
            <Icon icon={Activity} size="xs" className="text-white" />
          </span>
          <span className="text-caption font-medium tracking-wide text-white/80">AI Oncology</span>
        </span>

        <Link
          to={paths.enter}
          className="group flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-caption text-white/85 transition-colors duration-[var(--motion-quick)] hover:border-white/40 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          Sign in
          <Icon
            icon={ArrowRight}
            size="xs"
            className="transition-transform duration-[var(--motion-quick)] group-hover:translate-x-0.5"
          />
        </Link>
      </header>

      {/* ---- The cinematic section. Tall, so the scroll has room to move. ---- */}
      <div ref={cinematicRef} className="relative z-10 h-[280svh]">
        <div className="sticky top-0 flex h-svh flex-col items-center justify-center px-6">
          <h1
            className={cn(
              'relative select-none text-center font-semibold leading-none tracking-[-0.045em]',
              'text-[clamp(3.25rem,15vw,10.5rem)]',
              'transition-transform duration-[1600ms] ease-[var(--motion-ease-enter)]',
              'motion-reduce:transition-none',
              withdrawn ? 'scale-100' : 'scale-[1.55]',
            )}
          >
            <span className="relative inline-block bg-gradient-to-b from-white to-[#9fc3d4] bg-clip-text text-transparent">
              CANCER
              <span
                aria-hidden
                className={cn(
                  'absolute left-0 top-1/2 h-[0.055em] -translate-y-1/2 origin-left rounded-full',
                  'bg-[#c22e23] shadow-[0_0_24px_rgba(194,46,35,0.65)]',
                  'transition-[width] ease-[var(--motion-ease-enter)] motion-reduce:transition-none',
                  struck ? 'w-full duration-[1000ms]' : 'w-0 duration-0',
                )}
              />
            </span>
          </h1>

          <p
            className={cn(
              'mt-10 max-w-md text-center text-body text-white/65',
              'transition-opacity duration-[900ms] ease-[var(--motion-ease-enter)]',
              'motion-reduce:transition-none',
              withdrawn ? 'opacity-100' : 'opacity-0',
            )}
          >
            One organized view of a patient's entire cancer journey.
          </p>

          <div
            className={cn(
              'mt-10 flex flex-wrap items-center justify-center gap-3',
              'transition-opacity delay-200 duration-[900ms] ease-[var(--motion-ease-enter)]',
              'motion-reduce:transition-none motion-reduce:delay-0',
              withdrawn ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Link
              to={paths.enter}
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-secondary font-medium text-[#05080c] transition-transform duration-[var(--motion-quick)] hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Enter the platform
              <Icon
                icon={ArrowRight}
                size="sm"
                className="transition-transform duration-[var(--motion-quick)] group-hover:translate-x-0.5"
              />
            </Link>
            <a
              href="#how-it-works"
              className="rounded-full border border-white/20 px-6 py-3 text-secondary text-white/80 transition-colors duration-[var(--motion-quick)] hover:border-white/45 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              See how it works
            </a>
          </div>

          {/* Descent cue. */}
          <div
            className={cn(
              'absolute bottom-10 flex flex-col items-center gap-2',
              'transition-opacity duration-500',
              withdrawn && !scrolled ? 'opacity-60' : 'opacity-0',
            )}
            aria-hidden
          >
            <span className="text-micro uppercase tracking-[0.2em] text-white/50">Scroll</span>
            <span className="h-10 w-px bg-gradient-to-b from-white/50 to-transparent" />
          </div>
        </div>
      </div>

      {/* ---- Stations. Layered above the persisting scene. ---- */}
      <div className="relative z-10 bg-gradient-to-b from-transparent via-[#05080c]/85 to-[#05080c]">
        <Station
          id="about"
          eyebrow="About"
          title="A patient's history should be understood, not reconstructed."
        >
          <div className="grid gap-8 sm:grid-cols-2">
            <p className="text-body leading-relaxed text-white/70">
              Cancer patients undergo pathology, imaging and laboratory investigations across
              multiple institutions, often over several years. By the time of a follow-up
              consultation, that history is spread across documents that were never designed to
              be read together.
            </p>
            <p className="text-body leading-relaxed text-white/70">
              This platform brings those reports into one record, organizes them, and presents
              them as a continuous clinical picture — with every derived statement traceable to
              the document it came from.
            </p>
          </div>
        </Station>

        <Station id="features" eyebrow="Features" title="Built for the way oncology actually works.">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group bg-[#070b11] p-7 transition-colors duration-[var(--motion-reveal)] hover:bg-[#0b1219]"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-white/[0.07] transition-colors duration-[var(--motion-reveal)] group-hover:bg-[#2f7a97]/25">
                  <Icon icon={feature.icon} size="sm" className="text-[#8fb6c7]" />
                </span>
                <h3 className="mt-5 text-subheading text-white">{feature.title}</h3>
                <p className="mt-2.5 text-secondary leading-relaxed text-white/60">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </Station>

        <Station
          id="how-it-works"
          eyebrow="How it works"
          title="From scattered documents to a single clinical picture."
        >
          <ol className="grid gap-12 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative">
                <span className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full border border-white/20 text-caption font-semibold text-white/80">
                    {index + 1}
                  </span>
                  <Icon icon={step.icon} size="sm" className="text-[#8fb6c7]" />
                </span>
                <h3 className="mt-5 text-subheading text-white">{step.title}</h3>
                <p className="mt-2.5 text-secondary leading-relaxed text-white/60">{step.body}</p>
              </li>
            ))}
          </ol>
        </Station>

        <Station id="contact" eyebrow="Contact" title="Bring it to your hospital.">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="max-w-md text-body leading-relaxed text-white/70">
                For questions about deploying the platform within a hospital or clinic, reach our
                team directly.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  { icon: Mail, value: 'contact@aioncology.example' },
                  { icon: Phone, value: '+91 22 4000 1234' },
                  { icon: MapPin, value: 'Sunrise Cancer Institute, Mumbai, India' },
                ].map((item) => (
                  <li key={item.value} className="flex items-center gap-3">
                    <Icon icon={item.icon} size="sm" className="text-[#8fb6c7]" />
                    <span className="text-secondary text-white/75">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm">
              <h3 className="text-subheading text-white">Already have an account?</h3>
              <p className="mt-2.5 text-secondary leading-relaxed text-white/60">
                Sign in to continue to your space. Patient information is never accessible
                without authentication.
              </p>
              <Link
                to={paths.enter}
                className="group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-secondary font-medium text-[#05080c] transition-transform duration-[var(--motion-quick)] hover:scale-[1.01] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Sign in
                <Icon
                  icon={ArrowRight}
                  size="sm"
                  className="transition-transform duration-[var(--motion-quick)] group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </Station>

        <footer className="border-t border-white/10">
          <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-10 sm:flex-row">
            <span className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-white/10">
                <Icon icon={Activity} size="xs" className="text-white" />
              </span>
              <span className="text-caption text-white/50">
                AI Oncology Patient Intelligence Platform
              </span>
            </span>
            <span className="text-caption text-white/35">
              Assists the oncologist. Never replaces clinical judgement.
            </span>
          </div>
        </footer>
      </div>
    </main>
  )
}
