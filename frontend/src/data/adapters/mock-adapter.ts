import type { z } from 'zod'
import type { DataAdapter, RequestOptions } from './adapter'
import { ApiFailure } from '@/data/contract/envelope'
import { mockStore } from './mock-store'

/**
 * In-memory adapter used until the backend exists.
 *
 * This is a TRANSPORT STAND-IN, not a backend. It contains no authorization, no
 * persistence and no clinical logic — it returns the shapes the contract declares,
 * so the UI can be built and reviewed against realistic data.
 *
 * Everything above `data/` is written against DataAdapter, so replacing this with
 * the HTTP adapter is a single change at the composition root and requires no UI
 * changes [02 §9].
 */

/** Simulated latency, so loading states are real rather than theoretical. */
const LATENCY_MS = 180

function delay(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, LATENCY_MS)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new ApiFailure({ kind: 'network', message: 'The request was cancelled.' }))
    })
  })
}

export function createMockAdapter(): DataAdapter {
  async function resolve<T extends z.ZodTypeAny>(
    path: string,
    schema: T,
    options: RequestOptions | undefined,
    body?: unknown,
  ): Promise<z.infer<T>> {
    await delay(options?.signal)
    const value = mockStore.handle(path, options?.params, body)
    const parsed = schema.safeParse(value)
    if (!parsed.success) {
      throw new ApiFailure({
        kind: 'server',
        message: 'The server returned information this application could not read.',
      })
    }
    return parsed.data
  }

  return {
    read: (path, schema, options) => resolve(path, schema, options),
    write: (path, schema, body, options) => resolve(path, schema, options, body),

    async upload(path, schema, file, fields, options) {
      // Progress is reported in steps so upload UI can be exercised honestly.
      const steps = 8
      for (let step = 1; step <= steps; step++) {
        await new Promise((r) => setTimeout(r, 90))
        if (options?.signal?.aborted) {
          throw new ApiFailure({ kind: 'network', message: 'The upload was cancelled.' })
        }
        options?.onProgress?.(step / steps)
      }
      return resolve(path, schema, options, { file, fields })
    },
  }
}
