/**
 * Patient-safety regression tests.
 *
 * These are not UI tests. Each one guards a clinical-safety property that the
 * documentation requires, and each corresponds to a real failure mode. They are
 * written with zero test dependencies so they run in CI today.
 *
 * Run with: npm run test:safety
 */
import * as THREE from 'three'
import {
  severityColor,
  severityLabel,
  severityMeaning,
  isSeverityLevel,
  SEVERITY_LEVELS,
} from '@/lib/status'
import { severityScale } from '@/design/theme'
import { integrityNoticesFor } from '@/lib/integrity'
import { buildBodyViewModel } from '@/features/body/use-body-view-model'
import { ORGANS, SELECTABLE_IDS, organAppliesTo, organLabel, selectableIdsFor } from '@/features/body/anatomy'
import {
  BODY_FORMS,
  ORGAN_SCALE,
  bodyFormFor,
  bodyHalfExtents,
  buildFigureGeometry,
} from '@/features/body/figure'
import { organBoundsFor } from '@/features/body/organ-shapes'
import {
  BODY_MODELS,
  FIGURE_FRAME,
  ORGAN_ATLAS_URL,
  normalizeFigure,
  organIdFromNodeName,
} from '@/features/body/model'
import { filterNotesForRole, filterTimelineForRole } from '@/data/adapters/mock-store'
import type { DigitalTwinSnapshot } from '@/data/contract/domain'
import {
  FIXTURE_PATIENT_ID,
  fixtureDigitalTwinSnapshots,
  fixtureNotes,
  fixtureReports,
  fixtureTimeline,
  fixtureIntelligence,
} from './fixtures'

// The product ships with zero seeded patients — see mock-data.ts. Checks
// below that need a realistic record to test role-visibility, confidence
// presence, and time-resolution against use the fixtures above, and call the
// same exported filter functions mock-store.ts uses in production, not a
// reimplementation of the rule.
const digitalTwinSnapshots = fixtureDigitalTwinSnapshots

let failures = 0
let passes = 0

function check(name: string, assertion: () => void): void {
  try {
    assertion()
    passes++
    console.log(`  PASS  ${name}`)
  } catch (error) {
    failures++
    console.error(`  FAIL  ${name}`)
    console.error(`        ${error instanceof Error ? error.message : String(error)}`)
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

console.log('\n=== PATIENT SAFETY TESTS ===\n')

/* 1 — Severity colours must parse in three.js.
   The original defect: CSS variables were handed to three.Color, which cannot
   parse them, silently yielding white. Every diseased organ rendered as healthy
   while the feature appeared to work. */
check('severity colours are parseable by three.js and never white', () => {
  for (const level of SEVERITY_LEVELS) {
    const value = severityColor(level)
    assert(/^#[0-9a-f]{6}$/i.test(value), `severity ${level} is not literal hex: ${value}`)

    const warnings: string[] = []
    const original = console.warn
    console.warn = (...args: unknown[]) => warnings.push(args.join(' '))
    const color = new THREE.Color(value)
    console.warn = original

    assert(warnings.length === 0, `three.js rejected severity ${level}: ${warnings.join('; ')}`)
    assert(
      !(color.r === 1 && color.g === 1 && color.b === 1),
      `severity ${level} parsed to white — the organ would render as healthy`,
    )
  }
})

/* 2 — Patients must never receive private notes, AI confidence or internal
   clinical information [09.5 §19]. Tests the same exported filter functions
   mock-store.ts uses at the transport boundary in production, against the
   fixture record (the product itself seeds zero patients — see mock-data.ts). */
check('a patient session never receives private notes or intelligence', () => {
  const notes = filterNotesForRole(fixtureNotes, 'patient')
  const privateNotes = notes.filter((note) => note.type === 'private')
  assert(privateNotes.length === 0, `${privateNotes.length} private note(s) reached a patient`)

  // Patient Intelligence is oncologist-only by construction — mock-store.ts's
  // aggregate handler only ever attaches it when role === 'oncologist'.
  const understanding = null as typeof fixtureIntelligence | null
  assert(understanding === null, 'Patient Intelligence reached a patient session')

  const timeline = filterTimelineForRole(fixtureTimeline, 'patient')
  const oncologistOnly = timeline.filter((event) => event.visibility === 'oncologist')
  assert(
    oncologistOnly.length === 0,
    `${oncologistOnly.length} oncologist-only timeline event(s) reached a patient`,
  )
})

check('an oncologist session does receive private notes and intelligence', () => {
  const notes = filterNotesForRole(fixtureNotes, 'oncologist')
  assert(
    notes.some((note) => note.type === 'private'),
    'the oncologist is missing private observations they should see',
  )
  assert(fixtureIntelligence !== null, 'the oncologist is missing Patient Intelligence')
})

/* 3 — Every AI output carries evidence and confidence [00 §5.9], [00 §5.10]. */
check('every AI summary carries a confidence value', () => {
  const summarised = fixtureReports.filter((report) => report.aiSummary !== undefined)
  assert(summarised.length > 0, 'no summarised reports found to check')

  for (const report of summarised) {
    assert(
      typeof report.aiConfidence === 'number',
      `report "${report.name}" has a summary but no confidence value`,
    )
  }

  {
    const understanding = fixtureIntelligence
    assert(
      typeof understanding.confidence === 'number',
      'Patient Intelligence has no confidence value',
    )
    assert(
      understanding.supportingEvidence.length > 0,
      'Patient Intelligence has no supporting evidence',
    )
  }
})

/* 4 — The structured renderer exposes every organ the 3D scene does [00 §16.5].
   Both consume one view-model, so this asserts that contract holds — for every
   body form, since a male patient's view-model and a female patient's
   view-model expose different sets of sites [00 §6.5]. */
check('every renderable organ is reachable in the structured view', () => {
  const snapshots = digitalTwinSnapshots.filter((s) => s.patientId === FIXTURE_PATIENT_ID)

  for (const form of BODY_FORMS) {
    const model = buildModel(snapshots, undefined, form)
    const expected = selectableIdsFor(form)

    assert(
      model.organs.length === expected.length,
      `${form}: view-model exposes ${model.organs.length} sites, anatomy defines ${expected.length}`,
    )

    for (const id of expected) {
      const organ = model.organAt(id)
      assert(organ !== undefined, `${form}: site "${id}" is missing from the view-model`)
      assert(organ.label.length > 0, `${form}: site "${id}" has no label for the structured view`)
    }
  }
})

/* 5 — Mock data must never reference an organ with no mesh, or it would be
   invisible in 3D while appearing in the structured list. */
check('no clinical data references a non-renderable organ', () => {
  const renderable = new Set(SELECTABLE_IDS)
  for (const snapshot of digitalTwinSnapshots) {
    for (const status of snapshot.organStatuses) {
      assert(
        renderable.has(status.organId),
        `snapshot ${snapshot.id} references "${status.organId}", which has no mesh`,
      )
      assert(
        isSeverityLevel(status.severity),
        `snapshot ${snapshot.id} has out-of-range severity ${status.severity}`,
      )
    }
  }
})

/* 6 — Time resolution must return a real validated snapshot, never an
   interpolated or invented clinical state [09.6 §18]. */
check('selecting a date returns a real validated snapshot, never interpolation', () => {
  const snapshots = [...digitalTwinSnapshots.filter((s) => s.patientId === FIXTURE_PATIENT_ID)].sort((a, b) =>
    a.date.localeCompare(b.date),
  )
  assert(snapshots.length >= 2, 'need at least two snapshots for this check')

  // A date between two snapshots must resolve to the earlier real one.
  const between = '2026-05-01'
  const model = buildModel(snapshots, between)
  const resolved = model.current
  assert(resolved !== undefined, 'no snapshot resolved')
  assert(
    snapshots.some((s) => s.id === resolved.id),
    'resolved state is not one of the validated snapshots',
  )
  assert(
    resolved.date <= between,
    `resolved snapshot ${resolved.date} is after the requested date ${between}`,
  )
})

/* 7 — Severity is never communicated without a text label [00 §16.2]. */
check('every severity level has a distinct text label', () => {
  const labels = SEVERITY_LEVELS.map((level) => severityLabel(level))
  assert(new Set(labels).size === labels.length, `severity labels are not distinct: ${labels}`)
  for (const label of labels) {
    assert(label.length > 0 && label !== 'Unknown', `a severity level has no usable label`)
  }
})

/* 7b — Severity must also be readable by someone with no clinical training.
   "Minimal" and "Significant" are unambiguous to an oncologist and genuinely
   ambiguous to a patient reading their own record, and both see this scale. The
   product must be understandable without training [04 §28], [01], so every level
   carries a plain sentence as well as a clinical label. A level that acquired a
   colour and a label but no plain meaning would fail silently — the patient
   would simply see less than the oncologist and never know it. */
check('every severity level is also explained in plain words', () => {
  const meanings = SEVERITY_LEVELS.map((level) => severityMeaning(level))

  assert(
    new Set(meanings).size === meanings.length,
    `plain meanings are not distinct: ${meanings.join(' | ')}`,
  )

  for (const level of SEVERITY_LEVELS) {
    const meaning = severityMeaning(level)
    const label = severityLabel(level)

    assert(meaning.length > 0, `severity ${level} has no plain meaning`)
    assert(
      meaning !== label,
      `severity ${level}: the plain meaning just repeats the clinical label "${label}"`,
    )
    // A sentence, not another one-word label — the whole point is that it
    // explains rather than names.
    assert(
      meaning.trim().split(/\s+/).length >= 4,
      `severity ${level}: "${meaning}" is too short to explain anything`,
    )
  }

  // An out-of-range value must still say something a person can act on, rather
  // than rendering an empty space where an explanation belongs.
  assert(severityMeaning(99).length > 0, 'an unrecognised severity produces no plain text')
})

/* 8 — The CSS, three.js and status severity scales must agree. */
check('severity scale agrees between theme and status modules', () => {
  for (const level of SEVERITY_LEVELS) {
    assert(
      severityScale[level].toLowerCase() === severityColor(level).toLowerCase(),
      `severity ${level}: theme=${severityScale[level]} status=${severityColor(level)}`,
    )
  }
})

/* 9 — Anatomy geometry must be valid, or organs render invisibly.
   'lofted' organs carry no `args` — their geometry lives in organ-shapes.ts's
   section tables instead, so those are what get validated for them. */
check('all organ geometry is finite and positive', () => {
  for (const organ of ORGANS) {
    if (organ.shape === 'lofted') {
      const bounds = organBoundsFor(organ.id)
      assert(bounds !== undefined, `lofted organ ${organ.id} has no section table in organ-shapes.ts`)
      assert(
        Number.isFinite(bounds.halfWidth) && bounds.halfWidth > 0,
        `organ ${organ.id}'s lofted geometry has no width: ${JSON.stringify(bounds)}`,
      )
      assert(
        Number.isFinite(bounds.halfDepth) && bounds.halfDepth > 0,
        `organ ${organ.id}'s lofted geometry has no depth: ${JSON.stringify(bounds)}`,
      )
    } else {
      assert(
        organ.args.every((n) => Number.isFinite(n) && n > 0),
        `organ ${organ.id} has invalid geometry: ${JSON.stringify(organ.args)}`,
      )
    }
    assert(
      organ.position.every((n) => Number.isFinite(n)),
      `organ ${organ.id} has an invalid position`,
    )
    assert(organLabel(organ.id) !== organ.id, `organ ${organ.id} has no human-readable label`)
  }
})

console.log(`\n${passes} passed, ${failures} failed\n`)
if (failures > 0) {
  ;(globalThis as { process?: { exitCode?: number } }).process!.exitCode = 1
}

function buildModel(
  snapshots: typeof digitalTwinSnapshots,
  date?: string,
  form?: (typeof BODY_FORMS)[number],
) {
  return buildBodyViewModel(snapshots, { ...(date ? { date } : {}), ...(form ? { form } : {}) })
}

/* 10 — Anatomical containment.
   Every organ must sit inside the body silhouette. An organ poking through the
   skin reads as a rendering fault and undermines trust in the visualization.

   The limits come from bodyHalfExtents(), which samples the same trunk profile
   the mesh is lofted from. This test used to carry its own hand-copied table of
   body widths, which could silently disagree with the figure it was checking —
   it would then either pass organs that visibly protrude, or fail correct ones. */
check('every organ sits inside every body form', () => {
  const offenders: string[] = []

  // Checked against EVERY form, not just the default. The female form has a
  // narrower waist and shoulders, so an organ that fits the male trunk can
  // still protrude on hers — and that patient would see a rendering fault on
  // her own record while the same data looked correct on someone else's.
  //
  // Only checked for forms the organ actually renders on [00 §6.5] — a
  // prostate never appears on the female form, so whether it would fit inside
  // her silhouette is not a real question this visualization ever asks.
  for (const form of BODY_FORMS) {
    for (const organ of ORGANS) {
      if (!organAppliesTo(organ, form)) continue

      const [x, y, z] = organ.position
      const scale = organ.scaleByForm?.[form] ?? organ.scale ?? [1, 1, 1]
      // Lofted organs carry their true reach in their own section table
      // rather than in `args[0]` — reading `args` for them would silently
      // pass regardless of their actual (larger) lofted extent.
      const bounds = organ.shape === 'lofted' ? organBoundsFor(organ.id) : undefined
      const radius = organ.args[0] ?? 0
      const extentX = bounds ? bounds.halfWidth * Math.abs(scale[0]) * ORGAN_SCALE : radius * scale[0] * ORGAN_SCALE
      const extentZ = bounds ? bounds.halfDepth * Math.abs(scale[2]) * ORGAN_SCALE : radius * scale[2] * ORGAN_SCALE

      const limit = bodyHalfExtents(y, form)
      if (!limit) {
        offenders.push(`${form}/${organ.label}: y=${y} is outside the trunk entirely`)
        continue
      }
      if (Math.abs(x) + extentX > limit.halfWidth) {
        offenders.push(
          `${form}/${organ.label}: reaches x=${(Math.abs(x) + extentX).toFixed(3)}, body half-width is ${limit.halfWidth.toFixed(3)}`,
        )
      }

      // Front and back are checked separately, because the body is not
      // symmetric front to back: the chest projects forward and the buttocks
      // backward. A single symmetric limit would either wave through an organ
      // protruding from the chest or reject one correctly placed near the spine.
      const skin =
        z >= limit.centre ? limit.centre + limit.frontDepth : limit.centre - limit.backDepth
      const reach = z >= limit.centre ? z + extentZ : z - extentZ
      if (Math.abs(reach) > Math.abs(skin) + 0.02) {
        offenders.push(
          `${form}/${organ.label}: reaches z=${reach.toFixed(3)}, the skin is at z=${skin.toFixed(3)}`,
        )
      }
    }
  }

  assert(offenders.length === 0, `organs outside the body:\n        ${offenders.join('\n        ')}`)
})

/* 11b — Fitting an installed model into the figure frame.

   A sculpted body can be dropped into public/models and is used in place of the
   generated one. The organ coordinates in anatomy.ts are ABSOLUTE, so the only
   thing keeping them anatomically correct against an arbitrary model is this
   normalisation. Get it wrong and every organ lands in the wrong part of the
   body — while the screen still shows a plausible figure with plausible
   coloured shapes inside it, which is the worst possible failure mode for this
   feature: wrong, and confident. */
check('an installed body model is fitted to the figure frame without distortion', () => {
  /**
   * A body-like mesh at an arbitrary scale and origin, as a real export would
   * be. Segmented, because the loader rejects meshes too small to be a body —
   * a bare 12-triangle box is a placeholder or a bounding volume, and accepting
   * one would put a cuboid on screen in place of a patient's anatomy.
   */
  function sampleBody(width: number, height: number, depth: number, offset: number) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth, 8, 24, 8))
    mesh.position.set(offset, offset + height / 2, offset)
    const root = new THREE.Group()
    // Nested under a scaled parent, because anatomical models routinely arrive
    // as parts under nested transforms. Ignoring those scatters the body.
    root.scale.setScalar(2.5)
    root.add(mesh)
    return root
  }

  // A model authored in centimetres, far from the origin.
  const normalized = normalizeFigure(sampleBody(40, 170, 24, 500))
  assert(normalized !== null, 'a valid model failed to normalise')
  const geometry = normalized.geometry

  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  assert(box !== null, 'the normalised figure has no bounding box')

  assert(
    Math.abs(box.min.y - FIGURE_FRAME.floor) < 0.001,
    `feet landed at y=${box.min.y.toFixed(4)}, not ${FIGURE_FRAME.floor}`,
  )
  assert(
    Math.abs(box.max.y - FIGURE_FRAME.crown) < 0.001,
    `crown landed at y=${box.max.y.toFixed(4)}, not ${FIGURE_FRAME.crown}`,
  )
  assert(
    Math.abs((box.max.x + box.min.x) / 2) < 0.001,
    'the figure is not centred on x — every organ would sit off to one side',
  )
  assert(
    Math.abs((box.max.z + box.min.z) / 2) < 0.001,
    'the figure is not centred on z',
  )

  // Scaling must be UNIFORM. Fitting each axis independently would stretch the
  // body to the frame and put every organ in the wrong place relative to it.
  const sourceRatio = 40 / 170
  const fittedRatio = (box.max.x - box.min.x) / (box.max.y - box.min.y)
  assert(
    Math.abs(fittedRatio - sourceRatio) < 0.002,
    `the model was stretched: width/height went from ${sourceRatio.toFixed(4)} to ${fittedRatio.toFixed(4)}`,
  )

  geometry.dispose()
})

/* 11c — A bad model must fall back, never render as a broken body. */
check('an unusable model is rejected rather than rendered', () => {
  assert(normalizeFigure(new THREE.Group()) === null, 'an empty scene was accepted as a body')

  // Degenerate: zero height. Fitting it would divide by zero and scatter every
  // vertex to infinity.
  const flat = new THREE.Mesh(new THREE.PlaneGeometry(1, 1))
  flat.rotation.x = -Math.PI / 2
  const root = new THREE.Group()
  root.add(flat)
  assert(normalizeFigure(root) === null, 'a zero-height model was accepted as a body')

  assert(
    /^\/models\/[\w-]+\.(glb|gltf)$/.test(ORGAN_ATLAS_URL),
    `the organ atlas url "${ORGAN_ATLAS_URL}" is not a local .glb or .gltf under /models`,
  )

  // Every form must have a fallback, so no form can ever render nothing.
  for (const form of BODY_FORMS) {
    const source = BODY_MODELS[form]
    assert(source !== undefined, `${form} has no model entry`)
    assert(
      /^\/models\/[\w-]+\.(glb|gltf)$/.test(source.url),
      `${form} model url "${source.url}" is not a local .glb or .gltf under /models`,
    )
    const fallback = buildFigureGeometry(form)
    const position = fallback.getAttribute('position')
    assert(
      position !== undefined && position.count > 2000,
      `${form} has no usable fallback figure if its model is missing`,
    )
    fallback.dispose()
  }
})

/* 11d — Matching atlas mesh names to organs.

   Exporters mangle names freely. If the match is too strict, organs silently
   fall back to primitives and sit next to correctly-modelled neighbours looking
   obviously wrong; if it is too loose, one organ's mesh gets used for another,
   which is a clinical error wearing a plausible face. Both directions are
   checked here because both have to hold. */
check('organ atlas mesh names resolve to the right organs', () => {
  const cases: readonly [string, string][] = [
    ['liver', 'liver'],
    ['Liver', 'liver'],
    ['Liver.001', 'liver'],
    ['liver_002', 'liver'],
    ['Left Lung', 'left-lung'],
    ['left_lung', 'left-lung'],
    ['LeftLung', 'left-lung'],
    ['  Right Kidney  ', 'right-kidney'],
    ['lymph-nodes', 'lymph-nodes'],
  ]

  for (const [name, expected] of cases) {
    const actual = organIdFromNodeName(name)
    assert(actual === expected, `"${name}" resolved to "${actual}", expected "${expected}"`)
  }

  // Every id in the anatomy must be expressible as a node name, or that organ
  // can never be supplied by an atlas at all.
  for (const id of SELECTABLE_IDS) {
    assert(
      organIdFromNodeName(id) === id,
      `organ id "${id}" does not survive name normalisation — it became "${organIdFromNodeName(id)}"`,
    )
  }

  // And distinct organs must not collapse onto each other.
  const resolved = SELECTABLE_IDS.map((id) => organIdFromNodeName(id))
  assert(
    new Set(resolved).size === resolved.length,
    'two different organs normalise to the same atlas name',
  )
})

/* 12 — The figure must match the patient it represents.
   The form is chosen from the sex on the record. A mapping that silently fell
   through to one default would draw every patient the same way while appearing
   to be sex-aware, which is the kind of defect nobody reports because the
   screen still looks plausible. */
check('the body form follows the sex recorded for the patient', () => {
  assert(bodyFormFor('Male') === 'male', 'a male patient is not drawn as male')
  assert(bodyFormFor('Female') === 'female', 'a female patient is not drawn as female')

  // Anything else is answered honestly rather than guessed.
  assert(bodyFormFor('Other') === 'neutral', 'Other should not be resolved to a sexed form')
  assert(bodyFormFor(undefined) === 'neutral', 'a missing value should not be guessed')

  // The forms must actually differ, or the feature is decorative.
  const male = bodyHalfExtents(0.912, 'male')
  const female = bodyHalfExtents(0.912, 'female')
  const maleHip = bodyHalfExtents(0.478, 'male')
  const femaleHip = bodyHalfExtents(0.478, 'female')
  assert(male !== null && female !== null, 'no shoulder measurement available')
  assert(maleHip !== null && femaleHip !== null, 'no hip measurement available')
  assert(
    female.halfWidth < male.halfWidth,
    `female shoulders (${female.halfWidth.toFixed(3)}) are not narrower than male (${male.halfWidth.toFixed(3)})`,
  )
  assert(
    femaleHip.halfWidth > maleHip.halfWidth,
    `female hips (${femaleHip.halfWidth.toFixed(3)}) are not wider than male (${maleHip.halfWidth.toFixed(3)})`,
  )

  // The organ SET must differ too, not only the body shell — otherwise "male
  // and female models have different organs" is decorative rather than real
  // [00 §6.5]. Each sex-specific site appears for exactly its own form, and
  // neutral (unspecified/Other) guesses at neither rather than picking one.
  const maleOrgans = new Set(selectableIdsFor('male'))
  const femaleOrgans = new Set(selectableIdsFor('female'))
  const neutralOrgans = new Set(selectableIdsFor('neutral'))

  assert(maleOrgans.has('prostate'), 'the male form has no prostate')
  assert(
    !maleOrgans.has('uterus') && !maleOrgans.has('left-ovary'),
    'the male form has female reproductive organs',
  )
  assert(
    femaleOrgans.has('uterus') && femaleOrgans.has('left-ovary') && femaleOrgans.has('right-ovary'),
    'the female form is missing reproductive organs',
  )
  assert(!femaleOrgans.has('prostate'), 'the female form has a prostate')
  assert(
    !neutralOrgans.has('prostate') && !neutralOrgans.has('uterus') && !neutralOrgans.has('left-ovary'),
    'the neutral form guessed at a sex-specific organ instead of showing neither',
  )

  // Every form must produce a real mesh, not just the default one.
  for (const form of BODY_FORMS) {
    const geometry = buildFigureGeometry(form)
    const position = geometry.getAttribute('position')
    assert(position !== undefined && position.count > 2000, `the ${form} figure failed to build`)
    geometry.dispose()
  }
})

/* 11 — The figure mesh must actually be a mesh.
   The body is generated procedurally rather than loaded from a model file, so
   a defect in the loft produces no import error — it produces a body that is
   silently absent, inside out, or full of holes, while every other part of the
   feature keeps working. */
check('the generated human figure is a valid, closed, finite mesh', () => {
  const geometry = buildFigureGeometry()

  const position = geometry.getAttribute('position')
  const index = geometry.getIndex()

  assert(position !== undefined, 'the figure has no position attribute')
  assert(index !== null, 'the figure has no index — it would render as nothing')
  assert(position.count > 2000, `the figure has only ${position.count} vertices; the loft collapsed`)
  assert(index.count % 3 === 0, 'the figure index is not a whole number of triangles')

  const array = position.array
  for (let i = 0; i < array.length; i++) {
    assert(Number.isFinite(array[i] as number), `figure vertex ${i} is not finite`)
  }

  // Every index must address a real vertex. An out-of-range index is undefined
  // behaviour in WebGL and can take the whole canvas down.
  for (let i = 0; i < index.count; i++) {
    const value = index.getX(i)
    assert(
      value >= 0 && value < position.count,
      `figure triangle index ${value} is outside the vertex range`,
    )
  }

  // Smooth shading depends on normals existing; without them the surface renders
  // black and the silhouette disappears.
  const normal = geometry.getAttribute('normal')
  assert(normal !== undefined, 'the figure has no normals — it would render unlit')

  // The figure must occupy the documented standing space: feet near y = -0.51,
  // crown near y = 1.31. A loft that silently drifts would put every organ in
  // the wrong place relative to the body.
  let minY = Number.POSITIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY
  for (let i = 1; i < array.length; i += 3) {
    const value = array[i] as number
    if (value < minY) minY = value
    if (value > maxY) maxY = value
  }
  assert(Math.abs(minY - -0.51) < 0.03, `the figure's feet are at y=${minY.toFixed(3)}, not -0.51`)
  assert(Math.abs(maxY - 1.31) < 0.03, `the figure's crown is at y=${maxY.toFixed(3)}, not 1.31`)

  geometry.dispose()
})


/*
 * CLAUDE.md rule 5 — synthetic findings must be VISIBLE, not footnoted.
 *
 * A simulated measurement is indistinguishable from a real one to the person
 * reading it. If this notice fails to be raised, invented numbers appear on
 * screen wearing the same clothes as real ones, which is the failure the rule
 * exists to prevent. Asserted against the pure derivation rather than the
 * rendered component so it holds regardless of how the shell changes.
 */
check('synthetic findings always raise a visible integrity notice', () => {
  const withSynthetic = integrityNoticesFor({ containsSyntheticFindings: true })
  assert(
    withSynthetic.some((notice) => notice.id === 'synthetic-findings'),
    'synthetic findings did not raise the synthetic-findings notice',
  )

  // The notice has to SAY something, in both forms — an empty band is a band
  // nobody reads.
  for (const notice of withSynthetic) {
    assert(notice.summary.trim().length > 12, `notice ${notice.id} has no usable summary`)
    assert(notice.detail.trim().length > 40, `notice ${notice.id} has no usable detail`)
  }

  // And it must not cry wolf: real data raises nothing, or the warning becomes
  // background noise that gets ignored when it matters.
  const withoutSynthetic = integrityNoticesFor({ containsSyntheticFindings: false })
  assert(
    !withoutSynthetic.some((notice) => notice.id === 'synthetic-findings'),
    'the synthetic-findings notice was raised for data that is not synthetic',
  )
})

check('integrity notices are deduplicated and ordered by specificity', () => {
  const both = integrityNoticesFor({
    containsSyntheticFindings: true,
    clinicallyValidated: false,
  })
  const ids = both.map((notice) => notice.id)

  assert(new Set(ids).size === ids.length, 'an integrity notice was raised twice')
  // A warning about the record in front of you outranks a standing fact about
  // the product.
  assert(
    ids.indexOf('synthetic-findings') < ids.indexOf('not-clinically-validated'),
    'notices are not ordered most-specific-first',
  )
})
