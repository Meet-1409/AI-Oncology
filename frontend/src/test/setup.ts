import { afterEach, expect } from 'vitest'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'
import '@testing-library/jest-dom/vitest'

/**
 * Test environment setup.
 *
 * Extends Vitest's `expect` with jest-dom's DOM matchers (`toBeInTheDocument`,
 * `toHaveAttribute`, …) and jest-axe's `toHaveNoViolations` [blueprint 05 §7],
 * loaded once for every test file via `test.setupFiles`.
 *
 * `@axe-core/react` — the package the accessibility strategy originally named
 * — does not support React 18+ (its own README says so); jest-axe runs the
 * same underlying `axe-core` engine directly against rendered DOM instead, so
 * it works with any React version. Recorded in BLUEPRINT 05 §9.
 *
 * Color contrast rules are disabled by jest-axe under jsdom (contrast
 * computation needs a real layout engine), so this catches structural
 * accessibility defects — missing labels, invalid ARIA, heading order — not
 * contrast; contrast is a manual/real-browser check.
 *
 * Testing Library's automatic post-test cleanup detects a global `afterEach`;
 * this config runs with `test.globals: false` (explicit imports, matching the
 * rest of this codebase), so cleanup is wired up explicitly instead — without
 * this, one test's render is still mounted when the next test's assertions run.
 */
expect.extend(toHaveNoViolations)

afterEach(() => {
  cleanup()
})
