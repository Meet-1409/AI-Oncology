import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Providers } from './providers'
import { routePattern, paths } from '@/routes/paths'

/**
 * The environment root.
 *
 * Routing is configured here as the foundation for continuous spatial navigation
 * [06 Phase 1]. The spaces themselves are built in later phases: the spatial shell
 * and depth system in Phase 2, the Entry in Phase 6, and each space thereafter.
 *
 * Until a space exists, its address resolves to the Entry rather than to a
 * placeholder screen — placeholder components are not permitted [00 §17.6].
 */
export function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Routes>
          <Route path={routePattern.entry} element={<EnvironmentRoot />} />
          <Route path="*" element={<Navigate to={paths.entry} replace />} />
        </Routes>
      </BrowserRouter>
    </Providers>
  )
}

/**
 * Temporary root for Phase 1. The Entry experience replaces this in Phase 6, and
 * the spatial shell wraps it in Phase 2. It renders the product identity only —
 * no patient information is reachable without authentication [03 §3].
 */
function EnvironmentRoot() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          AI Oncology
        </h1>
        <p className="mt-2 text-sm text-neutral-500">Patient Intelligence Platform</p>
      </div>
    </main>
  )
}
