import { useState } from 'react'
import { Laptop, Monitor, Smartphone } from 'lucide-react'
import type { IconComponent } from '@/components/primitives'
import { Control, Field, Icon, Input, Select, StatusIndicator, Surface, Text } from '@/components/primitives'
import { LoadingSurface, TabRail } from '@/components/patterns'
import { Reveal } from '@/components/motion'
import { useSession } from '@/data/queries'
import { usePreferencesStore } from '@/state/preferences-store'
import type { DateFormat, ThemePreference, TimeFormat } from '@/state/preferences-store'

/**
 * Account — Depth 1, beside Home Space rather than beneath it, because it belongs
 * to no Patient Case [09.10 §4].
 *
 * Deliberately quiet: entered rarely, and never competing with clinical
 * information for attention [09.10 §1].
 *
 * Passwords are never displayed [09.10 §15], and nothing here can modify clinical
 * information [09.10 §12].
 */

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'privacy', label: 'Privacy' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

const NOTIFICATION_SETTINGS = {
  patient: [
    { id: 'tasks', label: 'Tasks assigned to you' },
    { id: 'uploads', label: 'Your report uploads' },
    { id: 'notes', label: 'Notes from your oncologist' },
    { id: 'general', label: 'General updates' },
  ],
  oncologist: [
    { id: 'uploads', label: 'Patient report uploads' },
    { id: 'tasks', label: 'Task completions' },
    { id: 'ai', label: 'Analysis completion' },
    { id: 'general', label: 'General updates' },
  ],
} as const

const DEVICES: readonly { icon: IconComponent; device: string; location: string; current: boolean }[] = [
  { icon: Monitor, device: 'Windows PC · Chrome', location: 'Mumbai, India', current: true },
  { icon: Smartphone, device: 'iPhone · Safari', location: 'Mumbai, India', current: false },
  { icon: Laptop, device: 'MacBook Pro · Chrome', location: 'Pune, India', current: false },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Surface elevation="raised" radius="lg" border="subtle" inset="lg">
      <Text as="h2" level="subheading" tone="primary">
        {title}
      </Text>
      <div className="mt-5">{children}</div>
    </Surface>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 border-b border-[var(--border-subtle)] py-3 last:border-0">
      <Text as="span" level="secondary" tone="body">
        {label}
      </Text>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 rounded border-[var(--border-strong)] accent-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
      />
    </label>
  )
}

export default function AccountSpace() {
  const session = useSession()
  const preferences = usePreferencesStore()
  const [section, setSection] = useState<SectionId>('profile')
  const [saved, setSaved] = useState(false)
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    tasks: true,
    uploads: true,
    notes: true,
    ai: true,
    general: false,
  })

  if (session.isLoading || !session.data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <LoadingSurface lines={4} label="Loading your account" />
      </div>
    )
  }

  const { user, role } = session.data
  const settings = NOTIFICATION_SETTINGS[role]

  function confirmSaved() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header>
        <Text as="h1" level="title" tone="primary">
          Account
        </Text>
        <Text level="secondary" tone="muted" className="mt-1">
          Manage your details, security and preferences.
        </Text>
      </header>

      <TabRail
        className="mt-8"
        items={SECTIONS.map((entry) => ({ id: entry.id, label: entry.label }))}
        active={section}
        onSelect={setSection}
        aria-label="Account sections"
      />

      <Reveal key={section} className="mt-6 space-y-5">
        {section === 'profile' && (
          <Section title="Your details">
            <div className="space-y-4">
              <Field label="Full name">
                {({ id }) => <Input id={id} defaultValue={user.name} />}
              </Field>
              <Field label="Email address">
                {({ id }) => <Input id={id} type="email" defaultValue={user.email} />}
              </Field>
              <Field label="Mobile number">
                {({ id }) => <Input id={id} defaultValue={user.mobile ?? ''} />}
              </Field>
              <div className="flex items-center gap-3 pt-2">
                <Control intent="primary" onClick={confirmSaved}>
                  Save changes
                </Control>
                <Reveal show={saved} aria-hidden={!saved}>
                  <StatusIndicator tone="success" dot>Saved</StatusIndicator>
                </Reveal>
              </div>
            </div>
          </Section>
        )}

        {section === 'security' && (
          <>
            <Section title="Change password">
              <div className="space-y-4">
                <Field label="Current password">
                  {({ id }) => <Input id={id} type="password" autoComplete="current-password" />}
                </Field>
                <Field label="New password">
                  {({ id }) => <Input id={id} type="password" autoComplete="new-password" />}
                </Field>
                <Field label="Confirm new password">
                  {({ id }) => <Input id={id} type="password" autoComplete="new-password" />}
                </Field>
                <Control intent="primary" onClick={confirmSaved}>
                  Update password
                </Control>
              </div>
            </Section>
            <Section title="Multi-factor authentication">
              <ToggleRow
                label="Require a second step when signing in"
                checked={notifications.mfa ?? false}
                onChange={(next) => setNotifications((s) => ({ ...s, mfa: next }))}
              />
            </Section>
          </>
        )}

        {section === 'notifications' && (
          <Section title="What you are notified about">
            <div>
              {settings.map((setting) => (
                <ToggleRow
                  key={setting.id}
                  label={setting.label}
                  checked={notifications[setting.id] ?? false}
                  onChange={(next) => setNotifications((s) => ({ ...s, [setting.id]: next }))}
                />
              ))}
            </div>
          </Section>
        )}

        {section === 'preferences' && (
          <Section title="Preferences">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Theme">
                {({ id }) => (
                  <Select
                    id={id}
                    options={[
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                      { value: 'system', label: 'Match my system' },
                    ]}
                    value={preferences.theme}
                    onChange={(event) =>
                      preferences.setTheme(event.target.value as ThemePreference)
                    }
                  />
                )}
              </Field>
              <Field label="Language">
                {({ id }) => (
                  <Select
                    id={id}
                    options={[
                      { value: 'en', label: 'English' },
                      { value: 'hi', label: 'Hindi' },
                    ]}
                    value={preferences.language}
                    onChange={(event) => preferences.setLanguage(event.target.value)}
                  />
                )}
              </Field>
              <Field label="Date format">
                {({ id }) => (
                  <Select
                    id={id}
                    options={[
                      { value: 'dd-mmm-yyyy', label: '02 Aug 2026' },
                      { value: 'mm-dd-yyyy', label: '08/02/2026' },
                    ]}
                    value={preferences.dateFormat}
                    onChange={(event) =>
                      preferences.setDateFormat(event.target.value as DateFormat)
                    }
                  />
                )}
              </Field>
              <Field label="Time format">
                {({ id }) => (
                  <Select
                    id={id}
                    options={[
                      { value: '24h', label: '24 hour' },
                      { value: '12h', label: '12 hour' },
                    ]}
                    value={preferences.timeFormat}
                    onChange={(event) =>
                      preferences.setTimeFormat(event.target.value as TimeFormat)
                    }
                  />
                )}
              </Field>
              <Field label="Time zone" className="sm:col-span-2">
                {({ id }) => (
                  <Input
                    id={id}
                    value={preferences.timeZone}
                    onChange={(event) => preferences.setTimeZone(event.target.value)}
                  />
                )}
              </Field>
            </div>
            <Text level="caption" tone="subtle" className="mt-4">
              Reduced motion follows your device setting automatically.
            </Text>
          </Section>
        )}

        {section === 'sessions' && (
          <Section title="Where you are signed in">
            <ul className="space-y-3">
              {DEVICES.map((device) => (
                <li
                  key={device.device}
                  className="flex items-center justify-between gap-4 rounded-lg border border-[var(--border-subtle)] px-4 py-3"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-md bg-[var(--surface-sunken)]">
                      <Icon icon={device.icon} size="sm" className="text-[var(--text-subtle)]" />
                    </span>
                    <span>
                      <Text as="span" level="secondary" tone="primary" weight="medium">
                        {device.device}
                      </Text>
                      <Text level="caption" tone="muted">
                        {device.location}
                        {device.current ? ' · this device' : ' · last active 2 days ago'}
                      </Text>
                    </span>
                  </span>
                  {!device.current && (
                    <Control intent="secondary" size="sm">
                      Sign out
                    </Control>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {section === 'privacy' && (
          <Section title="Privacy">
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'How your data is used'].map((item) => (
                <li key={item}>
                  <Control intent="quiet" size="sm">
                    {item}
                  </Control>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </Reveal>
    </div>
  )
}
