import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEnvironmentStore } from '@/state/environment-store'
import { useViewTransition } from './use-view-transition'

/**
 * Continuous Return.
 *
 * One consistent gesture and control always moves the user exactly one depth level
 * out [04 §5], so returning is predictable everywhere in the environment and the
 * user can never become stranded.
 *
 * Bound to Escape [blueprint 01 §2.5]. Deliberately ignored while the user is
 * typing or while a nested overlay owns Escape, so it can never discard input —
 * back navigation must never lose unsaved work [03 §23].
 */

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export function useContinuousReturn(): () => void {
  const navigate = useNavigate()
  const startTransition = useViewTransition()
  const depth = useEnvironmentStore((s) => s.depth)

  const goBack = useCallback(() => {
    if (depth <= 0) return
    startTransition(() => {
      navigate(-1)
    })
  }, [depth, navigate, startTransition])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (event.defaultPrevented) return
      if (isTextEntry(event.target)) return
      if (useEnvironmentStore.getState().isIntentBarOpen) return
      goBack()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goBack])

  return goBack
}
