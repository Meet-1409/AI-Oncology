import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { buildFigureGeometry } from './figure'
import type { BodyForm } from './figure'

/**
 * The Body's geometry, loaded from real anatomical models.
 *
 * The procedural figure in figure.ts and the primitives in anatomy.ts are
 * correct and cheap, but they are written in code and they read as written in
 * code — a liver approximated by a scaled sphere looks like a scaled sphere. A
 * sculpted atlas is a different class of object, so this module loads one when
 * it is available and falls back when it is not.
 *
 * THE FALLBACK IS NOT A NICETY. The Body is the centrepiece of the application
 * [00 §6.15]. A model that is absent, 404s, fails to parse, arrives over a dead
 * connection or exceeds the device's memory must all resolve to a body on
 * screen — not to an empty panel where a patient's anatomy should be. Every
 * failure path here ends at the generated geometry, and it ends there per organ,
 * so a partial atlas still shows a complete body.
 *
 * --------------------------------------------------------------------------
 * TO INSTALL AN ATLAS
 *
 * Drop the files into `frontend/public/models/` under these names. Nothing in
 * the code changes.
 *
 *   body-male.glb     the external body, skin surface only
 *   body-female.glb
 *   body-neutral.glb  (optional)
 *   organs.glb        every organ, as separate named meshes
 *
 * The organ meshes must be named for their organ id — `liver`, `heart`,
 * `left-lung`, `right-kidney`, and so on, matching the ids in anatomy.ts.
 *
 * REGISTRATION. `body-*.glb` and `organs.glb` must be exported from the SAME
 * source atlas in the SAME coordinate space, because the organs are placed
 * using the transform computed from the body. Export them separately from
 * different models and the organs will be confidently, plausibly, wrong — which
 * is far worse than obviously wrong, because nothing on screen looks broken.
 *
 * See public/models/README.md for format, orientation and licensing.
 * --------------------------------------------------------------------------
 */

export interface BodyModelSource {
  url: string
  /**
   * Rotation applied before fitting, in radians, for atlases that are not Y-up
   * facing +Z. Z-up exports — common from Blender and from medical scanners —
   * need [-Math.PI / 2, 0, 0]. Applied to the organs as well, so the two stay
   * registered.
   */
  rotation?: readonly [number, number, number]
}

export const BODY_MODELS: Readonly<Record<BodyForm, BodyModelSource>> = {
  male: { url: '/models/body-male.glb' },
  female: { url: '/models/body-female.glb' },
  neutral: { url: '/models/body-neutral.glb' },
}

export const ORGAN_ATLAS_URL = '/models/organs.glb'

/** The vertical frame everything is fitted into, matching figure.ts. */
export const FIGURE_FRAME = { floor: -0.51, crown: 1.31 } as const

/**
 * The transform that maps an atlas's own coordinates into the figure frame.
 *
 * Computed once from the body and then applied to the organs unchanged. This is
 * the whole registration mechanism: fit the body, and everything that came out
 * of the same atlas lands exactly where its author put it, relative to that
 * body. Fitting each organ to its own bounding box instead would scale a liver
 * and a bladder to the same size and scatter both.
 */
export interface AtlasFit {
  scale: number
  offset: THREE.Vector3
  rotation?: readonly [number, number, number]
}

/**
 * Bakes every mesh under `root` into one geometry in world space.
 *
 * Anatomical models routinely arrive as dozens of parts under nested
 * transforms. Reading their geometry without applying those transforms
 * scatters the body across the scene.
 */
function bake(root: THREE.Object3D): THREE.BufferGeometry | null {
  root.updateMatrixWorld(true)

  const positions: number[] = []
  const normals: number[] = []
  const normalMatrix = new THREE.Matrix3()
  const vertex = new THREE.Vector3()

  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return
    const source = node.geometry as THREE.BufferGeometry
    const position = source.getAttribute('position')
    if (!position) return

    const index = source.getIndex()
    const count = index ? index.count : position.count
    normalMatrix.getNormalMatrix(node.matrixWorld)
    const normal = source.getAttribute('normal')

    for (let i = 0; i < count; i++) {
      const v = index ? index.getX(i) : i
      vertex.fromBufferAttribute(position, v).applyMatrix4(node.matrixWorld)
      positions.push(vertex.x, vertex.y, vertex.z)
      if (normal) {
        vertex.fromBufferAttribute(normal, v).applyMatrix3(normalMatrix).normalize()
        normals.push(vertex.x, vertex.y, vertex.z)
      }
    }
  })

  if (positions.length < 90) return null

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  if (normals.length === positions.length) {
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  } else {
    geometry.computeVertexNormals()
  }
  return geometry
}

/** Applies an already-computed fit. Used for organs, after the body sets it. */
export function applyFit(geometry: THREE.BufferGeometry, fit: AtlasFit): THREE.BufferGeometry {
  geometry.translate(fit.offset.x, fit.offset.y, fit.offset.z)
  geometry.scale(fit.scale, fit.scale, fit.scale)
  geometry.translate(0, FIGURE_FRAME.floor, 0)
  geometry.computeBoundingSphere()
  return geometry
}

/**
 * Fits a loaded body into the figure frame and reports the transform used.
 *
 * Uniform scale only. Fitting each axis independently would stretch the body to
 * fill the frame and put every organ in the wrong place relative to it.
 */
export function normalizeFigure(
  root: THREE.Object3D,
  rotation?: readonly [number, number, number],
): { geometry: THREE.BufferGeometry; fit: AtlasFit } | null {
  if (rotation) root.rotation.set(rotation[0], rotation[1], rotation[2])

  const geometry = bake(root)
  if (!geometry) return null

  // A body should be substantially more than a handful of triangles; anything
  // smaller is a placeholder, a bounding box, or a broken export.
  const position = geometry.getAttribute('position')
  if (!position || position.count < 300) {
    geometry.dispose()
    return null
  }

  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  if (!box) {
    geometry.dispose()
    return null
  }

  const height = box.max.y - box.min.y
  if (!Number.isFinite(height) || height <= 1e-6) {
    geometry.dispose()
    return null
  }

  const fit: AtlasFit = {
    scale: (FIGURE_FRAME.crown - FIGURE_FRAME.floor) / height,
    offset: new THREE.Vector3(
      -(box.max.x + box.min.x) / 2,
      -box.min.y,
      -(box.max.z + box.min.z) / 2,
    ),
    ...(rotation ? { rotation } : {}),
  }

  applyFit(geometry, fit)
  return { geometry, fit }
}

/* ------------------------------------------------------------------ *
 * Fetching
 * ------------------------------------------------------------------ */

/**
 * Fetches and parses a glTF, or returns null.
 *
 * Never throws. A missing optional asset is a normal state, not a fault.
 */
async function loadScene(
  url: string,
  rotation?: readonly [number, number, number],
): Promise<THREE.Object3D | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    // Checked before parsing, because a missing file is served as an HTML
    // document by most dev servers and static hosts. Handing that to GLTFLoader
    // produces a confusing parse error rather than an honest absence.
    const type = response.headers.get('content-type') ?? ''
    if (type.includes('text/html')) return null

    const buffer = await response.arrayBuffer()
    if (buffer.byteLength < 1024) return null

    const gltf = await new GLTFLoader().parseAsync(buffer, '')
    if (rotation) gltf.scene.rotation.set(rotation[0], rotation[1], rotation[2])
    return gltf.scene
  } catch {
    return null
  }
}

export type FigureSource = 'model' | 'generated'

export interface LoadedBody {
  geometry: THREE.BufferGeometry
  source: FigureSource
  /** Present only when a model loaded; organs are registered against it. */
  fit?: AtlasFit
}

/** Loads the body for a form. Never rejects; always yields a body. */
export async function loadBody(form: BodyForm): Promise<LoadedBody> {
  const source = BODY_MODELS[form]
  const scene = source ? await loadScene(source.url, source.rotation) : null
  const normalized = scene ? normalizeFigure(scene, source?.rotation) : null

  if (!normalized) {
    return { geometry: buildFigureGeometry(form), source: 'generated' }
  }
  return { geometry: normalized.geometry, source: 'model', fit: normalized.fit }
}

/**
 * Normalises a mesh name to an organ id.
 *
 * Exporters mangle names freely — `Liver`, `liver_001`, `Left Lung`,
 * `LeftLung.mesh`. Being strict here would silently drop organs from a
 * perfectly good atlas, and a dropped organ falls back to a primitive that sits
 * beside correctly-modelled neighbours looking obviously wrong.
 */
export function organIdFromNodeName(name: string): string {
  return name
    .trim()
    .replace(/\.\w+$/, '')
    .replace(/[_\s]+/g, '-')
    .replace(/-?\d+$/, '')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

/**
 * Loads the organ atlas, registered against the body's fit.
 *
 * Returns only the organs the atlas actually contains. Anything missing keeps
 * its primitive, so a partial atlas degrades organ by organ rather than
 * all-or-nothing — which matters because atlases vary in coverage, and coverage
 * is expected to grow over time [08 §11].
 */
export async function loadOrganAtlas(
  fit: AtlasFit,
  wanted: readonly string[],
): Promise<Map<string, THREE.BufferGeometry>> {
  const found = new Map<string, THREE.BufferGeometry>()

  const scene = await loadScene(ORGAN_ATLAS_URL, fit.rotation)
  if (!scene) return found

  const wantedSet = new Set(wanted)
  scene.updateMatrixWorld(true)

  const byId = new Map<string, THREE.Object3D[]>()
  scene.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return
    const id = organIdFromNodeName(node.name)
    if (!wantedSet.has(id)) return
    const group = byId.get(id)
    if (group) group.push(node)
    else byId.set(id, [node])
  })

  for (const [id, nodes] of byId) {
    // An organ may be split across several meshes — the colon especially. They
    // are baked together so the whole organ takes one severity colour, because
    // a liver rendered in two halves that ease to the same colour at different
    // rates would read as two different findings.
    const group = new THREE.Group()
    for (const node of nodes) {
      const clone = node.clone()
      clone.matrixAutoUpdate = false
      clone.matrix.copy(node.matrixWorld)
      group.add(clone)
    }
    const baked = bake(group)
    if (!baked) continue
    found.set(id, applyFit(baked, fit))
  }

  return found
}
