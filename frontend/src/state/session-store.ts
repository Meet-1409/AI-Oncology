import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserRole } from '@/types'

/**
 * Session identity held by the client.
 *
 * This store does NOT authenticate. Authentication is a backend responsibility
 * [02 §3]; the frontend only records who the backend says is signed in, so the
 * environment can resolve /home to the correct space [03 §4] and scope requests.
 *
 * Authorization is enforced server-side [02 §7]. Any client-side gating built on
 * this store is a second lock, never the only one.
 */

export interface SessionState {
  isAuthenticated: boolean
  role: UserRole | null
  userId: string | null
  /** Where the user was heading when the session expired, so they can resume. */
  intendedPath: string | null

  setSession: (session: { role: UserRole; userId: string }) => void
  clearSession: () => void
  setIntendedPath: (path: string | null) => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      role: null,
      userId: null,
      intendedPath: null,

      setSession: ({ role, userId }) =>
        set({ isAuthenticated: true, role, userId, intendedPath: null }),

      clearSession: () =>
        set({ isAuthenticated: false, role: null, userId: null, intendedPath: null }),

      setIntendedPath: (path) => set({ intendedPath: path }),
    }),
    {
      name: 'ao.session',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        role: state.role,
        userId: state.userId,
      }),
    },
  ),
)
