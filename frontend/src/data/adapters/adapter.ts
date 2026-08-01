import type { z } from 'zod'
import { ApiFailure } from '@/data/contract/envelope'

/**
 * The transport boundary.
 *
 * Everything above `data/` is written against this interface, so the mock adapter
 * used during frontend development and the HTTP adapter used against the real
 * backend are interchangeable. Swapping them is a single change at the composition
 * root — not a rewrite.
 *
 * This is a transport, not a backend. It contains no business logic, no persistence
 * and no authentication [02 §2].
 */

export interface RequestOptions {
  // Explicit `| undefined` so callers may pass optional values through directly
  // under exactOptionalPropertyTypes.
  signal?: AbortSignal | undefined
  /** Query string values; undefined entries are omitted. */
  params?: Record<string, string | number | boolean | undefined> | undefined
}

export interface DataAdapter {
  /**
   * Read a resource and validate it against its contract schema.
   * Validation failures surface as ApiFailure rather than propagating bad data.
   */
  read<T extends z.ZodTypeAny>(
    path: string,
    schema: T,
    options?: RequestOptions,
  ): Promise<z.infer<T>>

  /** Perform a mutation and validate the response. */
  write<T extends z.ZodTypeAny>(
    path: string,
    schema: T,
    body: unknown,
    options?: RequestOptions,
  ): Promise<z.infer<T>>

  /**
   * Upload a file with progress. Separate from `write` because uploads must report
   * progress and support retry without losing the user's position [09.8 §21].
   */
  upload<T extends z.ZodTypeAny>(
    path: string,
    schema: T,
    file: File,
    fields: Record<string, string>,
    options?: (RequestOptions & { onProgress?: ((fraction: number) => void) | undefined }) | undefined,
  ): Promise<z.infer<T>>
}

/**
 * Validates an adapter response against its contract. Shared by every adapter so
 * validation cannot be skipped by one of them.
 */
export function validate<T extends z.ZodTypeAny>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new ApiFailure({
      kind: 'server',
      message: 'The server returned information this application could not read.',
    })
  }
  return result.data
}
