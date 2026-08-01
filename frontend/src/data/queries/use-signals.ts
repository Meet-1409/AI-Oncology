import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdapter } from '@/data/adapters'
import { signalListSchema } from '@/data/contract/domain'
import { queryKeys } from '@/data/query-client'
import { useSessionStore } from '@/state/session-store'
import { z } from 'zod'

/**
 * Signals (Notifications).
 *
 * Delivered without interrupting clinical work [04 §20]. Polled while the space is
 * open rather than pushed: the documentation specifies status updates "after
 * refresh" [09.4 §15], so no realtime transport is required.
 */

const POLL_INTERVAL_MS = 30_000
const ackSchema = z.object({ ok: z.boolean() })

export function useSignals() {
  const userId = useSessionStore((s) => s.userId)

  return useQuery({
    queryKey: [...queryKeys.signals.all, userId],
    enabled: Boolean(userId),
    refetchInterval: POLL_INTERVAL_MS,
    queryFn: () => getAdapter().read('/signals', signalListSchema, { params: { userId: userId ?? '' } }),
  })
}

export function useMarkSignalRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (signalId: string) =>
      getAdapter().write('/mutations/read-signal', ackSchema, { signalId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.signals.all }),
  })
}

export function useMarkAllSignalsRead() {
  const queryClient = useQueryClient()
  const userId = useSessionStore((s) => s.userId)
  return useMutation({
    mutationFn: () =>
      getAdapter().write('/mutations/read-all-signals', ackSchema, { userId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.signals.all }),
  })
}
