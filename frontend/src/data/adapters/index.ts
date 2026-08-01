import type { DataAdapter } from './adapter'
import { createMockAdapter } from './mock-adapter'
import { env } from '@/config/env'

/**
 * Adapter selection — the composition root for data transport.
 *
 * Swapping the mock for HTTP happens here and nowhere else. No space, feature or
 * component knows which adapter is in use [02 §9].
 */
let instance: DataAdapter | null = null

export function getAdapter(): DataAdapter {
  if (!instance) {
    // The HTTP adapter is implemented when the backend exists. Until then the
    // environment defaults to "mock", and selecting "http" without a base URL
    // already fails at startup in config/env.ts.
    instance = createMockAdapter()
    if (env.adapter === 'http') {
      throw new Error(
        'The HTTP adapter is not implemented yet. Set VITE_DATA_ADAPTER=mock until the backend is available.',
      )
    }
  }
  return instance
}

export type { DataAdapter, RequestOptions } from './adapter'
