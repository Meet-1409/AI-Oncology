import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Providers } from './providers'
import { paths, routePattern } from '@/routes/paths'
import { LoadingSurface } from '@/components/patterns'

/**
 * The environment root.
 *
 * Spaces are code-split at their boundaries so the Entry stays fast and never pays
 * for anything it does not use [04 §14], [blueprint 00 §4.2].
 *
 * Placeholder screens are not permitted [00 §17.6]: an address whose space is not
 * built yet resolves to the Entry rather than to an empty page.
 */

const EntrySpace = lazy(() => import('@/spaces/entry/EntrySpace'))
const AuthSpace = lazy(() => import('@/spaces/entry/AuthSpace'))

/**
 * Design System Showcase — development only.
 *
 * `import.meta.env.DEV` is statically replaced with `false` in production builds,
 * so this branch and its dynamic import are removed entirely by the bundler. The
 * showcase is not merely hidden in production — it is not present.
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
            <Route path={routePattern.entry} element={<EntrySpace />} />
            <Route path={routePattern.enter} element={<AuthSpace />} />

            {DevShowcase && <Route path="/__showcase/*" element={<DevShowcase />} />}

            <Route path="*" element={<Navigate to={paths.entry} replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </Providers>
  )
}
