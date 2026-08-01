import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getAdapter } from '@/data/adapters'
import { sessionSchema } from '@/data/contract/domain'
import type { Session } from '@/data/contract/domain'
import { queryKeys } from '@/data/query-client'
import { useSessionStore } from '@/state/session-store'
import type { UserRole } from '@/types'

/**
 * Session identity.
 *
 * The frontend does not authenticate — that is a backend responsibility [02 §3].
 * These hooks record who the backend says is signed in, so the environment can
 * resolve /home to the correct space [03 §4] and scope every request.
 *
 * When the real backend arrives, only the adapter changes.
 */

export function useSession() {
  const { isAuthenticated, role, userId } = useSessionStore()

  return useQuery<Session>({
    queryKey: [...queryKeys.session, role, userId],
    enabled: isAuthenticated && role !== null,
    queryFn: () =>
      getAdapter().read('/session', sessionSchema, {
        params: { role: role ?? 'oncologist', patientId: userId ?? undefined },
      }),
  })
}

/**
 * Establishes a session. Credentials are never handled here; the backend performs
 * authentication and returns the identity this records.
 */
export function useSignIn() {
  const setSession = useSessionStore((s) => s.setSession)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ role, patientId }: { role: UserRole; patientId?: string }) => {
      const session = await getAdapter().read('/session', sessionSchema, {
        params: { role, patientId },
      })
      return session
    },
    onSuccess: (session) => {
      setSession({ role: session.role, userId: session.user.id })
      queryClient.clear()
    },
  })
}

export function useSignOut() {
  const clearSession = useSessionStore((s) => s.clearSession)
  const queryClient = useQueryClient()

  return () => {
    clearSession()
    // Clinical data must not survive sign-out in the cache.
    queryClient.clear()
  }
}
