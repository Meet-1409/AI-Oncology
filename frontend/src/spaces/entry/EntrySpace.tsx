import { useCallback, useState } from 'react'
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
import { Control, Icon, Surface, Text } from '@/components/primitives'
import { Reveal } from '@/components/motion'
import { paths } from '@/routes/paths'
import { CancerStatement } from './CancerStatement'
import { cn } from '@/lib/utils'

/**
 * The Entry — Depth 0.
 *
 * A cinematic introduction to the system, not a traditional landing page [04 §14].
 * It communicates identity, quality and trust immediately, and presents About,
 * Features, How It Works and Contact as stations along one continuous descent
 * rather than as separate pages [03 §3].
 *
 * NO PATIENT INFORMATION IS REACHABLE HERE [04 §14], [03 §3]. Nothing on this
 * screen is derived from a patient record. The anatomical motif is an anonymous
 * illustration of the product's visual language, carrying no clinical data.
 *
 * The Entry never loads the 3D runtime — it must stay fast and remain fully usable
 * without 3D [04 §14].
 */

const FEATURES = [
  {
    icon: Layers,
    title: 'Every report, one record',
    body: 'Pathology, imaging and laboratory results from any hospital, organized automatically into a single patient record.',
  },
  {
    icon: BrainCircuit,
    title: 'Summaries you can verify',
    body: 'Each AI summary shows the evidence it came from and how confident it is. The original report always remains the source of truth.',
  },
  {
    icon: Activity,
    title: 'The journey, in order',
    body: 'Diagnosis, treatment, surgery and follow-up arranged in time, so a patient history can be understood rather than reconstructed.',
  },
  {
    icon: Boxes,
    title: 'The body at the centre',
    body: 'An interactive anatomical view showing where disease is, how severe it is, and how it has changed — rotated, compared and moved through time.',
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

function Section({
  id,
  eyebrow,
  title,
  children,
  className,
}: {
  id: string
  eyebrow: string
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn('mx-auto w-full max-w-5xl px-6 py-24', className)}>
      <Text level="micro" tone="accent">
        {eyebrow}
      </Text>
      <Text as="h2" level="title" tone="primary" measure="comfortable" className="mt-3">
        {title}
      </Text>
      <div className="mt-10">{children}</div>
    </section>
  )
}

export default function EntrySpace() {
  const [settled, setSettled] = useState(false)
  const handleSettled = useCallback(() => setSettled(true), [])

  return (
    <main className="bg-[var(--surface-base)]">
      {/* Station 1 — the statement. */}
      <CancerStatement onSettled={handleSettled} />

      {/* The invitation to descend appears only once the statement has resolved,
          so the opening is never competing for attention. */}
      <div
        className={cn(
          'mx-auto -mt-[10vh] flex max-w-5xl flex-col items-center px-6 pb-24',
          'transition-opacity duration-[var(--motion-spatial)] ease-[var(--motion-ease-enter)]',
          'motion-reduce:transition-none',
          settled ? 'opacity-100' : 'opacity-0',
        )}
      >
        <Text level="body" tone="body" measure="comfortable" className="text-center">
          Cancer care is scattered across hospitals, laboratories and years. Understanding
          it should not be.
        </Text>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Control intent="primary" size="lg" asChild>
            <Link to={paths.enter}>
              Enter the platform
              <Icon icon={ArrowRight} size="sm" />
            </Link>
          </Control>
          <Control intent="quiet" size="lg" asChild>
            <a href="#how-it-works">See how it works</a>
          </Control>
        </div>
        <Text level="caption" tone="subtle" className="mt-6">
          Assists the oncologist. Never replaces clinical judgement.
        </Text>
      </div>

      {/* Station 2 — About. */}
      <Section
        id="about"
        eyebrow="About"
        title="A patient's history should be understood, not reconstructed."
        className="border-t border-[var(--border-subtle)]"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          <Text level="body" tone="body" measure="comfortable">
            Cancer patients undergo pathology, imaging and laboratory investigations across
            multiple institutions, often over several years. By the time of a follow-up
            consultation, that history is spread across documents that were never designed
            to be read together.
          </Text>
          <Text level="body" tone="body" measure="comfortable">
            This platform brings those reports into one record, organizes them, and presents
            them as a continuous clinical picture — with every derived statement traceable to
            the document it came from.
          </Text>
        </div>
      </Section>

      {/* Station 3 — Features. */}
      <Section
        id="features"
        eyebrow="Features"
        title="Built for the way oncology actually works."
        className="border-t border-[var(--border-subtle)]"
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} index={index}>
              <div className="h-full">
                <span className="flex size-10 items-center justify-center rounded-lg bg-[var(--accent-subtle)]">
                  <Icon icon={feature.icon} size="sm" className="text-[var(--accent)]" />
                </span>
                <Text level="subheading" tone="primary" className="mt-4">
                  {feature.title}
                </Text>
                <Text level="secondary" tone="muted" className="mt-2">
                  {feature.body}
                </Text>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Station 4 — How It Works. */}
      <Section
        id="how-it-works"
        eyebrow="How it works"
        title="From scattered documents to a single clinical picture."
        className="border-t border-[var(--border-subtle)]"
      >
        <ol className="grid gap-10 lg:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-full bg-[var(--accent)] text-caption font-semibold text-[var(--text-on-accent)]">
                  {index + 1}
                </span>
                <Icon icon={step.icon} size="sm" className="text-[var(--accent)]" />
              </div>
              <Text level="subheading" tone="primary" className="mt-4">
                {step.title}
              </Text>
              <Text level="secondary" tone="muted" className="mt-2">
                {step.body}
              </Text>
            </li>
          ))}
        </ol>
      </Section>

      {/* Station 5 — Contact and entry. */}
      <Section
        id="contact"
        eyebrow="Contact"
        title="Bring it to your hospital."
        className="border-t border-[var(--border-subtle)]"
      >
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <Text level="body" tone="body" measure="comfortable">
              For questions about deploying the platform within a hospital or clinic, reach
              our team directly.
            </Text>
            <ul className="space-y-3">
              {[
                { icon: Mail, value: 'contact@aioncology.example' },
                { icon: Phone, value: '+91 22 4000 1234' },
                { icon: MapPin, value: 'Sunrise Cancer Institute, Mumbai, India' },
              ].map((item) => (
                <li key={item.value} className="flex items-center gap-3">
                  <Icon icon={item.icon} size="sm" className="text-[var(--accent)]" />
                  <Text level="secondary" tone="body">
                    {item.value}
                  </Text>
                </li>
              ))}
            </ul>
          </div>

          <Surface elevation="raised" radius="xl" border="subtle" inset="lg">
            <Text level="subheading" tone="primary">
              Already have an account?
            </Text>
            <Text level="secondary" tone="muted" className="mt-2">
              Sign in to continue to your space. Patient information is never accessible
              without authentication.
            </Text>
            <Control intent="primary" block className="mt-6" asChild>
              <Link to={paths.enter}>
                Sign in
                <Icon icon={ArrowRight} size="sm" />
              </Link>
            </Control>
          </Surface>
        </div>
      </Section>

      <footer className="border-t border-[var(--border-subtle)] py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <span className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md bg-[var(--accent)]">
              <Icon icon={Activity} size="xs" className="text-[var(--text-on-accent)]" />
            </span>
            <Text level="caption" tone="muted">
              AI Oncology Patient Intelligence Platform
            </Text>
          </span>
          <Text level="caption" tone="subtle">
            © 2026 AI Oncology
          </Text>
        </div>
      </footer>
    </main>
  )
}
