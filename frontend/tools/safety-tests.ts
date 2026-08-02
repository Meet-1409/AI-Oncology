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
import { severityColor, severityLabel, isSeverityLevel, SEVERITY_LEVELS } from '@/lib/status'
import { severityScale } from '@/design/theme'
import { buildBodyViewModel } from '@/features/body/use-body-view-model'
import { ORGANS, SELECTABLE_IDS, organLabel } from '@/features/body/anatomy'
import { ORGAN_SCALE } from '@/features/body/figure'
import { mockStore } from '@/data/adapters/mock-store'
import { patientSpaceSchema } from '@/data/contract/domain'
import { digitalTwinSnapshots } from '@/data/mock-data'

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
   clinical information [09.5 §19]. Checked at the transport boundary. */
check('a patient session never receives private notes or intelligence', () => {
  const raw = mockStore.handle('/patients/p1', { role: 'patient' })
  const data = patientSpaceSchema.parse(raw)

  const privateNotes = data.notes.filter((note) => note.type === 'private')
  assert(privateNotes.length === 0, `${privateNotes.length} private note(s) reached a patient`)

  assert(data.understanding === null, 'Patient Intelligence reached a patient session')

  const oncologistOnly = data.timeline.filter((event) => event.visibility === 'oncologist')
  assert(
    oncologistOnly.length === 0,
    `${oncologistOnly.length} oncologist-only timeline event(s) reached a patient`,
  )
})

check('an oncologist session does receive private notes and intelligence', () => {
  const raw = mockStore.handle('/patients/p1', { role: 'oncologist' })
  const data = patientSpaceSchema.parse(raw)
  assert(
    data.notes.some((note) => note.type === 'private'),
    'the oncologist is missing private observations they should see',
  )
  assert(data.understanding !== null, 'the oncologist is missing Patient Intelligence')
})

/* 3 — Every AI output carries evidence and confidence [00 §5.9], [00 §5.10]. */
check('every AI summary carries a confidence value', () => {
  const raw = mockStore.handle('/patients/p1', { role: 'oncologist' })
  const data = patientSpaceSchema.parse(raw)

  const summarised = data.reports.filter((report) => report.aiSummary !== undefined)
  assert(summarised.length > 0, 'no summarised reports found to check')

  for (const report of summarised) {
    assert(
      typeof report.aiConfidence === 'number',
      `report "${report.name}" has a summary but no confidence value`,
    )
  }

  if (data.understanding) {
    assert(
      typeof data.understanding.confidence === 'number',
      'Patient Intelligence has no confidence value',
    )
    assert(
      data.understanding.supportingEvidence.length > 0,
      'Patient Intelligence has no supporting evidence',
    )
  }
})

/* 4 — The structured renderer exposes every organ the 3D scene does [00 §16.5].
   Both consume one view-model, so this asserts that contract holds. */
check('every renderable organ is reachable in the structured view', () => {
  const snapshots = digitalTwinSnapshots.filter((s) => s.patientId === 'p1')
  const model = buildModel(snapshots)

  assert(
    model.organs.length === SELECTABLE_IDS.length,
    `view-model exposes ${model.organs.length} sites, anatomy defines ${SELECTABLE_IDS.length}`,
  )

  for (const id of SELECTABLE_IDS) {
    const organ = model.organAt(id)
    assert(organ !== undefined, `site "${id}" is missing from the view-model`)
    assert(organ.label.length > 0, `site "${id}" has no label for the structured view`)
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
  const snapshots = [...digitalTwinSnapshots.filter((s) => s.patientId === 'p1')].sort((a, b) =>
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

/* 8 — The CSS, three.js and status severity scales must agree. */
check('severity scale agrees between theme and status modules', () => {
  for (const level of SEVERITY_LEVELS) {
    assert(
      severityScale[level].toLowerCase() === severityColor(level).toLowerCase(),
      `severity ${level}: theme=${severityScale[level]} status=${severityColor(level)}`,
    )
  }
})

/* 9 — Anatomy geometry must be valid, or organs render invisibly. */
check('all organ geometry is finite and positive', () => {
  for (const organ of ORGANS) {
    assert(
      organ.args.every((n) => Number.isFinite(n) && n > 0),
      `organ ${organ.id} has invalid geometry: ${JSON.stringify(organ.args)}`,
    )
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

function buildModel(snapshots: typeof digitalTwinSnapshots, date?: string) {
  return buildBodyViewModel(snapshots, date ? { date } : {})
}

/* 10 — Anatomical containment.
   Every organ must sit inside the body silhouette. An organ poking through the
   skin reads as a rendering fault and undermines trust in the visualization. */
check('every organ sits inside the body silhouette', () => {
  // Half-width and half-depth of the torso/head at a given height, derived from
  // the figure segments that form the trunk.
  const TRUNK = [
    { y: 1.185, halfW: 0.108 * 0.92, halfD: 0.108, span: 0.108 * 1.18 },
    { y: 1.005, halfW: 0.054, halfD: 0.054, span: 0.055 },
    { y: 0.945, halfW: 0.12 * 1.45, halfD: 0.12 * 0.85, span: 0.12 * 0.5 },
    { y: 0.8, halfW: 0.155 * 1.2, halfD: 0.155 * 0.72, span: 0.155 + 0.1 },
    { y: 0.6, halfW: 0.128 * 1.14, halfD: 0.128 * 0.76, span: 0.128 + 0.05 },
    { y: 0.42, halfW: 0.142 * 1.16, halfD: 0.142 * 0.8, span: 0.142 + 0.055 },
    { y: 0.33, halfW: 0.135 * 1.24, halfD: 0.135 * 0.86, span: 0.135 * 0.72 },
  ]

  function bounds(y: number): { halfW: number; halfD: number } | null {
    let best: { halfW: number; halfD: number } | null = null
    for (const part of TRUNK) {
      if (Math.abs(y - part.y) <= part.span) {
        if (!best || part.halfW > best.halfW) best = { halfW: part.halfW, halfD: part.halfD }
      }
    }
    return best
  }

  const offenders: string[] = []

  for (const organ of ORGANS) {
    const [x, y, z] = organ.position
    const scale = organ.scale ?? [1, 1, 1]
    const radius = organ.args[0] ?? 0
    // Widest horizontal extent of the organ mesh, after its own scale and the
    // global organ scale factor.
    const extentX = radius * scale[0] * ORGAN_SCALE
    const extentZ = radius * scale[2] * ORGAN_SCALE

    const limit = bounds(y)
    if (!limit) {
      offenders.push(`${organ.label}: no trunk segment covers y=${y}`)
      continue
    }
    if (Math.abs(x) + extentX > limit.halfW) {
      offenders.push(
        `${organ.label}: reaches x=${(Math.abs(x) + extentX).toFixed(3)}, body half-width is ${limit.halfW.toFixed(3)}`,
      )
    }
    if (Math.abs(z) + extentZ > limit.halfD + 0.02) {
      offenders.push(
        `${organ.label}: reaches z=${(Math.abs(z) + extentZ).toFixed(3)}, body half-depth is ${limit.halfD.toFixed(3)}`,
      )
    }
  }

  assert(offenders.length === 0, `organs outside the body:\n        ${offenders.join('\n        ')}`)
})
