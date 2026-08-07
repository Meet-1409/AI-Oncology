# 00 — Contract migration (for Meet)

Read this before touching `data/contract/`. It says exactly what survives, what
changes, and what has to go — so the rework is bounded rather than open-ended.

## What survives untouched

Your transport and validation architecture was right and none of it changes.

- `envelope.ts` — error kinds, `ApiFailure`, pagination. No changes.
- `adapters/adapter.ts` — the `DataAdapter` interface. No changes.
- `mock-adapter.ts` / `mock-store.ts` — same pattern, new fixtures.
- `session`, `tasks`, `notes`, `signals`, `account` — the workflow half. No changes.
- Every `spaces/`, `shell/`, `motion/`, `design/`, `primitives/` module.
- The Body's GLB loading, fallback geometry, and per-organ degradation. The
  atlas work is entirely reusable; only what gets *placed on* it changes.

Roughly 70% of the frontend is unaffected. The rework is concentrated in four
feature modules and their fixtures.

## What changes

| v1 | v2 | Why |
|---|---|---|
| `reportSchema` (PDF, `aiSummary`, `keyFindings`) | `artifactRefSchema` + typed findings | The unit of input is a study, not a document. A CT series is not a PDF with a summary. |
| `organStatusSchema.severity: 0–5` | `organInvolvementSchema` | Severity was hand-set with optional evidence. Involvement is derived from lesions and evidence is required. |
| `understandingSchema` (prose summary) | `patientStateSchema` + `assertions[]` | Prose cannot be traced to a pixel. A claim graph can. |
| `reportComparisonSchema` | `lesionTrackSchema` | Comparing two documents is not comparing two scans. Tracks follow one lesion through time. |
| `bodySnapshotSchema` | `lesions[]` + `organs[]` | The body renders measured lesions, not an authored per-organ dial. |
| `evidenceRefSchema` (report name + finding text) | `evidenceLinkSchema` (finding → artifact → model run → locator) | The trace has to reach the source region, not just name a document. |

## Three things that are genuinely new work

**1. Two coordinate spaces on the Body.** Every lesion carries `patientSpaceMm`
(clinical truth) and `atlasPosition` (display, backend-computed, with its own
confidence). Never derive one from the other. When `atlasPosition` is null, show
the lesion in the organ list and place no marker — your own note about separately
exported organ meshes applies exactly: confidently, plausibly wrong is worse than
obviously wrong.

**2. Measurements render with uncertainty.** `measurementSchema` carries a band
and `exceedsVariability`. A change within measurement noise must not read the same
as a real one. `+12.34%` is now a design error, not just a formatting choice.

**3. Evidence is a required array, not an optional field.** `z.array(...).min(1)`
on assertions and organ involvement. Any fixture you write must supply it, which
is the point — the mock store can no longer produce a shape the backend is
forbidden to produce.

## Two states the UI must handle that v1 had no concept of

- **`NOT_ASSESSED`.** An organ that was never imaged is not a healthy organ. It
  needs its own visual treatment, distinct from "no disease found". This is the
  single most important rendering decision in v2.
- **`containsSyntheticFindings: true`.** Until real weights land, states are built
  from simulated model output. That must be visible on screen, not a footnote.
  Design it now; it will be true for weeks.

## Suggested order

1. Drop in `domain.v2.ts` alongside v1. Both compile.
2. Rewrite mock fixtures against v2 — this is where you'll find shapes that don't
   render, before any backend exists.
3. Migrate Body → `lesions` + `organs`.
4. Migrate Understanding → `state.assertions`, with the evidence trace.
5. Migrate Journey → `timepoints`.
6. Delete v1 clinical schemas. Workflow schemas stay.

## The one thing to push back on us about

If a screen needs a value the contract can't supply with evidence, say so rather
than working around it. That gap is a backend bug, not a frontend problem — and
the workaround is exactly how an unsourced clinical claim gets on screen.
