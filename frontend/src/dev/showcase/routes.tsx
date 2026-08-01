import { Routes, Route } from 'react-router-dom'
import { ShowcaseShell } from './ShowcaseShell'
import Showcase from './Showcase'

/**
 * Showcase route tree — DEVELOPMENT ONLY.
 *
 * Kept in a separate module so the entire showcase, including the shell wrapper
 * and every design system import it pulls in, sits behind one dynamic import that
 * the bundler removes from production builds.
 *
 * The showcase renders inside the real AppShell, so reviewing the design system
 * also verifies the shell: persistent regions, depth synchronisation, Continuous
 * Return and the skip link are all live here.
 */
export function ShowcaseRoutes() {
  return (
    <Routes>
      <Route element={<ShowcaseShell />}>
        <Route index element={<Showcase />} />
      </Route>
    </Routes>
  )
}
