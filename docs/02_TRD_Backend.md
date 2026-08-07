# 02 — TRD (backend)

Extends `READ THIS/02_Technical_Requirements_Document..txt`. Frontend stack is
unchanged and Meet's. This covers backend, AI services and infrastructure.

## Stack

| Layer | Choice | Why |
|---|---|---|
| API | Python 3.12 + FastAPI | Same language as the model stack; no serialization boundary between inference and API |
| ORM | SQLAlchemy 2.0 (typed) + Alembic | Joined-table inheritance for findings; migrations that survive schema churn |
| DB | PostgreSQL 16 | JSONB, partial indexes, real constraints |
| Queue | Celery + Redis | WSI inference is minutes, not milliseconds — it cannot be an HTTP request |
| Object storage | MinIO locally, S3 in cloud | DICOM/WSI are large and immutable; content-addressed by SHA-256 |
| Auth | JWT, backend-issued | Frontend holds no auth logic |
| Deploy | Docker Compose now; single cloud VM + managed Postgres later | Kubernetes is not a seed-stage problem |
| GPU | Cloud instance, worker image only | The API container must never import torch |

## Two container images, deliberately

- **API image** — slim, no torch, no CUDA. Fast to build and deploy.
- **Worker image** — torch, MONAI, openslide, SimpleITK, pydicom. Big, slow, GPU.

They share the codebase but not the dependency tree. Model runtimes live under
`app/sensors/runtime/` and are imported lazily so importing a sensor never pulls
in torch.

## AI services (sensors)

Every model implements one interface: artifact in, typed findings out. Nothing
outside `app/sensors/` knows which backbone ran.

| ID | Task | Approach | Status |
|---|---|---|---|
| M1 | Nuclei instance segmentation + classification | Infinity-Net / PUMA, finetuned | Existing work |
| M2 | Tumour region segmentation (WSI) | Frozen pathology encoder + head | Zero-shot first |
| M3 | Organ segmentation (CT) | TotalSegmentator, pretrained | No training |
| M4 | Lesion segmentation (CT/MRI/PET) | nnU-Net / MONAI baseline | Zero-shot first |
| M5 | Report extraction | Rules + LLM, span-grounded | No training |

Rule: **no finetuning run before the zero-shot number is recorded.** Checkpoint
licences go in `docs/WEIGHTS.md` before the weights are used — several strong
medical checkpoints are research-only, and a model you cannot ship is worth
knowing about in week one.

## Key libraries

pydicom, SimpleITK (geometry + registration), openslide-python, MONAI, torch,
scikit-image, numpy/scipy, pydantic v2, celery, boto3.

## Environment variables

`DATABASE_URL`, `REDIS_URL`, `STORAGE_ROOT`, `S3_*`, `MRN_SALT`, `JWT_SECRET`,
`ALLOW_STUB_SENSORS`, `INFINITY_NET_WEIGHTS`, `LESION_SEG_WEIGHTS`,
`TOTALSEG_WEIGHTS`, `LLM_API_KEY`.

`MRN_SALT` is a primary secret. Rotating it orphans every patient record.

## Hard constraints

1. The API image never imports torch.
2. No PHI in the imaging database. Identifiers hashed at ingest.
3. Voxel indices never cross a module boundary — patient-space millimetres only.
4. No finding without an `AnalysisRun`. No assertion without an `EvidenceLink`.
5. Patient states are append-only.
6. Stub mode always works, so a failed download never blocks a demo.
7. Contract changes are versioned and announced to Meet before deploy.

## Folder structure

```
app/
  contracts/     pydantic mirrors of domain.v2.ts — the source of truth
  models/        SQLAlchemy schema
  sensors/       model adapters
    runtime/     GPU code, lazily imported
  services/      coordinates, matching, registration, state_builder, ingest
  workers/       celery tasks
  api/           FastAPI routers
migrations/      alembic
tests/
```
