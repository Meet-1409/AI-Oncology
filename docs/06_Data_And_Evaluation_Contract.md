# 06 — Data and evaluation contract

The rules that stop absence being read as evidence. Every one of these was
derived from a specific property of the real datasets, not from principle.

## Datasets

| Function | Source | Limitation |
|---|---|---|
| Multimodal spine | CPTAC-CM | Small; radiology subject count needs verifying against NBIA |
| Pathology volume | TCGA-SKCM / GDC | One slide per patient, no radiology |
| Lesion identity GT | EAY131 annotations | Target-only; known missing-slice defect |
| Molecular / outcomes | GDC, CPTAC | — |
| Future holdout | S0819 | Currently controlled-access |

Public data can establish: pipeline works, annotations join to images, temporal
matching behaves plausibly, obvious hallucinations get caught.

Public data cannot establish: clinically meaningful matcher accuracy, real-world
progression detection, or that the fused state beats the best single modality.

## Annotation completeness

Every annotation set is tagged `EXHAUSTIVE`, `TARGET_ONLY` or `UNKNOWN`. The NCI
family is `TARGET_ONLY` — RECIST caps annotations at 5 lesions per scan, no more
than 2 per organ. Consequences:

- An unannotated detection is `UNKNOWN`, not a false positive.
- Detector precision computed over target-only GT is invalid.
- Annotation completeness is a **state-builder input**, not evaluation metadata.

## Identity evaluation

Predictions are associated to GT independently at each timepoint before identity
is scored. Required config: `association_method`, `association_threshold`,
`association_coordinate_space`. Evaluation refuses to run without them.

Report `identity_accuracy` **and** `evaluable_fraction` together. Accuracy alone
is an invalid result. Threshold is swept, not chosen — if two configs swap places
across reasonable thresholds, there is no winner.

Stratify by lesion diameter and organ. RECIST targets are selected for being
large and measurable, so the aggregate flatters the matcher.

## Known blind spot

The ≤2-per-organ cap means the GT never contains dense same-organ disease — the
exact case where greedy matching is most likely to invent progression. Needs a
separate synthetic stress benchmark, reported separately and never mixed into the
clinical number.

## Measurement uncertainty

Two reference bands, never one hardcoded number:

- **Technical / test–retest**: same-day repeat CT, computer-assisted
  unidimensional, roughly −7% to +6%.
- **Reader**: RECIST inter-reader single-lesion limits reaching roughly −22% to
  +25%.

Neither generalises from lung CT to melanoma, MRI or PET without matching
evidence. Where no evidence base exists, `uncertainty: null` with a stated reason.

## Temporal coordinates

`offset_days` alone is not a key. The coordinate is
`(collection, patient_id, reference_event, offset_days)`. Interval computation
requires all three to match, otherwise `TemporalReferenceMismatchError`. EAY131
anchors to registration; CPTAC-CM to pathological diagnosis. Same number,
different zero.

## Geometry QA

`series_geometry_status`: `VALID`, `MISSING_SLICES`, `IRREGULAR_SPACING`,
`ORIENTATION_ERROR`, `UNKNOWN`. A series with missing slices cannot silently
enter matcher validation.

## Licence provenance

Annotation licence is never inherited by parent images. They are independent
assets with independent access records. Both are recorded per collection, with
`parent_access_status` and the date checked.

## Holdout pre-commitment

If S0819 source-image access becomes available, it must not be used for model
development, threshold tuning, failure-driven iteration or hyperparameter
selection before its first formal evaluation. Written now, deliberately, so
access returning later does not quietly turn it into another dev set.
