import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Controls.
 *
 * Controls clearly indicate their purpose, and provide hover, focus and active
 * feedback [04 §11]. Four intents only:
 *
 *   primary    the main action
 *   secondary  optional actions
 *   quiet      low-emphasis, in-context actions
 *   danger     destructive actions ONLY
 *
 * Danger is never the default focus, and destructive actions are always confirmed
 * [blueprint 04 §3].
 *
 * Interaction states are expressed with color and elevation together, never color
 * alone [00 §16.2]. Transitions use the motion tokens, so reduced motion collapses
 * them automatically [00 §11.9].
 */

const controlVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-medium select-none',
    'transition-[background-color,border-color,color,box-shadow,transform]',
    'duration-[var(--motion-quick)] ease-[var(--motion-ease-standard)]',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
    'disabled:pointer-events-none disabled:opacity-45',
    // Presses register physically without becoming playful.
    'active:translate-y-px',
    '[&_svg]:shrink-0',
  ],
  {
    variants: {
      intent: {
        primary: [
          'bg-[var(--accent)] text-[var(--text-on-accent)] shadow-raised',
          'hover:bg-[var(--accent-hover)]',
          'active:bg-[var(--accent-active)]',
        ],
        secondary: [
          'bg-[var(--surface-raised)] text-[var(--text-body-color)]',
          'border border-[var(--border-default)] shadow-raised',
          'hover:bg-[var(--surface-sunken)] hover:border-[var(--border-strong)]',
          'active:bg-[var(--color-neutral-150)]',
        ],
        quiet: [
          'bg-transparent text-[var(--text-muted)]',
          'hover:bg-[var(--surface-sunken)] hover:text-[var(--text-primary)]',
          'active:bg-[var(--color-neutral-150)]',
        ],
        danger: [
          'bg-[var(--color-danger-600)] text-[var(--text-on-accent)] shadow-raised',
          'hover:bg-[var(--color-danger-700)]',
          'active:bg-[var(--color-danger-700)]',
        ],
      },
      size: {
        /** Minimum 44px touch target on coarse pointers [blueprint 03 §4.5]. */
        sm: 'h-8 rounded-md px-3 text-caption pointer-coarse:h-11',
        md: 'h-10 rounded-md px-4 text-secondary pointer-coarse:h-11',
        lg: 'h-12 rounded-lg px-6 text-body',
        icon: 'size-10 rounded-md pointer-coarse:size-11',
      },
      block: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      intent: 'secondary',
      size: 'md',
      block: false,
    },
  },
)

type ControlVariants = VariantProps<typeof controlVariants>

export interface ControlProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ControlVariants {
  /** Render as the child element, for links that should look like controls. */
  asChild?: boolean
}

export const Control = forwardRef<HTMLButtonElement, ControlProps>(function Control(
  { className, intent, size, block, asChild = false, type, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'button'
  return (
    <Component
      ref={ref}
      // Defaults to "button": an unspecified type inside a form submits it, which
      // is a real source of accidental submissions.
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(controlVariants({ intent, size, block }), className)}
      {...props}
    />
  )
})
