import type { ElementType, HTMLAttributes } from 'react'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Typography.
 *
 * Hierarchy comes from size, weight and space rather than boxes and borders
 * [04 §8]. Typography leads the interface; chrome recedes.
 *
 * Visual level and semantic element are separate props on purpose. A heading that
 * should look small must still be an <h2> if that is what the document structure
 * requires — coupling the two produces either wrong visuals or a broken heading
 * outline for screen reader users [00 §16.5].
 */

const textVariants = cva('', {
  variants: {
    /** Visual level from the type scale. */
    level: {
      display: 'text-display font-display',
      title: 'text-title font-display',
      heading: 'text-heading',
      subheading: 'text-subheading',
      body: 'text-body',
      secondary: 'text-secondary',
      caption: 'text-caption',
      /** Labels only. Never clinical values [blueprint 03 §3.2]. */
      micro: 'text-micro uppercase',
    },
    tone: {
      primary: 'text-[var(--text-primary)]',
      body: 'text-[var(--text-body-color)]',
      muted: 'text-[var(--text-muted)]',
      subtle: 'text-[var(--text-subtle)]',
      accent: 'text-[var(--accent)]',
      onInverse: 'text-[var(--text-on-inverse)]',
      success: 'text-[var(--status-success-text)]',
      warning: 'text-[var(--status-warning-text)]',
      danger: 'text-[var(--status-danger-text)]',
      info: 'text-[var(--status-info-text)]',
    },
    weight: {
      regular: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
    },
    /** Caps reading measure. Long paragraphs are avoided [04 §8]. */
    measure: {
      none: '',
      comfortable: 'max-w-[62ch]',
      narrow: 'max-w-[46ch]',
    },
    truncate: {
      /** Long text must never break the layout [04 §13]. */
      true: 'truncate',
      false: '',
    },
  },
  defaultVariants: {
    level: 'body',
    tone: 'body',
    measure: 'none',
    truncate: false,
  },
})

type TextVariants = VariantProps<typeof textVariants>

export interface TextProps extends HTMLAttributes<HTMLElement>, TextVariants {
  /** Semantic element. Defaults to <p>; set explicitly for headings. */
  as?: ElementType
}

export function Text({
  as,
  level,
  tone,
  weight,
  measure,
  truncate,
  className,
  ...props
}: TextProps) {
  const Component = (as ?? 'p') as ElementType<HTMLAttributes<HTMLElement>>
  return (
    <Component
      className={cn(textVariants({ level, tone, weight, measure, truncate }), className)}
      {...props}
    />
  )
}

/**
 * Content available to screen readers but not visually rendered.
 * Used wherever meaning is carried visually and needs a text equivalent
 * [00 §16.2], [00 §16.4].
 */
export function VisuallyHidden({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'absolute -m-px h-px w-px overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]',
        className,
      )}
      {...props}
    />
  )
}
