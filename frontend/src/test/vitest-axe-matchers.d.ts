/**
 * Extends vitest's `expect` with jest-axe's `toHaveNoViolations()`, applied via
 * `expect.extend(toHaveNoViolations)` in `src/test/setup.ts`.
 *
 * The `export {}` makes this file a module rather than a global script — module
 * augmentation of an already-typed package (vitest ships its own types) only
 * merges when the augmenting file is itself a module; without it, this block
 * replaces vitest's ambient module outright and every vitest export disappears.
 */
export {}

declare module 'vitest' {
  interface Assertion<T = unknown> {
    /** Fails with a readable report if `axe()` found any violations. */
    toHaveNoViolations: T extends import('axe-core').AxeResults ? () => void : never
  }
}
