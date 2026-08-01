import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Providers } from './providers'
import { paths, routePattern } from '@/routes/paths'
import { LoadingSurface } from '@/components/patterns'
import { EnvironmentShell } from '@/shell/EnvironmentShell'

/**
 * The environment root.
 *
 * Depth 0 (Entry and authentication) sits outside the shell: it is the
 * introduction to the environment, not a space within it [04 §14]. Everything
 * authenticated renders inside EnvironmentShell, which owns depth, motion and the
 * persistent regions.
 *
 * Spaces are code-split at their boundaries so the Entry stays fast and never pays
 * for the 3D runtime it does not use [04 §14].
 */

const EntrySpace = lazy(() => import('@/spaces/entry/EntrySpace'))
const AuthSpace = lazy(() => import('@/spaces/entry/AuthSpace'))
const HomeSpace = lazy(() => import('@/spaces/home/HomeSpace'))
const PatientSpace = lazy(() => import('@/spaces/patient/PatientSpace'))
const AccountSpace = lazy(() => import('@/spaces/account/AccountSpace'))

/**
 * Design System Showcase — development only.
 *
 * `import.meta.env.DEV` is statically replaced with `false` in production builds,
 * so this branch and its dynamic import are removed entirely by the bundler.
 */
const DevShowcase = import.meta.env.DEV
  ? lazy(() => import('@/dev/showcase/routes').then((m) => ({ default: m.ShowcaseRoutes })))
  : null

function SpaceFallback() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-24">
      <LoadingSurface lines={4} label="Loading" />
    </div>
  )
}

export function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Suspense fallback={<SpaceFallback />}>
          <Routes>
            {/* Depth 0 */}
            <Route path={routePattern.entry} element={<EntrySpace />} />
            <Route path={routePattern.enter} element={<AuthSpace />} />

            {/* Depth 1-3, inside the environment */}
            <Route element={<EnvironmentShell />}>
              <Route path={routePattern.home} element={<HomeSpace />} />
              <Route path={routePattern.account} element={<AccountSpace />} />
              <Route path={routePattern.patient} element={<PatientSpace />} />
            </Route>

            {DevShowcase && <Route path="/__showcase/*" element={<DevShowcase />} />}

            <Route path="*" element={<Navigate to={paths.entry} replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Providers>
  )
}
