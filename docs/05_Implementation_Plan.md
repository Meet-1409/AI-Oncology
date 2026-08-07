# 05 — Implementation plan

Six weeks, 8 Aug → 19 Sep 2026. Backend only. Phases have done-criteria, not just
tasks.

## Phase 0 — today (purchases and latency, not engineering)

- GPU instance provisioned. Blocks Phase 3.
- TCIA downloads started: CPTAC-CM radiology + pathology (~120GB, Aspera),
  EAY131 annotations and parent images. Blocks Phases 2–4.
- NIH controlled-access applications submitted (S0819, CALGB50303, AHOD0831,
  AHEP0731). Weeks of latency, minutes of work.
- TCGA-SKCM manifest pulled from GDC.

**Done when:** all four are in flight.

## Phase 1 — week 1: contract freeze and real ingest

The deliverable that matters is Meet's, not yours: frozen OpenAPI + mock server
by Wednesday. He is blocked until then.

- Postgres for real; run migrations; fix what SQLite hid
- MinIO/S3, content-addressed artifacts
- DICOM ingest → geometry into `Artifact.meta` exactly as `Geometry.from_meta`
  expects. This is the join between real data and every downstream measurement.
- Temporal ingest: `(0012,0052)` with fallback to `(0012,0050)`, recording which
- WSI ingest: mpp, objective power, levels
- Celery + Redis; runs become queued jobs with pollable status

**Done when:** a real CPTAC-CM patient is ingested and `voxel_to_patient` on a
known voxel matches hand-computed ImagePositionPatient arithmetic.

## Phase 2 — week 2: radiology sensors

- TotalSegmentator wired; its organ map replaces the bounding-box fallback
- Lesion segmentation baseline, zero-shot, number recorded, 20 failures inspected
- `series_geometry_status` QA on ingest
- **EAY131 surviving-cohort query** — half a day, produces N

**Done when:** real lesions with real organ assignments render through `/body`.
**Gate:** N < 25 → no evaluation harness in Phase 4, manual inspection only.

## Phase 3 — week 3: pathology

- Infinity-Net runtime wired: tissue masking, tiled inference, instance extraction
- Pixel → micrometre conversion using slide mpp, with the unit test written first
- Spatial TME metrics on real slides
- Sanity check against TIL-WSI-TCGA on overlapping SKCM slides
- Measure time per slide before running any cohort

**Done when:** real TIL ratios land within a plausible range against an external
reference. **Highest schedule risk of the six weeks.**

## Phase 4 — week 4: longitudinal

- Rigid registration (SimpleITK) populating `Registration.affine`
- `NOT_ASSESSED` vs `OBSERVED_ABSENT` fix in `_update_track` — known bug
- Matcher against the EAY131 cohort with the association layer
- Threshold sweep; report `evaluable_fraction` alongside accuracy

**Done when:** tracks exist over real serial scans, reported as a smoke test with
an honest n and no accuracy claim.

## Phase 5 — week 5: clinical, molecular, fusion

- Report parser on real text, every fact span-grounded or dropped
- Molecular ingest from GDC
- State builder on a genuinely multimodal real patient
- Evidence trace verified end to end, claim to pixels
- Strip false precision; measurements ship with bands

**Done when:** one real patient, four modalities, every value traceable.

## Phase 6 — week 6: hardening and freeze

- Auth, request logging, error handling per the `apiErrorKind` enum
- Performance and pagination at cohort scale
- Deployed environment Meet can hit
- Frozen demo cohort in a seed script — never demo off a live pipeline
- `docs/LIMITATIONS.md` published
- Buffer for the two phases that overran

**Done when:** deployed, real patients, documented limits.

## Weekly rhythm

Monday 30 min with Meet: what lands this week, any contract change. Contract
changes are versioned and announced before deploy. Friday: demo the deliverable.
If it can't be demonstrated, it isn't done.

## Running in parallel, non-negotiable

Week 1: access applications in; three clinician conversations **booked with
dates**. Weeks 2–5: interviews conducted, notes same day. Week 6: 10–15 total.

The backend cannot validate the fusion claim. Only these conversations can. A
week 6 with a working backend and two interviews means the build succeeded and
the company didn't.
