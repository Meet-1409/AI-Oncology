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
  }
}

export const env: Env = readEnv()
