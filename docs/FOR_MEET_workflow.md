# For Meet — working the v2 migration with Claude Code

Written to be handed over as-is. Windows, Claude Code in the desktop app.

---

## Part 1 — One-time setup (30 minutes)

### 1. Place the files

From the repo root (`AI Oncology\`):

```
CLAUDE.md                                   <- new, commit this
docs\                                       <- new folder, all 9 documents
  00_Contract_Migration.md
  01_PRD.md
  02_TRD_Backend.md
  03_API_Contract.md
  04_Backend_Schema.md
  05_Implementation_Plan.md
  06_Data_And_Evaluation_Contract.md
  07_Clinical_Safety.md
  README.md
frontend\src\data\contract\domain.v2.ts     <- new, sits beside domain.ts
frontend\src\data\contract\CLAUDE.md        <- new, nested rules
```

### 2. Add the nested contract rules

`frontend\src\data\contract\CLAUDE.md`:

```markdown
# Contract rules

v2 (`domain.v2.ts`) is current for clinical schemas. v1's workflow schemas
(session, tasks, notes, signals) are current and unchanged — do not migrate them.

- `evidence` is `.min(1)` deliberately. Never relax it to make a fixture compile.
- `patientSpaceMm` and `atlasPosition` are never derived from each other.
- Every mock fixture must supply real-shaped evidence, or the mock can produce
  a shape the backend is forbidden to produce.
- Contract changes are announced before deploy.
```

### 3. Banner the stale handover

Top of `HANDOVER.md`, above everything:

```markdown
> **v2, 8 August 2026.** The clinical contract moved to imaging-first
> (`domain.v2.ts`). Statements below about report-based AI, `organStatus.severity`,
> and "backend not started" are historical. Current source of truth: `docs/`.
> This file remains accurate for frontend architecture, art direction and §2.4.
```

Then delete `HANDOVER_FOR_CHATGPT.md`. Two handovers means one is always wrong.

### 4. Verify it loaded

Open the project in Claude Code, then:

```
/memory
```

Confirm `CLAUDE.md` is listed as active. If it isn't, you launched from the wrong
folder — open the repo root, not `frontend\`.

**Do not run `/init`.** It generates a CLAUDE.md and would overwrite a better one.

---

## Part 2 — The working loop

The same shape every session:

```
1. Start a fresh session          (one task per session — long sessions drift)
2. State the task + the doc to read
3. Plan mode for anything touching contract, Body, or safety tests
4. Read the plan. Push back before approving, not after.
5. Let it work
6. Run the safety tests
7. Screenshot the result
8. Commit
```

Steps 6 and 7 are the ones people skip and shouldn't. Your own HANDOVER §2.4 says
several long-standing defects were found by screenshotting rather than by reading
code — that stays true, and the v2 states are exactly the kind that pass every
type check while rendering wrong.

### Don't paste the documents

CLAUDE.md loads automatically. For everything else, name the path:

> Read `docs/00_Contract_Migration.md` before you start.

Pasting nine documents into every session crowds out the actual work.

---

## Part 3 — The migration, session by session

Six sessions. Commit between each. Do not merge two.

### Session 1 — Fixtures first

> Read `docs/00_Contract_Migration.md` and `frontend/src/data/contract/domain.v2.ts`.
>
> Rewrite the mock fixtures in `data/adapters/mock-store.ts` against the v2
> schemas. Do not touch any component yet — I want to find the shapes that don't
> render before any UI depends on them.
>
> Include fixtures for the awkward cases specifically: a patient with one imaged
> organ and four NOT_ASSESSED, a lesion with `atlasPosition: null`, a state with
> `containsSyntheticFindings: true`, and a measurement whose change is within its
> uncertainty band.

Fixtures first is deliberate. Every wrong assumption surfaces here, where it costs
nothing.

### Session 2 — Body

> Migrate `features/body` from `bodySnapshot`/`organStatus` to v2 `lesions` and
> `organs`.
>
> Two rules that are not negotiable: `patientSpaceMm` is clinical truth and
> `atlasPosition` is backend-computed display only — never derive one from the
> other. When `atlasPosition` is null, render the lesion in the organ list and
> place no marker on the atlas.
>
> `NOT_ASSESSED` needs a visual treatment distinct from "no disease found". An
> organ that was never imaged is not a healthy organ. Propose the treatment in
> plan mode before implementing.

**Then screenshot it.** One imaged organ, four unimaged. If you can't tell them
apart at a glance, it's wrong regardless of what the tests say.

### Session 3 — Understanding → patient state

> Replace `understandingSchema` with `patientStateSchema`. The prose summary
> becomes a rendered list of assertions, each showing its rationale, confidence,
> and a link to its evidence.
>
> Every assertion has a non-empty `evidence` array. If a screen needs a value the
> contract can't supply with evidence, stop and tell me — that's a backend bug,
> not something to work around.

### Session 4 — Evidence trace

> Build the evidence trace view: assertion → finding → artifact → model run →
> source region. `GET /api/v1/assertions/{id}/evidence` per
> `docs/03_API_Contract.md`.
>
> The model run's `synthetic` flag must be visible in this view, not hidden
> behind a tooltip.

This is the screen the whole product exists for. Give it a session of its own.

### Session 5 — Journey and measurements

> Migrate Journey to v2 `timepoints`. Then implement measurement rendering:
> every `measurement` shows its uncertainty band, and a change with
> `exceedsVariability: false` must not read the same as a real change.
>
> `+12.34%` is a design error. Propose the treatment before implementing.

### Session 6 — Safety tests and cleanup

> Update `frontend/tools/safety-tests.ts` for v2 and add these invariants:
> evidence arrays are non-empty; NOT_ASSESSED renders distinctly from none;
> a null `atlasPosition` places no marker; the synthetic flag is visible whenever
> `containsSyntheticFindings` is true.
>
> Then delete the superseded v1 clinical schemas from `domain.ts`. Keep session,
> tasks, notes, signals, account — those are current.

---

## Part 4 — Things that will go wrong

**It relaxes `.min(1)` to make something compile.** This is the most likely
failure and the most dangerous. If a fixture or component won't build because
evidence is missing, the answer is to supply evidence, never to loosen the schema.
Say: *revert that — the constraint is intentional, add the evidence instead.*

**It builds a fallback that invents a value.** Your Body already has a strong
fallback culture, and it's right for geometry. It is wrong for clinical values.
A missing lesion position falls back to no marker, not to a guessed one.

**It confidently uses v1 shapes.** HANDOVER.md is 51k of v1 context. If this
happens, point at `docs/00_Contract_Migration.md` explicitly rather than
re-explaining.

**Auto memory records v1 as fact.** Claude saves its own notes as it works. After
the migration, run `/memory`, browse the auto memory folder, and delete anything
describing the old contract. It's plain markdown.

**Long session drift.** If it starts contradicting decisions from earlier in the
same session, that's the signal to commit and start fresh, not to correct it again.

---

## Part 5 — Staying in sync with the backend

- **Monday, 30 minutes.** What's landing this week, any contract change.
- **Contract changes are versioned and announced before deploy.** A silent
  response-shape change costs the other person a week.
- **Meet builds against mocks until the backend deploys.** The adapter swap is one
  change at the composition root — that architecture was right, use it.
- **When a screen needs data the contract can't supply, that's a backend ticket.**
  Don't design around it. Designing around it is precisely how an unsourced
  clinical value reaches a screen.

---

## The one-sentence version

CLAUDE.md loads itself, the documents get named by path not pasted, one task per
session with a commit between, plan mode for anything clinical, and screenshot
before believing it works.
