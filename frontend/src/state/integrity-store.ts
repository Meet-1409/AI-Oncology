import { create } from 'zustand'
import type { IntegrityNotice, IntegrityNoticeId } from '@/lib/integrity'

/**
 * State-level integrity notices, for the session.
 *
 * DELIBERATELY NOT PERSISTED. `preferences-store.ts` wraps itself in `persist`;
 * this must not. Remembering "already seen" across reloads is exactly how a
 * warning that may never be dismissed becomes one that is permanently hidden —
 * the user clears it once, and no later session ever shows it again. A reload
 * starts the notice at full text, every time.
 *
 * There is no `dismiss`. Not hidden behind a flag, not disabled — absent. A
 * notice can be COLLAPSED to its one-line form and nothing more `[CLAUDE.md
 * rule 5]`.
 */

interface IntegrityState {
  /** Keyed by id, so raising the same notice twice is idempotent. */
  notices: Record<string, IntegrityNotice>
  /** Full text on first arrival; the one-line strip thereafter. */
  expanded: Record<string, boolean>

  raise: (notice: IntegrityNotice) => void
  /** Only ever called when the underlying FACT stops being true. */
  clear: (id: IntegrityNoticeId) => void
  collapse: (id: IntegrityNoticeId) => void
  expand: (id: IntegrityNoticeId) => void
}

export const useIntegrityStore = create<IntegrityState>()((set) => ({
  notices: {},
  expanded: {},

  raise: (notice) =>
    set((state) => {
      // Already raised: leave it, and leave its expanded state alone. Re-raising
      // on every render must not re-expand a notice the reader has collapsed.
      if (state.notices[notice.id]) return state
      return {
        notices: { ...state.notices, [notice.id]: notice },
        expanded: { ...state.expanded, [notice.id]: true },
      }
    }),

  clear: (id) =>
    set((state) => {
      const notices = { ...state.notices }
      const expanded = { ...state.expanded }
      delete notices[id]
      delete expanded[id]
      return { notices, expanded }
    }),

  collapse: (id) => set((state) => ({ expanded: { ...state.expanded, [id]: false } })),
  expand: (id) => set((state) => ({ expanded: { ...state.expanded, [id]: true } })),
}))
