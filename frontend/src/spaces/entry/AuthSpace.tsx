import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, AlertCircle, ArrowRight } from 'lucide-react'
import { Control, Field, Icon, Input, Select, Surface, Text } from '@/components/primitives'
import { useSignIn } from '@/data/queries'
import { paths } from '@/routes/paths'
import { patients } from '@/data/mock-data'
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
 * Signing in is presented as entering the environment, not as a jump to an
 * unrelated page — the Entry remains behind the user [03 §4].
 *
 * Failure renders in place; the user stays at the sign-in step [03 §4].
 */

const ROLE_OPTIONS = [
  { value: 'oncologist', label: 'Oncologist' },
  { value: 'patient', label: 'Patient' },
] as const

export default function AuthSpace() {
  const navigate = useNavigate()
  const signIn = useSignIn()

  const [role, setRole] = useState<UserRole>('oncologist')
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Enter your email address and password to continue.')
      return
    }
    setError(null)

    try {
      await signIn.mutateAsync(role === 'patient' ? { role, patientId } : { role })
      navigate(paths.home)
    } catch {
      setError('We could not sign you in. Check your details and try again.')
    }
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/* The environment the user is entering, held quietly alongside the form. */}
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
          <Text level="secondary" className="mt-4 text-white/60">
            Patient Intelligence Platform
          </Text>
        </div>

        <Text level="caption" className="text-white/40">
          Assists the oncologist. Never replaces clinical judgement.
        </Text>
      </aside>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link to={paths.entry} className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--accent)]">
              <Icon icon={Activity} size="sm" className="text-[var(--text-on-accent)]" />
            </span>
            <Text as="span" level="subheading" tone="primary">
              AI Oncology
            </Text>
          </Link>

          <Text as="h1" level="title" tone="primary">
            Sign in
          </Text>
          <Text level="secondary" tone="muted" className="mt-2">
            Continue to your space.
          </Text>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <Field label="I am signing in as" required>
              {({ id }) => (
                <Select
                  id={id}
                  options={ROLE_OPTIONS}
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                />
              )}
            </Field>

            {role === 'patient' && (
              <Field
                label="Patient record"
                description="Until the backend is connected, this selects which record to open."
              >
                {({ id, describedBy }) => (
                  <Select
                    id={id}
                    aria-describedby={describedBy}
                    options={patients.map((p) => ({
                      value: p.id,
                      label: `${p.name} — ${p.patientCode}`,
                    }))}
                    value={patientId}
                    onChange={(event) => setPatientId(event.target.value)}
                  />
                )}
              </Field>
            )}

            <Field label="Email address" required>
              {({ id, invalid }) => (
                <Input
                  id={id}
                  type="email"
                  autoComplete="username"
                  value={email}
                  aria-invalid={invalid}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@hospital.example"
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

            <Control
              type="submit"
              intent="primary"
              size="lg"
              block
              disabled={signIn.isPending}
            >
              {signIn.isPending ? 'Signing in…' : 'Sign in'}
              {!signIn.isPending && <Icon icon={ArrowRight} size="sm" />}
            </Control>
          </form>

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
