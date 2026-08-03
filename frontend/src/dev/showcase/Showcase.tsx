import { useState } from 'react'
import type { ReactNode } from 'react'
import { Activity, AlertTriangle, Check, FileText, Search, Upload } from 'lucide-react'
import {
  Control,
  Icon,
  Panel,
  StatusIndicator,
  Surface,
  Text,
  VisuallyHidden,
} from '@/components/primitives'
import { Reveal } from '@/components/motion'
import {
  FocusLayer,
  Orientation,
  PlainExplanation,
  SeverityLegend,
} from '@/components/patterns'
// Entry-only vocabulary [04 §14]. Permitted here because the Showcase documents
// the design system and never ships to production.
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
import { duration, easing, severityScale } from '@/design/theme'
import { severityLabel, SEVERITY_LEVELS } from '@/lib/status'

/**
 * Design System Showcase — DEVELOPMENT ONLY.
 *
 * An internal engineering tool for validating the design system. It is not part of
 * the production application, is not reachable through normal navigation, and is
 * excluded from production builds by the guard in app/App.tsx.
 *
 * It renders ONLY design system primitives. If something cannot be demonstrated
 * here using the design system, that is a signal the design system is missing it —
 * not a licence to build a one-off component.
 */

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="border-t border-[var(--border-subtle)] py-10 first:border-t-0">
      <Text as="h2" level="heading" tone="primary">
        {title}
      </Text>
      {note && (
        <Text level="secondary" tone="muted" measure="comfortable" className="mt-1">
          {note}
        </Text>
      )}
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Swatch({ token, value, label }: { token: string; value: string; label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="size-10 shrink-0 rounded-md border border-[var(--border-default)]"
        style={{ background: value }}
      />
      <div className="min-w-0">
        <Text level="caption" tone="primary" weight="medium" truncate>
          {label ?? token}
        </Text>
        <Text level="micro" tone="subtle">
          {token}
        </Text>
      </div>
    </div>
  )
}

const NEUTRALS = [0, 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 950]
const BRAND = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const SPACING = [1, 2, 3, 4, 6, 8, 12, 16, 24]
const RADII = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full'] as const
const SHADOWS = ['raised', 'lifted', 'focus', 'overlay'] as const
const LEVELS = [
  'display',
  'title',
  'heading',
  'subheading',
  'body',
  'secondary',
  'caption',
  'micro',
] as const

export default function Showcase() {
  const [focusOpen, setFocusOpen] = useState(false)
  const [revealed, setRevealed] = useState(true)

  return (
    <div className="mx-auto min-h-svh max-w-5xl px-6 py-12">
      <header className="pb-6">
        <StatusIndicator tone="warning" dot>
          Development tool — not part of the product
        </StatusIndicator>
        <Text as="h1" level="title" tone="primary" className="mt-4">
          Design System Showcase
        </Text>
        <Text level="secondary" tone="muted" measure="comfortable" className="mt-1">
          Every element below is rendered from the design system. Nothing here is
          bespoke.
        </Text>
      </header>

      <Section title="Typography" note="Hierarchy from size, weight and space — never boxes or borders.">
        <div className="space-y-4">
          {LEVELS.map((level) => (
            <div key={level} className="flex flex-wrap items-baseline gap-4">
              <Text level="micro" tone="subtle" className="w-24 shrink-0">
                {level}
              </Text>
              <Text level={level} tone="primary">
                Invasive ductal carcinoma
              </Text>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Neutrals" note="Neutrals dominate the interface.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {NEUTRALS.map((step) => (
            <Swatch key={step} token={`neutral-${step}`} value={`var(--color-neutral-${step})`} />
          ))}
        </div>
      </Section>

      <Section title="Brand" note="Appears only where something is actionable or active.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {BRAND.map((step) => (
            <Swatch key={step} token={`brand-${step}`} value={`var(--color-brand-${step})`} />
          ))}
        </div>
      </Section>

      <Section
        title="Disease severity"
        note="Reserved exclusively for the Body. Literal hex values, because three.js cannot parse CSS variables. Never the only indicator — the label is always present."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {SEVERITY_LEVELS.map((level) => (
            <Swatch
              key={level}
              token={`severity-${level}`}
              value={severityScale[level]}
              label={severityLabel(level)}
            />
          ))}
        </div>
      </Section>

      <Section
        title="Plain language"
        note="Every space must be understandable without training. Patients and oncologists both use this, and neither arrives having read a manual."
      >
        <div className="space-y-8">
          <Orientation
            title="Body"
            actions={<Control intent="secondary" size="sm">An action</Control>}
          >
            One plain sentence saying what this space shows and what to do with
            it. Every space opens with one.
          </Orientation>

          <PlainExplanation summary="What the colours on the body mean">
            <SeverityLegend />
          </PlainExplanation>

          <PlainExplanation summary="What does the confidence figure mean?">
            Collapsed by default, so an explanation is always available and never
            competes with clinical content.
          </PlainExplanation>
        </div>
      </Section>

      <Section title="Semantic tokens" note="What components actually consume.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Swatch token="--surface-base" value="var(--surface-base)" />
          <Swatch token="--surface-raised" value="var(--surface-raised)" />
          <Swatch token="--surface-sunken" value="var(--surface-sunken)" />
          <Swatch token="--surface-inverse" value="var(--surface-inverse)" />
          <Swatch token="--accent" value="var(--accent)" />
          <Swatch token="--accent-subtle" value="var(--accent-subtle)" />
          <Swatch token="--border-default" value="var(--border-default)" />
          <Swatch token="--focus-ring" value="var(--focus-ring)" />
        </div>
      </Section>

      <Section title="Status indicators" note="Status is never communicated by color alone — the text is required by the type system.">
        <div className="flex flex-wrap gap-3">
          <StatusIndicator tone="neutral">Uploaded</StatusIndicator>
          <StatusIndicator tone="info" dot>
            Processing
          </StatusIndicator>
          <StatusIndicator tone="success" dot>
            Processed
          </StatusIndicator>
          <StatusIndicator tone="danger" dot>
            Processing failed
          </StatusIndicator>
          <StatusIndicator tone="warning">Pending</StatusIndicator>
          <StatusIndicator tone="accent">In progress</StatusIndicator>
        </div>
      </Section>

      <Section title="Controls" note="Four intents. Danger only for destructive actions.">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Control intent="primary">Primary</Control>
            <Control intent="secondary">Secondary</Control>
            <Control intent="quiet">Quiet</Control>
            <Control intent="danger">Danger</Control>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Control size="sm">Small</Control>
            <Control size="md">Medium</Control>
            <Control size="lg">Large</Control>
            <Control size="icon" aria-label="Search">
              <Icon icon={Search} size="sm" />
            </Control>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Control intent="primary" disabled>
              Disabled primary
            </Control>
            <Control intent="secondary" disabled>
              Disabled secondary
            </Control>
            <Control intent="primary">
              <Icon icon={Upload} size="sm" />
              With icon
            </Control>
          </div>

          <Text level="caption" tone="muted">
            Hover, press and keyboard-focus each control to verify interaction states.
            Tab moves focus; the ring is never removed.
          </Text>
        </div>
      </Section>

      <Section title="Surfaces and elevation" note="Four levels, matching the four depth levels.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SHADOWS.map((elevation) => (
            <Surface
              key={elevation}
              elevation={elevation === 'raised' ? 'raised' : elevation === 'lifted' ? 'lifted' : elevation === 'focus' ? 'focus' : 'overlay'}
              radius="lg"
              inset="md"
            >
              <Text level="caption" tone="primary" weight="medium">
                {elevation}
              </Text>
              <Text level="micro" tone="subtle">
                shadow-{elevation}
              </Text>
            </Surface>
          ))}
        </div>
      </Section>

      <Section title="Panels" note="Permitted only for comparing discrete items — never as a grid of cards.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Panel>
            <Text level="micro" tone="subtle">
              Previous
            </Text>
            <Text level="subheading" tone="primary" className="mt-1">
              10 Mar 2026
            </Text>
            <Text level="secondary" tone="muted" className="mt-2">
              Primary lesion 1.8 cm
            </Text>
          </Panel>
          <Panel>
            <Text level="micro" tone="subtle">
              Current
            </Text>
            <Text level="subheading" tone="primary" className="mt-1">
              10 Jun 2026
            </Text>
            <Text level="secondary" tone="muted" className="mt-2">
              Primary lesion 0.9 cm
            </Text>
          </Panel>
        </div>
      </Section>

      <Section title="Border radius">
        <div className="flex flex-wrap gap-4">
          {RADII.map((radius) => (
            <div key={radius} className="text-center">
              <div
                className="size-16 border border-[var(--border-default)] bg-[var(--surface-raised)]"
                style={{ borderRadius: `var(--radius-${radius})` }}
              />
              <Text level="micro" tone="subtle" className="mt-2">
                {radius}
              </Text>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing scale" note="4px base. Negative space is a design element.">
        <div className="space-y-2">
          {SPACING.map((step) => (
            <div key={step} className="flex items-center gap-4">
              <Text level="micro" tone="subtle" className="w-10 shrink-0">
                {step}
              </Text>
              <div
                className="h-3 rounded-xs bg-[var(--accent)]"
                style={{ width: `calc(var(--spacing) * ${step})` }}
              />
              <Text level="micro" tone="subtle">
                {step * 4}px
              </Text>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Icons" note="One family throughout. Decorative by default; labelled when they carry meaning.">
        <div className="flex flex-wrap items-end gap-6">
          {(['xs', 'sm', 'md', 'lg'] as const).map((size) => (
            <div key={size} className="text-center">
              <Icon icon={Activity} size={size} className="text-[var(--accent)]" />
              <Text level="micro" tone="subtle" className="mt-2">
                {size}
              </Text>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Icon icon={Check} size="sm" className="text-[var(--status-success-text)]" />
            <Icon icon={AlertTriangle} size="sm" className="text-[var(--status-warning-text)]" />
            <Icon icon={FileText} size="sm" className="text-[var(--text-muted)]" />
          </div>
        </div>
      </Section>

      <Section
        title="Motion and animation timing"
        note="Three durations, inside the 180-420ms envelope. Enable reduced motion in your OS to verify everything collapses to 0ms without losing information."
      >
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {(Object.keys(duration) as (keyof typeof duration)[]).map((token) => (
              <Surface key={token} elevation="raised" radius="md" border="subtle" inset="sm">
                <Text level="caption" tone="primary" weight="medium">
                  {token}
                </Text>
                <Text level="micro" tone="subtle">
                  {duration[token]}ms
                </Text>
              </Surface>
            ))}
          </div>

          <div>
            <Control intent="secondary" onClick={() => setRevealed((v) => !v)}>
              {revealed ? 'Hide' : 'Reveal'} staggered content
            </Control>
            <div className="mt-4 space-y-2">
              {[0, 1, 2, 3].map((index) => (
                <Reveal key={index} show={revealed} index={index}>
                  <Surface elevation="raised" radius="md" border="subtle" inset="sm">
                    <Text level="secondary" tone="body">
                      Revealed item {index + 1}
                    </Text>
                  </Surface>
                </Reveal>
              ))}
            </div>
          </div>

          <Text level="micro" tone="subtle">
            easing enter [{easing.enter.join(', ')}] · exit [{easing.exit.join(', ')}]
          </Text>
        </div>
      </Section>

      <Section title="Focus layer" note="Depth 3. Opens above the space behind it, which stays visible and recedes.">
        <Control intent="primary" onClick={() => setFocusOpen(true)}>
          Open Focus layer
        </Control>
        <FocusLayer
          open={focusOpen}
          onOpenChange={setFocusOpen}
          title="Contrast-Enhanced MRI — Breast"
          description="Focus never replaces the space behind it. Press Escape, or use the close control, to return one depth level."
          eyebrow={<StatusIndicator tone="success" dot>Processed</StatusIndicator>}
          footer={
            <>
              <Control intent="quiet" onClick={() => setFocusOpen(false)}>
                Close
              </Control>
              <Control intent="primary" onClick={() => setFocusOpen(false)}>
                Confirm
              </Control>
            </>
          }
        >
          <Text level="body" tone="body" measure="comfortable">
            Focus traps keyboard navigation, returns focus to the control that opened
            it, and locks background scrolling. The surrounding space remains mounted
            beneath the scrim.
          </Text>
        </FocusLayer>
      </Section>

      <Section
        title="Cinematic layer — Entry only"
        note="A separate vocabulary for Depth 0, where no clinical information exists. The build fails if anything outside the Entry imports it."
      >
        <div className="relative overflow-hidden rounded-2xl bg-[var(--cinema-void)] p-10">
          <LightField />
          <div className="relative">
            <EdgeLabel>Edge label</EdgeLabel>
            <Rise
              as="h3"
              beat={1}
              className="mt-5 text-[2.5rem] font-semibold leading-[0.9] tracking-[-0.035em] text-[var(--cinema-ink)]"
            >
              A line that rises.
            </Rise>
            <Settle beat={2} className="mt-6 flex items-center gap-4">
              <Ordinal value={1} />
              <Hairline className="max-w-24" />
              <span className="text-secondary text-[var(--cinema-ink)]/60">
                Content that settles.
              </span>
            </Settle>
            <div className="mt-8 flex flex-wrap gap-3">
              <CinematicAction to="#">Solid action</CinematicAction>
              <CinematicJump href="#">Jump within the page</CinematicJump>
            </div>
            <div className="mt-8">
              <Marquee items={['One phrase', 'Another phrase', 'A third phrase']} />
            </div>
          </div>
          <Grain />
        </div>
      </Section>

      <Section title="Accessibility" note="Verifiable behaviours.">
        <ul className="space-y-2">
          {[
            'Every interactive element is reachable and operable by keyboard.',
            'Focus indicators meet 3:1 contrast and are never removed.',
            'No state is communicated by color alone.',
            'Reduced motion collapses all durations without losing information.',
            'Icon-only controls carry an accessible name.',
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Icon icon={Check} size="xs" className="mt-1 text-[var(--status-success-text)]" />
              <Text level="secondary" tone="body">
                {line}
              </Text>
            </li>
          ))}
        </ul>
        <VisuallyHidden>
          This text is available to screen readers but not rendered visually.
        </VisuallyHidden>
      </Section>
    </div>
  )
}
