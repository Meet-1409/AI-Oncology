import { useId, useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import type { ReactNode } from 'react'
import { Icon, Surface, Text } from '@/components/primitives'
import { SEVERITY_LEVELS, severityColor, severityLabel, severityMeaning } from '@/lib/status'
import { cn } from '@/lib/utils'

/**
 * Orientation.
 *
 * "Every space should be understandable without training" [04 §28], and the
 * product must be "immediately understandable without training" [01]. The people
 * using this are patients and oncologists, not software users — nobody arrives
 * having read a manual, and a patient may be reading their own cancer record for
 * the first time.
 *
 * So every space states, in one plain sentence, what it is showing and what can
 * be done with it. This is the cheapest possible intervention with the largest
 * possible effect on comprehension, and it costs one line of vertical space.
 *
 * It is a heading region, not decoration: screen readers reach it in the normal
 * reading order, before the content it describes.
 */

export interface OrientationProps {
  /** What this space is, in the product's own vocabulary. */
  title: string
  /** One plain sentence: what it shows, and what to do with it. */
  children: ReactNode
  /** Optional actions belonging to the space as a whole. */
  actions?: ReactNode
  className?: string
}

export function Orientation({ title, children, actions, className }: OrientationProps) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0 flex-1">
        <Text as="h2" level="title" tone="primary">
          {title}
        </Text>
        {/* Deliberately not muted to the point of being skippable — this line is
            the one that makes the space make sense. */}
        <Text level="secondary" tone="body" className="mt-1.5 max-w-2xl">
          {children}
        </Text>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/**
 * A short explanation the reader can open when they want it.
 *
 * Used where a concept genuinely needs more than a sentence — confidence,
 * severity, what the AI did and did not do. Collapsed by default so it never
 * competes with clinical content, and it is a real <details>-style disclosure,
 * so it works with assistive technology and with JavaScript disabled styling.
 */
export function PlainExplanation({
  summary,
  children,
  className,
}: {
  summary: string
  children: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={id}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md py-1',
          'text-caption text-[var(--accent)]',
          'transition-colors duration-[var(--motion-quick)] hover:text-[var(--accent-hover)]',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
        )}
      >
        <Icon icon={Info} size="xs" />
        {summary}
        <Icon
          icon={ChevronDown}
          size="xs"
          className={cn(
            'transition-transform duration-[var(--motion-quick)]',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        // Deliberately not wrapped in Text: callers pass structured content
        // (the severity legend is a definition list), and nesting block content
        // inside a paragraph produces invalid markup that assistive technology
        // reads unpredictably.
        <Surface
          elevation="sunken"
          radius="md"
          inset="sm"
          id={id}
          className="mt-2 text-secondary text-[var(--text-body-color)]"
        >
          {children}
        </Surface>
      )}
    </div>
  )
}

/**
 * The severity scale, explained.
 *
 * Colour alone never carries severity [00 §16.2], and the short clinical labels
 * are not self-explanatory to a patient. The legend gives the whole scale at
 * once — swatch, label and a plain sentence — so a reader can interpret any
 * colour they see on the Body without asking anyone.
 *
 * Rendered as a definition list: the association between a level and its meaning
 * is carried by the markup, not by visual adjacency alone.
 */
export function SeverityLegend({ className }: { className?: string }) {
  return (
    <div className={className}>
      <Text level="micro" tone="subtle" className="mb-3">
        What the colours mean
      </Text>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {SEVERITY_LEVELS.map((level) => (
          <div key={level} className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="severity-swatch mt-1 size-3 shrink-0 rounded-full ring-1 ring-inset ring-[var(--severity-ring)]"
              style={{ background: severityColor(level) }}
            />
            <div className="min-w-0">
              <dt>
                <Text as="span" level="caption" tone="primary" weight="medium">
                  {severityLabel(level)}
                </Text>
              </dt>
              <dd>
                <Text level="caption" tone="muted">
                  {severityMeaning(level)}
                </Text>
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  )
}
