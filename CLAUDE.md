# CLAUDE.md

Read this before doing anything. It is the highest-priority file in the repo.

## What this project is

AI Oncology — a patient intelligence platform for oncology. One patient, every
modality, over time, with every clinical value traceable to the scan region that
produced it.

It is clinical decision **support**, pre-validation. It assists an oncologist and
never replaces their judgement. It does not diagnose, does not recommend
treatment, and does not act autonomously.

## Document hierarchy

Read in this order. Later documents never override earlier ones.

| Source | Authority |
|---|---|
| `READ THIS/00_Ground_Rules.txt` | Permanent product rules. Non-negotiable. |
| `READ THIS/02_Technical_Requirements_Document..txt` | Durable architecture map |
| `docs/` | Backend, API contract, data and safety. Current. |
| `BLUEPRINT/` | Frontend engineering companion. Editable — record decisions here. |
| `HANDOVER.md` | Frontend state of play. Long; read §1 and §2.4 first. |

**Do not renumber sections in `READ THIS/`.** Code comments and BLUEPRINT cite
them as `[00 §10.1]`. Append; never renumber.

## Contract version

The clinical contract is **v2, imaging-first**
(`frontend/src/data/contract/domain.v2.ts`). v1's clinical schemas — `report`,
`understanding`, `organStatus.severity`, `reportComparison`, `bodySnapshot` — are
superseded. v1's workflow schemas — session, tasks, notes, signals, account — are
current and unchanged.

See `docs/00_Contract_Migration.md` before touching `data/contract/`.

## Rules that cannot be broken

These exist because the corresponding failure hurts a patient. Do not work
around one to make a screen render.

1. **No clinical claim without evidence.** Every assertion and every organ
   involvement carries a non-empty `evidence` array reaching finding → artifact →
   model run → source locator. If a screen needs a value the contract cannot
   supply with evidence, that is a backend bug — say so, do not work around it.

2. **Missing data is never negative evidence.** `NOT_ASSESSED` is not
   `OBSERVED_ABSENT`, and only the latter may support resolution. An organ that
   was never imaged is not a healthy organ and must not render as one.

3. **Two coordinate spaces, never derived from each other.** `patientSpaceMm` is
   clinical truth. `atlasPosition` is backend-computed display only. When it is
   null, place no marker. A marker in the wrong organ is worse than no marker.

4. **No false precision.** Measurements render with their uncertainty band.
   Inter-reader variability on lesion measurement reaches roughly ±22–25%, so
   `+12.34%` is a design error.

5. **Synthetic data is always visible.** Until real model weights land, states
   are built from simulated output. `containsSyntheticFindings` must be shown on
   screen, not footnoted.

6. **Patient states are append-only.** Rebuilding creates v+1. Never mutate a
   prior state; it is the record of what was believed at the time.

7. **The API image never imports torch.** Model runtimes live under
   `app/sensors/runtime/` and are imported lazily.

8. **No PHI in the imaging database.** Identifiers hashed at ingest, birth year
   only. Portal tables hold PHI and stay structurally separate.

## Language never used

"Diagnoses", "detects cancer", "predicts survival", "clinically validated",
"FDA approved", "replaces", "as accurate as a radiologist". None is currently
true and two are regulated claims.

## Safety tests

`frontend/tools/safety-tests.ts` guards clinical properties, and several exist
because the defect actually shipped. Read them before changing anything they
touch. When you add a clinical invariant, add its test there.

## Working style

- Ask rather than guess when a requirement is ambiguous. A wrong clinical
  assumption is expensive.
- Tests first for anything involving measurement, matching, or fusion.
- Prefer explicit, boring code. No metaclasses, no dynamic attribute magic.
- Contract changes are versioned and announced before deploy — a silent response
  shape change breaks the other half of the team's week.
- Record architectural decisions in `BLUEPRINT/`.

## Current honest status

Frontend: built, v1 contract, migrating to v2.
Backend: architecture implemented and tested, stub mode, no real data yet.
Models: not yet running on real data.
Matcher: not validated — public data supports a smoke test only.
Fused-state benefit: a hypothesis, unestablished, requires a partner cohort.

Do not describe any of the above as more finished than it is, in code comments,
in documentation, or in UI copy.
