import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Providers } from './providers'
import { paths, routePattern } from '@/routes/paths'
import { LoadingSurface } from '@/components/patterns'
import { SpaceTransition } from '@/components/motion'
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

/**
 * The outermost region of travel.
 *
 * Three regions exist at this level — the Entry, authentication, and the
 * authenticated environment — and moving between them is a whole-screen
 * transition, because it genuinely is a change of place: you arrive at the
 * platform, you identify yourself, you enter.
 *
 * Keyed by REGION rather than by pathname, deliberately. Keying on the address
 * would replay this whole-screen transition on every move inside the
 * environment, animating the shell out and back in each time a patient is
 * opened — the shell would blink, and the persistent regions would stop being
 * persistent. Travel between spaces is the shell's own transition, one level in.
 */
function regionOf(pathname: string): string {
  if (pathname === paths.entry) return 'entry'
  if (pathname.startsWith(paths.enter)) return 'authenticate'
  return 'environment'
}

function TravelRegion({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const region = regionOf(pathname)

  return (
    <SpaceTransition
      // Entering the environment is always a descent; leaving it, an ascent.
      direction={region === 'environment' ? 'deeper' : 'shallower'}
      transitionKey={region}
      className="flex min-h-svh flex-col"
    >
      {children}
    </SpaceTransition>
  )
}

export function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Suspense fallback={<SpaceFallback />}>
          <TravelRegion>
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
          </TravelRegion>
        </Suspense>
      </BrowserRouter>
    </Providers>
  )
}
