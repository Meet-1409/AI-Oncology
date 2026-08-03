/**
 * `jest-axe` ships no types and no `@types/jest-axe` release tracks its current
 * major version, so this declares only the surface this codebase actually
 * calls, against `axe-core`'s own (accurate) types.
 */
declare module 'jest-axe' {
  import type { AxeResults, RunOptions, Spec } from 'axe-core'

  export interface JestAxeConfigureOptions extends RunOptions {
    globalOptions?: Spec
  }

  export function configureAxe(
    options?: JestAxeConfigureOptions,
  ): (html: Element | string, options?: RunOptions) => Promise<AxeResults>

  export const axe: (html: Element | string, options?: RunOptions) => Promise<AxeResults>

  export const toHaveNoViolations: {
    toHaveNoViolations(received: AxeResults): { pass: boolean; message: () => string }
  }
}
