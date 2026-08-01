import { z } from 'zod'

/**
 * The API contract boundary.
 *
 * The frontend talks only to APIs and never contains business logic [02 §2, §9].
 * This module defines the *shape* of that conversation. Per-resource schemas are
 * added alongside the feature that consumes them, so the contract grows one
 * feature at a time rather than being speculated up front.
 *
 * Responses are validated at runtime. A backend that drifts from the contract must
 * fail loudly at the boundary rather than silently rendering wrong clinical values.
 */

/** Error classes the interface must handle distinctly [02 §13], [05 §18]. */
export const apiErrorKindSchema = z.enum([
  'validation',
  'authentication',
  'authorization',
  'not_found',
  'conflict',
  'file',
  'processing',
  'network',
  'server',
])

export type ApiErrorKind = z.infer<typeof apiErrorKindSchema>

export const apiErrorSchema = z.object({
  kind: apiErrorKindSchema,
  /** Safe to show a user: explains the problem and what to do next [04 §23]. */
  message: z.string(),
  /** Field-level messages for validation failures [04 §12]. */
  fields: z.record(z.string(), z.string()).optional(),
})

export type ApiError = z.infer<typeof apiErrorSchema>

/**
 * A typed failure. Errors never expose system internals [05 §18], so this carries
 * only what the interface is allowed to render.
 */
export class ApiFailure extends Error {
  readonly kind: ApiErrorKind
  readonly fields: Record<string, string> | undefined

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiFailure'
    this.kind = error.kind
    this.fields = error.fields
  }

  /** Retrying is only meaningful for transient failures. */
  get isRetryable(): boolean {
    return this.kind === 'network' || this.kind === 'server'
  }

  /** The session ended; the user should be able to resume where they were. */
  get requiresReauthentication(): boolean {
    return this.kind === 'authentication'
  }
}

/** Cursor pagination for large collections [09.4 §24], [09.8 §22]. */
export const pageSchema = z.object({
  cursor: z.string().nullable(),
  hasMore: z.boolean(),
  total: z.number().int().nonnegative(),
})

export type Page = z.infer<typeof pageSchema>

export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({ items: z.array(item), page: pageSchema })
}

export interface Paginated<T> {
  items: T[]
  page: Page
}
