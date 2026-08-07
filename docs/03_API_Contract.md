# 03 — API contract

Replaces "App Flow" for the backend. Navigation is Meet's; this is the surface he
navigates against. The OpenAPI spec generated from FastAPI is authoritative;
this document explains the shape and the rules.

## Versioning

All routes under `/api/v1`. Breaking changes ship as `/api/v2` — never as a
silent shape change. Every response is validated against `domain.v2.ts` at the
frontend boundary, so drift fails loudly.

## Auth

`POST /api/v1/auth/login` → JWT (access + refresh). Role claim: `patient` or
`oncologist`. A patient may read only their own data. An oncologist may read
patients where they are the treating oncologist. Enforced in a query dependency,
not per-route — per-route checks are how one route gets forgotten.

## Ingest

```
POST   /api/v1/patients
POST   /api/v1/patients/{id}/artifacts      multipart; returns queued run ids
GET    /api/v1/artifacts/{id}               status, geometry, metadata
GET    /api/v1/runs/{id}                    queued | running | succeeded | failed
```

Uploads are async. The response is a job, not a result. `Artifact.status` drives
the processing UI; failures return a `processing` error kind with a message safe
to render.

Ingest is idempotent on `(patientId, sha256)`. Re-uploading the same study is a
no-op that returns the existing artifact.

## Reads

```
GET /api/v1/patients/{id}/space             the one aggregated read
GET /api/v1/patients/{id}/state             current version
GET /api/v1/patients/{id}/state/history
GET /api/v1/patients/{id}/lesions           paginated
GET /api/v1/patients/{id}/tracks
GET /api/v1/patients/{id}/organs
GET /api/v1/patients/{id}/timeline
GET /api/v1/patients/{id}/body              lesions grouped by organ, both coord spaces
```

`/space` returns `patientSpaceV2Schema` and is what Patient Space renders from.
Everything else exists for drill-down and for keeping `/space` from growing
without limit.

## Evidence — the endpoint the product exists for

```
GET /api/v1/assertions/{id}/evidence
```

Returns claim → finding → artifact → model run → locator. If this endpoint is
slow or incomplete, the product's core claim fails, so it is measured and tested
directly rather than incidentally.

```
GET /api/v1/artifacts/{id}/region?locator=...
```

Returns the rendered source region — a DICOM slice crop or a WSI tile — so the
evidence viewer shows pixels, not coordinates.

## Clinician actions

```
POST /api/v1/findings/{id}/verify           { reviewer, accept }
POST /api/v1/patients/{id}/state:rebuild
```

Rejecting a finding excludes it from future state builds and leaves prior states
intact. Prior states are the record of what was believed at the time and are
never rewritten.

## Errors

Reuse the v1 `apiErrorKind` enum exactly — `validation`, `authentication`,
`authorization`, `not_found`, `conflict`, `file`, `processing`, `network`,
`server`. Messages are safe to render and never expose internals.

## Rules the backend enforces so the frontend cannot violate them

1. No assertion is returned with an empty `evidence` array.
2. `atlasPosition` is null unless registration succeeded above threshold.
3. Measurements carry a band, or `uncertainty: null` with a stated reason.
4. `containsSyntheticFindings` is always populated, never omitted.
5. An organ with no imaging returns `NOT_ASSESSED`, never `none`.
6. Temporal offsets are never comparable across `referenceEvent` values; the API
   refuses to compute such an interval rather than returning a plausible number.
