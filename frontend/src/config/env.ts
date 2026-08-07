/**
 * Environment configuration [06 Phase 1].
 *
 * Parsed and validated once at startup so a misconfigured deployment fails
 * immediately and visibly rather than at the first request.
 */

export type AdapterKind = 'mock' | 'http'

interface Env {
  apiBaseUrl: string
  adapter: AdapterKind
  isDevelopment: boolean
  /**
   * Load the three invented demonstration patients (`data/demo-data.ts`).
   *
   * ON in development, OFF in a production build, and `VITE_DEMO_PATIENTS`
   * overrides either way.
   *
   * Invented clinical data that ships to real users is how a made-up number
   * ends up quoted back as a fact — so it must never be the default in
   * production. But an empty app is impossible to demonstrate or develop
   * against, and requiring a local env file means the demo silently disappears
   * on every fresh checkout. Dev-on / prod-off is the split that serves both.
   */
  demoPatients: boolean
}

function readAdapter(value: string | undefined): AdapterKind {
  if (value === 'http') return 'http'
  if (value === 'mock' || value === undefined || value === '') return 'mock'
  throw new Error(`VITE_DATA_ADAPTER must be "mock" or "http", received "${value}".`)
}

function readEnv(): Env {
  const adapter = readAdapter(import.meta.env.VITE_DATA_ADAPTER)
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

  if (adapter === 'http' && !apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is required when VITE_DATA_ADAPTER is "http".')
  }

  return {
    apiBaseUrl,
    adapter,
    isDevelopment: import.meta.env.DEV,
    demoPatients:
      import.meta.env.VITE_DEMO_PATIENTS === 'true'
        ? true
        : import.meta.env.VITE_DEMO_PATIENTS === 'false'
          ? false
          : import.meta.env.DEV,
  }
}

export const env: Env = readEnv()
