# 07 — Clinical safety and limitations

Not a compliance document. This is the list of ways a system like this hurts
someone, and what in the code prevents each one.

## What the platform is

Clinical decision *support*, pre-validation, for research and evaluation. It
assists an oncologist and never replaces their judgement. It does not diagnose,
does not recommend treatment, and does not act autonomously.

## The failure modes, and the mechanism against each

| Failure | Mechanism |
|---|---|
| A number on screen with nothing behind it | `evidence` required at schema level; `_assert()` drops unsourced claims; test fails if a write path bypasses it |
| Absence read as evidence of absence | `NOT_ASSESSED` distinct from `OBSERVED_ABSENT`; only the latter may support `RESOLVED` |
| Invented progression from a false lesion match | Matcher opens a new track rather than forcing a match; organ constraint and distance ceiling; registration applied first |
| False precision implying clinical certainty | Every measurement carries a band and `exceedsVariability` |
| Simulated output mistaken for real | `synthetic` flag on runs, propagated to state, capped confidence, surfaced in UI |
| A model silently changing beneath a claim | `model_version`, `code_sha`, `weights_sha` on every run; evidence trace shows them |
| Retrospective rewriting of what was believed | States append-only; rejection affects future builds only |
| Complete response asserted without coverage | `complete_response` unreachable; insufficient evidence returns `not_evaluable` |
| Atlas marker placed in the wrong organ | `atlasPosition` null unless registration passes threshold; frontend never derives it |

## What must be visible on screen

1. Confidence, wherever a model-derived value appears.
2. The synthetic-data flag, until real weights land.
3. `NOT_ASSESSED` as visually distinct from "no disease found".
4. The rationale on any risk flag or progression indicator.
5. That progression is a computed indicator for review, not a determination.

## Language never used in product or marketing

"Diagnoses", "detects cancer", "predicts survival", "clinically validated",
"FDA approved", "replaces", "as accurate as a radiologist". None of these is
currently true, and two of them are regulated claims.

## Data protection

Imaging tables hold no PHI — identifiers hashed at ingest, birth year only. The
portal tables hold PHI and are the compliance surface. Keep them structurally
separate.

Operating in India, the DPDP Act 2023 applies to the portal side. Health data is
sensitive personal data in most jurisdictions you might later operate in. Get
advice before onboarding a real patient; this document is not it.

Public research data carries its own terms — CC BY 4.0 requires attribution, and
several collections are controlled-access with conditions that survive download.

## Before any clinician uses this on a real patient

- [ ] Real weights, no synthetic findings in any served state
- [ ] Clinician sign-off on rendered terminology
- [ ] Evidence trace verified end to end on ≥20 real cases
- [ ] Audit log of every read and every state build
- [ ] Documented limitations shown in-product, not just in a file
- [ ] Legal review of data handling and claims
- [ ] Named clinical advisor accountable for output review

## Current honest status

Backend architecture: implemented, tested, stub-mode.
Models: not yet running on real data.
Matcher: not validated. Public data supports a smoke test only.
Fused-state benefit: hypothesis, unestablished, requires a partner cohort.
