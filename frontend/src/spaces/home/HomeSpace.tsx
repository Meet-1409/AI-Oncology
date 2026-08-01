import { lazy, Suspense } from 'react'
import { Navigate } from 'react-router-dom'
import { LoadingSurface } from '@/components/patterns'
import { useSessionStore } from '@/state/session-store'
import { paths } from '@/routes/paths'

/**
 * Home Space — Depth 1.
 *
 * One address, two spaces, resolved from the session role [03 §4]. This keeps the
 * environment feeling like a single place rather than two applications, and avoids
 * a role-prefixed URL scheme users would have to remember [00 §10.6].
 *
 * Each role's space is code-split, so a patient never downloads the practice
 * surface and vice versa.
 */

const PatientHomeSpace = lazy(() => import('./PatientHomeSpace'))
const PracticeSpace = lazy(() => import('./PracticeSpace'))

export default function HomeSpace() {
  const { isAuthenticated, role } = useSessionStore()

  if (!isAuthenticated || !role) {
    return <Navigate to={paths.enter} replace />
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
          <LoadingSurface lines={4} />
        </div>
      }
    >
      {role === 'patient' ? <PatientHomeSpace /> : <PracticeSpace />}
    </Suspense>
  )
}
