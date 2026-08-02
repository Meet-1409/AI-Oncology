import { useMemo } from 'react'
import type { BodySnapshot } from '@/data/contract/domain'
import type { EvidenceRef } from '@/types'
import { organLabel, SELECTABLE_IDS } from './anatomy'
import type { SeverityLevel } from '@/lib/status'

/**
 * The Body view-model.
 *
 * ONE view-model, TWO renderers: the 3D scene and the structured equivalent both
 * consume this, so they cannot drift [00 §12.6], [00 §16.5]. Every organ, severity
 * and item of evidence available in 3D is present in the structured view.
 *
 * State separation is deliberate and load-bearing:
 *   CLINICAL  severities and evidence — from the backend only
 *   VIEW      selected organ, time position, comparison — user navigation
 *   CAMERA    owned entirely by the scene component
 *
 * Camera state can never reach this hook, which is the architectural enforcement
 * of "camera movement must never change medical information" [00 §6.12].
 */

export interface OrganState {
  organId: string
  label: string
  severity: SeverityLevel
  note: string | undefined
  evidence: EvidenceRef | undefined
}

export interface BodyViewModel {
  /** Snapshots ordered oldest to newest. */
  snapshots: readonly BodySnapshot[]
  /** The snapshot currently displayed. */
  current: BodySnapshot | undefined
  /** The snapshot being compared against, when comparison is active. */
  comparison: BodySnapshot | undefined
  /** Every selectable site with its state at the current moment. */
  organs: readonly OrganState[]
  /** Only the sites with disease involvement, ordered most severe first. */
  involved: readonly OrganState[]
  /** State for a specific site. */
  organAt: (organId: string) => OrganState | undefined
  /** True when there is nothing to visualize [09.6 §19]. */
  isEmpty: boolean
  /** True when comparison is possible [09.6 §19]. */
  canCompare: boolean
}

function severityOf(snapshot: BodySnapshot | undefined, organId: string): SeverityLevel {
  const status = snapshot?.organStatuses.find((s) => s.organId === organId)
  return (status?.severity ?? 0) as SeverityLevel
}

/**
 * Resolves the snapshot for a clinical date.
 *
 * Selecting a date shows the patient's condition AT that point in time [09.6 §10],
 * so the most recent snapshot at or before the requested date is used. Time is
 * never interpolated into a clinical value — the displayed state is always a real,
 * validated snapshot [09.6 §18].
 */
function resolveSnapshot(
  snapshots: readonly BodySnapshot[],
  date: string | undefined,
): BodySnapshot | undefined {
  if (snapshots.length === 0) return undefined
  if (!date) return snapshots[snapshots.length - 1]

  let resolved: BodySnapshot | undefined = snapshots[0]
  for (const snapshot of snapshots) {
    if (snapshot.date <= date) resolved = snapshot
    else break
  }
  return resolved
}

/**
 * The view-model, as a pure function.
 *
 * Separated from the hook so its safety properties — that a resolved date is
 * always a real validated snapshot, and that every renderable site is exposed —
 * can be tested without a React renderer.
 */
export function buildBodyViewModel(
  snapshots: readonly BodySnapshot[],
  options: { date?: string | undefined; compareDate?: string | undefined } = {},
): BodyViewModel {
  const { date, compareDate } = options
  {
    const ordered = [...snapshots].sort((a, b) => a.date.localeCompare(b.date))
    const current = resolveSnapshot(ordered, date)
    const comparison = compareDate ? resolveSnapshot(ordered, compareDate) : undefined

    const organs: OrganState[] = SELECTABLE_IDS.map((organId) => {
      const status = current?.organStatuses.find((s) => s.organId === organId)
      return {
        organId,
        label: organLabel(organId),
        severity: severityOf(current, organId),
        note: status?.note,
        evidence: status?.evidence,
      }
    })

    const involved = organs
      .filter((organ) => organ.severity > 0)
      .sort((a, b) => b.severity - a.severity)

    const byId = new Map(organs.map((organ) => [organ.organId, organ]))

    return {
      snapshots: ordered,
      current,
      comparison,
      organs,
      involved,
      organAt: (organId: string) => byId.get(organId),
      isEmpty: ordered.length === 0,
      canCompare: ordered.length > 1,
    }
  }
}

export function useBodyViewModel(
  snapshots: readonly BodySnapshot[],
  options: { date?: string | undefined; compareDate?: string | undefined },
): BodyViewModel {
  const { date, compareDate } = options
  return useMemo(
    () => buildBodyViewModel(snapshots, { date, compareDate }),
    [snapshots, date, compareDate],
  )
}
