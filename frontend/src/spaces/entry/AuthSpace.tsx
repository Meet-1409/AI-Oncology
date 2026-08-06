import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, AlertCircle, ArrowLeft, ArrowRight, Stethoscope, UserRound } from 'lucide-react'
import { Control, Field, Icon, Input, Text } from '@/components/primitives'
import { Swap } from '@/components/motion'
import { DemoBodyPreview } from '@/features/body'
import { useSignIn } from '@/data/queries'
import { paths } from '@/routes/paths'
import type { UserRole } from '@/types'
import { cn } from '@/lib/utils'

/**
 * Authentication — Depth 0.
 *
 * The frontend does NOT authenticate. Credentials are collected and handed to the
 * backend, which performs authentication and authorization [02 §3], [02 §6]. This
 * space records the returned identity and descends into the correct Home Space
 * [03 §4].
 *
 * ONE CONTINUOUS SPACE, not a split screen. This used to be a white marketing
 * panel beside a dark form — which in the dark theme put a full-height white
 * slab on screen, and in either theme read as a template. Arriving here from the
 * Entry now feels like moving further into the same room: the figure the visitor
 * just watched assemble out of points is standing here in solid form, and the
 * two ways in are set beside it.
 *
 * Two distinct entry points, not a role dropdown — a patient and a doctor are
 * choosing between two different products they'll each use for years, and that
 * choice deserves to be the first, most visible thing on the screen rather than
 * a small field buried in a shared form.
 */

const ROLE_COPY: Record<UserRole, { title: string; description: string; icon: typeof UserRound }> = {
  patient: {
    title: "I'm a patient",
    description: 'See your reports, your care team, and your own record in one place.',
    icon: UserRound,
  },
  oncologist: {
    title: "I'm a doctor",
    description: 'Manage your patients, review reports, and track every case.',
    icon: Stethoscope,
  },
}

/**
 * A way in, not a card.
 *
 * Same language as the patient roster: a full-width row, a hairline that draws
 * itself on approach, no fill and no lift. Two boxes side by side is what every
 * sign-in screen does; this reads as two doors in one wall.
 */
function RoleRow({
  role,
  onSelect,
  onPreview,
}: {
  role: UserRole
  onSelect: (role: UserRole) => void
  /** Hovering a way in shows what it leads to, ON the figure. */
  onPreview: (role: UserRole | null) => void
}) {
  const copy = ROLE_COPY[role]
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      onPointerEnter={() => onPreview(role)}
      onPointerLeave={() => onPreview(null)}
      onFocus={() => onPreview(role)}
      onBlur={() => onPreview(null)}
      className={cn(
        'group relative flex w-full items-center gap-5 border-b border-[var(--border-subtle)] py-6 text-left',
        'transition-colors duration-[var(--motion-quick)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-[-1px] h-px origin-left scale-x-0',
          'bg-[var(--text-primary)] transition-transform duration-[var(--motion-reveal)]',
          'ease-[var(--motion-ease-enter)] group-hover:scale-x-100 group-focus-visible:scale-x-100',
        )}
      />
      <Icon icon={copy.icon} size="md" className="shrink-0 text-[var(--text-muted)]" />
      <span className="min-w-0 flex-1">
        <Text as="span" level="heading" tone="primary" className="block font-display">
          {copy.title}
        </Text>
        <Text as="span" level="caption" tone="muted" className="mt-1 block max-w-[38ch]">
          {copy.description}
        </Text>
      </span>
      <Icon
        icon={ArrowRight}
        size="sm"
        className={cn(
          'shrink-0 text-[var(--text-subtle)]',
          'transition-transform duration-[var(--motion-reveal)] ease-[var(--motion-ease-enter)]',
          'group-hover:translate-x-1',
        )}
      />
    </button>
  )
}

export default function AuthSpace() {
  const navigate = useNavigate()
  const signIn = useSignIn()

  const [role, setRole] = useState<UserRole | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<UserRole | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!role) return

    if (!email.trim() || !password.trim()) {
      setError('Enter your email address and password to continue.')
      return
    }
    setError(null)

    try {
      await signIn.mutateAsync({ role, email: email.trim() })
      navigate(paths.home)
    } catch {
      setError('We could not sign you in. Check your details and try again.')
    }
  }

  return (
    <main className="relative isolate flex min-h-svh flex-col bg-[var(--surface-base)]">
      {/* The same lit volume the rest of the application stands in. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ backgroundImage: 'var(--atmosphere)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ backgroundImage: 'var(--atmosphere-floor)' }}
      />

      {/* The figure, standing in the room rather than illustrating a panel. */}
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 hidden w-[46%] lg:block',
          'lg:[mask-image:linear-gradient(to_right,transparent,black_22%)]',
        )}
      >
        <DemoBodyPreview
          className="pointer-events-auto h-full w-full"
          idleSpin
          // A doctor is here to look inside; a patient is here to see
          // themselves. Hovering either way in previews that on the body
          // before the choice is made.
          emphasis={preview === 'oncologist' ? 'organs' : preview === 'patient' ? 'skin' : null}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14">
        <Link to={paths.entry} className="flex items-center gap-2.5 no-underline">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent)]">
            <Icon icon={Activity} size="sm" className="text-[var(--text-on-accent)]" />
          </span>
          <Text as="span" level="subheading" tone="primary">
            AI Oncology
          </Text>
        </Link>

        <div className="flex flex-1 items-center">
          <div className="w-full lg:max-w-[48%]">
            <Swap swapKey={role ?? 'choose'}>
            {!role ? (
              <>
                <Text as="p" level="micro" tone="subtle" className="uppercase">
                  Patient Intelligence Platform
                </Text>
                <Text as="h1" level="display" tone="primary" className="mt-3 font-display">
                  Sign in
                </Text>
                <Text level="body" tone="muted" className="mt-4 max-w-[40ch]">
                  Two ways in, because a patient and an oncologist are here for
                  two different things.
                </Text>

                <div className="mt-10">
                  <RoleRow role="patient" onSelect={setRole} onPreview={setPreview} />
                  <RoleRow role="oncologist" onSelect={setRole} onPreview={setPreview} />
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setRole(null)
                    setError(null)
                  }}
                  className={cn(
                    'flex items-center gap-1.5 text-secondary text-[var(--text-subtle)]',
                    'transition-colors hover:text-[var(--text-primary)]',
                  )}
                >
                  <Icon icon={ArrowLeft} size="xs" />
                  Choose a different account type
                </button>

                <Text as="h1" level="display" tone="primary" className="mt-6 font-display">
                  {ROLE_COPY[role].title}
                </Text>

                <form onSubmit={handleSubmit} className="mt-8 max-w-sm space-y-5" noValidate>
                  <Field label="Email address" required>
                    {({ id, invalid }) => (
                      <Input
                        id={id}
                        type="email"
                        autoComplete="username"
                        value={email}
                        aria-invalid={invalid}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        autoFocus
                      />
                    )}
                  </Field>

                  <Field label="Password" required>
                    {({ id, invalid }) => (
                      <Input
                        id={id}
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        aria-invalid={invalid}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                      />
                    )}
                  </Field>

                  {error && (
                    <div
                      role="alert"
                      className={cn(
                        'flex items-start gap-2 rounded-md px-3 py-2.5',
                        'bg-[var(--status-danger-surface)] text-[var(--status-danger-text)]',
                      )}
                    >
                      <Icon icon={AlertCircle} size="sm" className="mt-0.5 shrink-0" />
                      <Text as="span" level="caption" tone="danger">
                        {error}
                      </Text>
                    </div>
                  )}

                  <Control type="submit" intent="primary" size="lg" block disabled={signIn.isPending}>
                    {signIn.isPending ? 'Signing in…' : 'Sign in'}
                    {signIn.isPending ? (
                      <span
                        aria-hidden
                        className={cn(
                          'size-4 shrink-0 rounded-full border-2 border-current border-r-transparent',
                          'motion-safe:animate-spin',
                        )}
                      />
                    ) : (
                      <Icon icon={ArrowRight} size="sm" />
                    )}
                  </Control>
                </form>
              </>
            )}
            </Swap>

            <Text level="caption" tone="subtle" className="mt-10 max-w-[52ch]">
              Authentication is performed by the backend. This interface collects
              credentials and records the identity it returns; it never verifies
              them itself.
            </Text>

            <Text level="caption" tone="subtle" className="mt-4">
              <Link to={paths.entry} className="underline underline-offset-4">
                Return to the introduction
              </Link>
            </Text>
          </div>
        </div>
      </div>
    </main>
  )
}
