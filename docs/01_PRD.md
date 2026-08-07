# 01 — PRD (revised, imaging-first)

Supersedes the product framing in `READ THIS/00_Ground_Rules.txt` where they
conflict. The Ground Rules' *values* stand unchanged: assist, never replace;
every feature solves a real clinical problem.

## App name

AI Oncology — Patient Intelligence Platform.

## One line

One patient, every modality, over time — with every number traceable to the scan
region it came from.

## The problem

Cancer information for a single patient is spread across pathology, CT, MRI, PET,
molecular tests, reports and prior scans. Each specialist sees a slice. Nobody
holds a continuously updated picture of what is happening to *this* patient.

**Unvalidated.** Whether this fragmentation is painful enough to pay for is the
open question of the next month, and the answer comes from clinician interviews,
not from this document.

## What makes it different

Existing tools answer "what is in this slide" or "what is in this scan". This
answers "what is happening to this patient" — and shows its working. Every value
on screen clicks through to the finding, the artifact, the model version, and the
region of the source image that produced it.

The differentiator is not any single model. It is the patient state and the
evidence graph beneath it.

## Users

- **Oncologist** — primary. Wants the current picture fast, and wants to check
  anything that looks surprising.
- **Patient** — secondary. Wants to understand their own situation.

Every patient has one primary oncologist. No other roles in v1.

## Must have

- Ingest DICOM series (CT/MRI/PET) and whole-slide images with correct geometry
- Ingest clinical reports and molecular results with source spans retained
- Segment lesions, place them in patient space, assign organs
- Cell-level pathology analysis with spatial tumour-microenvironment metrics
- Follow the same lesion across timepoints
- Build a versioned patient state where every assertion carries evidence
- Evidence trace: any value → source region
- Clinician verify/reject on any finding
- Body view driven by measured lesions
- Timeline of timepoints and artifacts

## Nice to have

Report-to-report text comparison; treatment-response prediction; cohort search;
multi-institution support; cancers beyond melanoma.

## Explicitly out of scope for v1

Diagnosis. Treatment recommendation. Autonomous decisions. Replacing a tumour
board. Real-time hospital integration. Cancers other than melanoma. Anything
claiming validated clinical accuracy.

## User stories

- As an oncologist, I want one view of this patient's disease across modalities,
  so I don't reconstruct it from four systems.
- As an oncologist, I want to click any number and see the scan region it came
  from, so I can decide whether to trust it.
- As an oncologist, I want to reject a wrong finding and have it excluded going
  forward, without altering the record of what was believed before.
- As an oncologist, I want to see what the system has NOT assessed, so absence of
  a finding is never read as absence of disease.
- As a patient, I want to understand my situation without medical training.

## Success metrics — first 3 months

Not usage. Signal.

1. Ten to fifteen clinician interviews completed.
2. At least three clinicians say the fragmentation problem is real and specific.
3. One institution engaged on a retrospective de-identified cohort.
4. Backend produces a fully evidence-traced state for a real multimodal patient.
5. Matcher smoke-tested on public data with an honest, published n.

Signups and DAU are meaningless at this stage and will not be tracked.

## The claim we cannot yet make

That a fused patient state helps more than the best single modality. No public
dataset can establish it. Until a partner cohort exists, this is a hypothesis and
must be described as one — in the product, in the pitch, and to clinicians.
