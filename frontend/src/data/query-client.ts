import { QueryClient } from '@tanstack/react-query'
import { ApiFailure } from '@/data/contract/envelope'

/**
 * Server-state cache.
 *
 * The cache is what makes "entering a previously visited space should not require a
 * full reload" [02 §12] true by default, and it is a load-bearing part of state
 * continuity — the environment is never rebuilt from scratch during navigation
 * [02 §2]. Server data is never mirrored into a client store, so there is exactly
 * one source of truth for clinical information.
 */

/** Clinical data is read far more often than it changes within a session. */
const CLINICAL_STALE_TIME = 60_000

/** Kept well beyond stale time so returning to a space is instant. */
const CACHE_TIME = 15 * 60_000

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: CLINICAL_STALE_TIME,
        gcTime: CACHE_TIME,
        // Refetching on focus would re-request clinical data every time a doctor
        // switches window, which is wasteful and can cause content to shift while
        // being read. Reports use explicit polling while processing instead.
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiFailure) {
            return error.isRetryable && failureCount < 2
          }
          return failureCount < 2
        },
      },
      mutations: {
        // Mutations are never retried automatically. Re-sending an upload or a
        // clinical note without the user asking is not acceptable in this domain.
        retry: false,
      },
    },
  })
}

/**
 * Query key factory. Centralised so invalidation after a mutation cannot miss a
 * dependent query — every space that shows a patient's data invalidates together.
 */
export const queryKeys = {
  session: ['session'] as const,

  patients: {
    all: ['patients'] as const,
    list: (filters?: Record<string, unknown>) => ['patients', 'list', filters ?? {}] as const,
    detail: (patientId: string) => ['patients', patientId] as const,
    /** The aggregated read that renders Patient Space in one request [02 §9]. */
    space: (patientId: string) => ['patients', patientId, 'space'] as const,
  },

  evidence: {
    forPatient: (patientId: string) => ['patients', patientId, 'evidence'] as const,
    detail: (reportId: string) => ['evidence', reportId] as const,
  },

  journey: {
    forPatient: (patientId: string) => ['patients', patientId, 'journey'] as const,
  },

  /** All clinical dates arrive together so scrubbing never awaits the network [02 §11]. */
  body: {
    forPatient: (patientId: string) => ['patients', patientId, 'body'] as const,
  },

  understanding: {
    forPatient: (patientId: string) => ['patients', patientId, 'understanding'] as const,
  },

  actions: {
    forPatient: (patientId: string) => ['patients', patientId, 'actions'] as const,
    forOncologist: ['actions', 'assigned'] as const,
  },

  guidance: {
    forPatient: (patientId: string) => ['patients', patientId, 'guidance'] as const,
  },

  signals: {
    all: ['signals'] as const,
  },
} as const
