import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, AlertCircle, ArrowLeft, ArrowRight, Stethoscope, UserRound } from 'lucide-react'
import { Control, Field, Icon, Input, Surface, Text } from '@/components/primitives'
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

function RoleCard({
  role,
  onSelect,
}: {
  role: UserRole
  onSelect: (role: UserRole) => void
}) {
  const copy = ROLE_COPY[role]
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className={cn(
        'group relative flex flex-1 flex-col items-start gap-4 overflow-hidden rounded-2xl p-8 text-left',
        'border border-[var(--border-subtle)] bg-[var(--surface-raised)]',
        'transition-[transform,border-color,box-shadow] duration-300 ease-out',
        'hover:-translate-y-1 hover:border-[var(--accent-border)] hover:shadow-lifted',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]',
        'motion-reduce:hover:translate-y-0',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'flex size-12 items-center justify-center rounded-xl',
          'bg-[var(--accent-subtle)] text-[var(--accent)]',
          'transition-transform duration-300 ease-out group-hover:scale-110',
        )}
      >
        <Icon icon={copy.icon} size="md" />
      </span>
      <div>
        <Text as="h2" level="heading" tone="primary">
          {copy.title}
        </Text>
        <Text level="secondary" tone="muted" className="mt-1.5 max-w-[26ch]">
          {copy.description}
        </Text>
      </div>
      <span className="mt-auto flex items-center gap-1.5 text-secondary font-medium text-[var(--accent)]">
        Continue
        <Icon
          icon={ArrowRight}
          size="xs"
          className="transition-transform duration-300 ease-out group-hover:translate-x-1"
        />
      </span>
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
    <main className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between bg-[var(--surface-inverse)] p-12 lg:flex">
        <Link to={paths.entry} className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
            <Icon icon={Activity} size="sm" className="text-[var(--text-on-inverse)]" />
          </span>
          <Text as="span" level="subheading" tone="onInverse">
            AI Oncology
          </Text>
        </Link>

        <div>
          <Text level="title" tone="onInverse" measure="comfortable">
            One organized view of a patient's entire cancer journey.
          </Text>
          <Text level="secondary" tone="onInverse" className="mt-4 opacity-60">
            Patient Intelligence Platform
          </Text>
        </div>

        <Text level="caption" tone="onInverse" className="opacity-40">
          Assists the oncologist. Never replaces clinical judgement.
        </Text>
      </aside>

      <div className="flex items-center justify-center px-6 py-16">
        <div className={cn('w-full transition-[max-width] duration-300', role ? 'max-w-sm' : 'max-w-2xl')}>
          <Link to={paths.entry} className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent)]">
              <Icon icon={Activity} size="sm" className="text-[var(--text-on-accent)]" />
            </span>
            <Text as="span" level="subheading" tone="primary">
              AI Oncology
            </Text>
          </Link>

          {!role ? (
            <>
              <Text as="h1" level="title" tone="primary">
                Sign in
              </Text>
              <Text level="secondary" tone="muted" className="mt-2">
                Continue to your space.
              </Text>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <RoleCard role="patient" onSelect={setRole} />
                <RoleCard role="oncologist" onSelect={setRole} />
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
                className="mb-6 flex items-center gap-1.5 text-secondary text-[var(--text-subtle)] transition-colors hover:text-[var(--text-primary)]"
              >
                <Icon icon={ArrowLeft} size="xs" />
                Choose a different account type
              </button>

              <Text as="h1" level="title" tone="primary">
                {ROLE_COPY[role].title}
              </Text>
              <Text level="secondary" tone="muted" className="mt-2">
                Continue to your space.
              </Text>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
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
                  {!signIn.isPending && <Icon icon={ArrowRight} size="sm" />}
                </Control>
              </form>
            </>
          )}

          <Surface elevation="sunken" radius="lg" inset="sm" className="mt-8">
            <Text level="caption" tone="muted">
              Authentication is performed by the backend. This interface collects
              credentials and records the identity it returns; it never verifies them
              itself.
            </Text>
          </Surface>

          <Text level="caption" tone="subtle" className="mt-6 text-center">
            <Link to={paths.entry} className="underline underline-offset-4">
              Return to the introduction
            </Link>
          </Text>
        </div>
      </div>
    </main>
  )
}
