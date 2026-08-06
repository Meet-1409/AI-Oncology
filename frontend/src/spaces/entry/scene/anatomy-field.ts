/**
 * The anonymous anatomical field.
 *
 * A point cloud sampled inside a humanoid volume. It carries NO patient data and
 * no clinical information — no patient information is reachable from the Entry
 * [04 §14], [03 §3]. It is the product's visual identity: the body, rendered as
 * data.
 *
 * Points are generated once, deterministically, so the composition is stable
 * across reloads rather than shimmering into a different shape each visit.
 */

export interface FieldGeometry {
  /** Flat xyz triples for the body volume. */
  positions: Float32Array
  /** Per-point size multiplier, giving the cloud depth and texture. */
  scales: Float32Array
  /** Denser, brighter cluster positions marking organ regions. */
  organPositions: Float32Array
}

/** Deterministic PRNG, so the field is identical on every load. */
function createRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

interface Volume {
  /** Centre of the volume. */
  at: readonly [number, number, number]
  /** Radii on each axis. */
  radius: readonly [number, number, number]
  /** Relative share of the total point budget. */
  weight: number
}

/**
 * A simplified standing figure, described as overlapping ellipsoids. Matches the
 * proportions used by the Digital Twin so the Entry and the product read as the
 * same object.
 */
const BODY: readonly Volume[] = [
  { at: [0, 1.18, 0], radius: [0.135, 0.155, 0.135], weight: 0.1 }, // head
  { at: [0, 1.0, 0], radius: [0.05, 0.07, 0.05], weight: 0.02 }, // neck
  { at: [0, 0.8, 0], radius: [0.2, 0.26, 0.13], weight: 0.24 }, // chest
  { at: [0, 0.45, 0], radius: [0.175, 0.19, 0.12], weight: 0.16 }, // abdomen
  { at: [0, 0.16, 0], radius: [0.16, 0.12, 0.12], weight: 0.09 }, // pelvis
  { at: [-0.25, 0.66, 0], radius: [0.055, 0.2, 0.055], weight: 0.05 },
  { at: [0.25, 0.66, 0], radius: [0.055, 0.2, 0.055], weight: 0.05 },
  { at: [-0.275, 0.28, 0], radius: [0.045, 0.18, 0.045], weight: 0.04 },
  { at: [0.275, 0.28, 0], radius: [0.045, 0.18, 0.045], weight: 0.04 },
  { at: [-0.09, -0.16, 0], radius: [0.078, 0.22, 0.078], weight: 0.06 },
  { at: [0.09, -0.16, 0], radius: [0.078, 0.22, 0.078], weight: 0.06 },
  { at: [-0.09, -0.58, 0], radius: [0.06, 0.2, 0.06], weight: 0.045 },
  { at: [0.09, -0.58, 0], radius: [0.06, 0.2, 0.06], weight: 0.045 },
]

/** Organ regions, as anonymous anatomical landmarks. */
const ORGAN_SITES: readonly (readonly [number, number, number])[] = [
  [0, 1.19, 0],
  [-0.135, 0.79, 0],
  [0.135, 0.79, 0],
  [-0.02, 0.7, 0.09],
  [0.15, 0.555, 0.08],
  [-0.12, 0.525, 0.08],
  [-0.145, 0.42, -0.07],
  [0.145, 0.42, -0.07],
  [0, 0.3, 0.03],
]

/**
 * Samples the field from the REAL sculpted body instead of the ellipsoids.
 *
 * The Entry's whole claim is "the body, as data", and it was previously making
 * that claim with a cloud sampled inside a dozen overlapping ellipsoids — which
 * reads as scattered dust, not as a person, because it is not a person. The
 * Digital Twin already loads a sculpted human; the Entry now samples that exact
 * mesh, so the figure on the landing page and the figure inside the product are
 * the same object seen two ways. That is what makes an identity cohere.
 *
 * Surface-sampled by triangle area, so density is even across the body rather
 * than clumping wherever the mesh happens to be finely tessellated.
 *
 * Returns null when the model is unavailable for any reason; the caller keeps
 * the generated field, exactly as the Body keeps its generated geometry.
 */
export async function sampleAnatomyField(pointCount = 24000): Promise<FieldGeometry | null> {
  try {
    const [{ default: THREE }, { MeshSurfaceSampler }, { loadBody }] = await Promise.all([
      import('three').then((m) => ({ default: m })),
      import('three/addons/math/MeshSurfaceSampler.js'),
      import('@/features/body/model'),
    ])

    const body = await loadBody('neutral')
    if (body.source !== 'model') return null

    const mesh = new THREE.Mesh(body.geometry)
    const sampler = new MeshSurfaceSampler(mesh).build()

    const positions = new Float32Array(pointCount * 3)
    const scales = new Float32Array(pointCount)
    const point = new THREE.Vector3()
    const random = createRandom(20260806)

    for (let i = 0; i < pointCount; i++) {
      sampler.sample(point)
      positions[i * 3] = point.x
      positions[i * 3 + 1] = point.y
      positions[i * 3 + 2] = point.z
      scales[i] = 0.45 + random() * 0.85
    }

    // The Body's frame stands on the floor at y = -0.51; the Entry composition
    // is built around a figure centred on the origin, so it is recentred rather
    // than the camera being moved to chase it.
    for (let i = 1; i < positions.length; i += 3) positions[i] = (positions[i] ?? 0) + 0.11

    // Organ landmarks stay where anatomy.ts puts them — they are the same
    // sites the Digital Twin marks, just rendered as light here.
    const perSite = 90
    const organPositions = new Float32Array(ORGAN_SITES.length * perSite * 3)
    let organIndex = 0
    for (const site of ORGAN_SITES) {
      for (let i = 0; i < perSite; i++, organIndex++) {
        const u = random() * 2 - 1
        const theta = random() * Math.PI * 2
        const r = Math.cbrt(random()) * 0.05
        const s = Math.sqrt(1 - u * u)
        organPositions[organIndex * 3] = site[0] + r * s * Math.cos(theta)
        organPositions[organIndex * 3 + 1] = site[1] + r * u
        organPositions[organIndex * 3 + 2] = site[2] + r * s * Math.sin(theta)
      }
    }

    return { positions, scales, organPositions }
  } catch {
    return null
  }
}

export function buildAnatomyField(pointCount = 7000): FieldGeometry {
  const random = createRandom(20260802)

  const positions = new Float32Array(pointCount * 3)
  const scales = new Float32Array(pointCount)

  const totalWeight = BODY.reduce((sum, volume) => sum + volume.weight, 0)
  let index = 0

  for (const volume of BODY) {
    const count = Math.round((volume.weight / totalWeight) * pointCount)

    for (let i = 0; i < count && index < pointCount; i++, index++) {
      // Rejection-free spherical sampling, biased toward the surface so the
      // silhouette reads clearly rather than as a solid blob.
      const u = random() * 2 - 1
      const theta = random() * Math.PI * 2
      const r = Math.cbrt(0.35 + random() * 0.65)
      const s = Math.sqrt(1 - u * u)

      positions[index * 3] = volume.at[0] + volume.radius[0] * r * s * Math.cos(theta)
      positions[index * 3 + 1] = volume.at[1] + volume.radius[1] * r * u
      positions[index * 3 + 2] = volume.at[2] + volume.radius[2] * r * s * Math.sin(theta)

      scales[index] = 0.5 + random() * 0.9
    }
  }

  // Any remainder from rounding fills the chest, the visual centre of the form.
  for (; index < pointCount; index++) {
    positions[index * 3] = (random() - 0.5) * 0.3
    positions[index * 3 + 1] = 0.8 + (random() - 0.5) * 0.4
    positions[index * 3 + 2] = (random() - 0.5) * 0.2
    scales[index] = 0.5 + random() * 0.9
  }

  // Organ clusters: tight, denser groups that catch the light.
  const perSite = 90
  const organPositions = new Float32Array(ORGAN_SITES.length * perSite * 3)
  let organIndex = 0

  for (const site of ORGAN_SITES) {
    for (let i = 0; i < perSite; i++, organIndex++) {
      const u = random() * 2 - 1
      const theta = random() * Math.PI * 2
      const r = Math.cbrt(random()) * 0.05
      const s = Math.sqrt(1 - u * u)

      organPositions[organIndex * 3] = site[0] + r * s * Math.cos(theta)
      organPositions[organIndex * 3 + 1] = site[1] + r * u
      organPositions[organIndex * 3 + 2] = site[2] + r * s * Math.sin(theta)
    }
  }

  return { positions, scales, organPositions }
}
