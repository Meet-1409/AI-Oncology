# 04 — Backend schema

Fourteen tables in four layers. Implemented and tested; this documents the intent
so the constraints aren't "fixed" later by someone who doesn't know why they exist.

## Layer 1 — raw data

**patients** — `id`, `mrn_hash` (unique), `external_id`, `sex`, `birth_year`,
`primary_diagnosis`, `primary_site`, `diagnosis_date`, `cohort`.
No name, no email, no DOB. Birth *year* only. Identifiers are hashed at ingest
with `MRN_SALT` and the raw value is never persisted.

**timepoints** — `patient_id` FK, `occurred_at`, `kind`, `label`, `meta`.
The spine of the longitudinal engine. Indexed on `(patient_id, occurred_at)`.

**artifacts** — `patient_id`, `timepoint_id`, `modality`, `storage_uri`,
`sha256`, `mime_type`, `size_bytes`, `acquired_at`, `meta` (JSONB).
Unique on `(patient_id, sha256)` — re-ingest is idempotent. Immutable: nothing in
the system ever mutates an artifact.

`meta` carries the geometry the coordinate engine needs — `spacing`, `origin`,
`direction`, `frame_of_reference_uid`, `series_uid`, `shape` for volumes; `mpp`,
`objective_power`, `level_dimensions` for slides; and the temporal tag actually
found, `(0012,0052)` or `(0012,0050)`, with the raw value.

## Layer 2 — model runs

**analysis_runs** — `patient_id`, `artifact_id`, `model_key`, `model_version`,
`task`, `status`, `params`, `metrics`, `output_uri`, `error`, `started_at`,
`finished_at`, `code_sha`, `weights_sha`.
Everything needed to reproduce a result. `metrics.synthetic` marks stub output.

**registrations** — `fixed_artifact_id`, `moving_artifact_id`, `method`,
`transform_uri`, `affine`, `quality`. Unique per `(fixed, moving, method)`.
Required before any cross-timepoint lesion comparison.

## Findings — joined-table inheritance

**findings** (base) — `kind` discriminator, `patient_id`, `timepoint_id`,
`artifact_id`, `analysis_run_id`, `label`, `confidence`, `observed_at`,
`payload`, `verified_by`, `verified_at`, `rejected`.

Subtables carry real columns, not JSON, so `WHERE volume_mm3 > x` works:

- **lesions** — organ, laterality, `centroid_{x,y,z}_mm`, `bbox_mm`, `volume_mm3`,
  `longest_diameter_mm`, `mean_hu`, `suv_max`, `mask_uri`, `series_uid`,
  `frame_of_reference_uid`, `track_id`
- **pathology_findings** — `roi_bbox_px`, `mpp`, `area_mm2`, cell counts,
  densities, `til_ratio`, `spatial_metrics`, `mask_uri`, `overlay_uri`
- **molecular_markers** — gene, variant, `hgvs_p`, vaf, assay, status
- **clinical_facts** — `fact_type`, code system + code, value, unit,
  `effective_date`, `source_span`

**lesion_tracks** — one physical lesion across time. `organ`, `label`,
`is_target`, `state`, `first_seen_at`, `last_seen_at`, baseline/latest diameter,
`delta_pct`, `match_method`.

## Layer 3 — patient state

**patient_states** — `version`, `as_of`, `is_current`, `supersedes_id`, headline
metrics, `summary` JSONB, `modality_coverage`, `completeness`, `confidence`,
`pipeline_version`. Unique on `(patient_id, version)`. Append-only.

**state_assertions** — `state_id`, `subject`, `predicate`, `object_num`,
`object_text`, `unit`, `assertion_type`, `confidence`, `rationale`,
`modality_mix`.

**evidence_links** — `assertion_id`, `finding_id`, `artifact_id`,
`analysis_run_id`, `locator`, `weight`.

## Constraints that are load-bearing

1. **No finding without a run.** Enforced in `runner.py`; there is no other write
   path, and a test fails if one is added.
2. **No assertion without evidence.** `_assert()` drops unsourced claims rather
   than persisting them. Silent, not raising — one bad claim must not fail an
   entire state build.
3. **One current state per patient.** Partial unique index on
   `(patient_id) WHERE is_current`.
4. **Rejected findings excluded from future builds**, prior states untouched.
5. **`NOT_ASSESSED` never supports `RESOLVED`.** Missing data is not negative
   evidence.

## Workflow tables (separate concern)

`users`, `tasks`, `notes`, `signals` back the portal and are the only tables that
hold PHI. Keep them in a separate schema or database from the imaging tables, so
the de-identification boundary is structural rather than a convention someone
forgets.
