# AI Oncology — project documents

Source of truth for the imaging-first rebuild. Paste the relevant ones at the
start of any AI coding session and say: use these as the source of truth.

| # | Document | For |
|---|---|---|
| 00 | Contract migration | Meet — what survives, what changes |
| 01 | PRD | Everyone |
| 02 | TRD (backend) | Backend + AI |
| 03 | API contract | Both |
| 04 | Backend schema | Backend |
| 05 | Implementation plan | Everyone |
| 06 | Data and evaluation contract | AI / data |
| 07 | Clinical safety and limitations | Everyone |
| — | `contract/domain.v2.ts` | Meet — drop in alongside v1 |

Still yours to write, and better written by you than by an AI: `04_UI_UX` (Meet's
ART_DIRECTION.md and BLUEPRINT already cover it) and `docs/WEIGHTS.md` (fill it
from actual model cards before using any checkpoint).

Superseded: v1 clinical schemas in `frontend/src/data/contract/domain.ts`. The
workflow half of that file stands.
