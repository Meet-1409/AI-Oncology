import { useEffect, useMemo, useState } from 'react'
import type * as THREE from 'three'
import { buildFigureGeometry } from './figure'
import type { BodyForm } from './figure'
import { SELECTABLE_IDS } from './anatomy'
import { loadBody, loadOrganAtlas } from './model'
import type { FigureSource } from './model'

export interface BodyMeshes {
  /** The external body. */
  figure: THREE.BufferGeometry
  /** Sculpted organ meshes by organ id. Anything absent keeps its primitive. */
  organs: ReadonlyMap<string, THREE.BufferGeometry>
  source: FigureSource
}

/**
 * The Body's geometry for a form.
 *
 * Returns the generated figure immediately, then upgrades to the sculpted atlas
 * if one is installed. Ordering it this way is deliberate: the Body is the
 * centrepiece of the application [00 §6.15], and a patient opening their own
 * record should not watch an empty panel while several megabytes arrive. There
 * is a body on screen from the first frame; it either stays or is quietly
 * replaced by a better one.
 *
 * The upgrade swaps geometry within the same coordinate frame. No organ changes
 * severity, no selection is lost and no clinical value moves — only the shape
 * drawn for it [00 §6.12].
 */
export function useBodyMeshes(form: BodyForm): BodyMeshes {
  const generated = useMemo(() => buildFigureGeometry(form), [form])
  const [atlas, setAtlas] = useState<BodyMeshes | null>(null)

  useEffect(() => {
    let cancelled = false
    let held: BodyMeshes | null = null

    setAtlas(null)

    void (async () => {
      const body = await loadBody(form)
      if (body.source !== 'model' || !body.fit) {
        // The generated figure is already on screen; nothing to swap in.
        body.geometry.dispose()
        return
      }
      if (cancelled) {
        body.geometry.dispose()
        return
      }

      const organs = await loadOrganAtlas(body.fit, SELECTABLE_IDS)
      if (cancelled) {
        // The patient changed while this was in flight. Releasing here rather
        // than storing it is what stops a quick series of patient changes
        // leaking a multi-megabyte atlas per patient.
        body.geometry.dispose()
        for (const geometry of organs.values()) geometry.dispose()
        return
      }

      held = { figure: body.geometry, organs, source: 'model' }
      setAtlas(held)
    })()

    return () => {
      cancelled = true
      if (held) {
        held.figure.dispose()
        for (const geometry of held.organs.values()) geometry.dispose()
      }
    }
  }, [form])

  useEffect(() => () => generated.dispose(), [generated])

  return atlas ?? { figure: generated, organs: EMPTY, source: 'generated' }
}

const EMPTY: ReadonlyMap<string, THREE.BufferGeometry> = new Map()
