import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Text } from './text'

/**
 * Form controls.
 *
 * Every input has a label, required fields are obvious, and validation messages
 * explain how to fix the issue [04 §12]. The label/description/error wiring is
 * done once here so no form can accidentally ship an unlabelled control.
 */

const controlSurface = [
  'w-full rounded-md border bg-[var(--surface-raised)] text-body text-[var(--text-body-color)]',
  'border-[var(--border-default)] placeholder:text-[var(--text-subtle)]',
  'transition-[border-color,box-shadow] duration-[var(--motion-quick)]',
  'focus-visible:outline-none focus-visible:border-[var(--focus-ring)]',
  'focus-visible:ring-2 focus-visible:ring-[var(--accent-subtle)]',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-[invalid=true]:border-[var(--status-danger-text)]',
].join(' ')

export interface FieldProps {
  label: string
  /** Supporting text shown beneath the label. */
  description?: string
  /** Validation message. Presence marks the control invalid. */
  error?: string
  required?: boolean
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode
  className?: string
}

export function Field({ label, description, error, required, children, className }: FieldProps) {
  const id = useId()
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={id} className="flex items-center gap-1">
        <Text as="span" level="secondary" tone="primary" weight="medium">
          {label}
        </Text>
        {required && (
          <>
            <span aria-hidden className="text-[var(--status-danger-text)]">
              *
            </span>
            <span className="sr-only">(required)</span>
          </>
        )}
      </label>

      {description && (
        <Text id={descriptionId} level="caption" tone="muted">
          {description}
        </Text>
      )}

      {children({ id, describedBy, invalid: Boolean(error) })}

      {error && (
        <Text id={errorId} level="caption" tone="danger" role="alert">
          {error}
        </Text>
      )}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlSurface, 'h-10 px-3', className)} {...props} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(controlSurface, 'resize-y px-3 py-2', className)}
        {...props}
      />
    )
  },
)

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps
  extends Omit<InputHTMLAttributes<HTMLSelectElement>, 'children' | 'size'> {
  options: readonly SelectOption[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, options, ...props },
  ref,
) {
  return (
    <select ref={ref} className={cn(controlSurface, 'h-10 px-3', className)} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
})
