# 04 — Component System and Responsive Behaviour

**Covers blueprint topics 11, 20, 21, 22.**

---

## 1. Component philosophy (topic 11)

### 1.1 Four tiers

| Tier | Knows about | Example |
|---|---|---|
| **Primitives** | nothing domain-specific | Control, Input, Surface, List, Dialog |
| **Motion primitives** | the motion system only | SpatialTransition, SharedElement, Reveal |
| **Patterns** | domain concepts, not data sources | SeverityIndicator, Confidence, EvidenceLink, ContextualOrbit |
| **Feature components** | their feature's view-model | JourneyScrubber, BodyScene, EvidenceLibrary |

Lower tiers never import higher ones (doc 00 §4.1).

### 1.2 Principles

**Presentational by default.** Components render what they are given. Business logic lives in the data layer `[02 §2]`. A component that decides *what* something clinically means is a defect.

**Composition over configuration.** A component with many boolean flags becomes unmaintainable. Prefer composition; reserve variants for genuinely closed sets (severity 1–5, four task statuses).

**Accessible by construction.** Behavioural components are built on Radix so keyboard interaction, focus management and ARIA are correct by default rather than retrofitted `[00 §16]`.

**Motion-aware, not motion-owning.** Components declare *what* transitions (a shared element id); the Shell decides *how*. This keeps motion coherent globally `[04 §27]` instead of each component inventing its own.

**No placeholders.** Every component ships complete, with its loading, empty and error states `[00 §17.6]`.

---

## 2. Reusable component list (topic 20)

### Primitives
| Component | Notes |
|---|---|
| `Control` | primary / secondary / quiet / danger `[04 §11]` |
| `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup` | always labelled `[04 §12]` |
| `Field` | label + control + validation message + required indicator |
| `Surface` | continuous background at an elevation level |
| `Panel` | discrete container — **comparison contexts only** `[04 §10]` |
| `List`, `ListItem` | continuous browsable sets |
| `Table` | genuine row comparison only `[04 §13]` |
| `Badge` | status; always paired with text |
| `Avatar`, `Identity` | person representation |
| `Separator`, `Tooltip`, `Dialog`, `Popover` | Radix-backed |
| `Pagination` | large collections `[09.4 §24]` |
| `ScrollArea` | consistent overflow |

### Motion primitives
| Component | Purpose |
|---|---|
| `SpatialTransition` | depth change, zoom in/out |
| `SharedElement` | element → space continuity `[04 §6]` |
| `Reveal` | progressive disclosure on approach |
| `Stagger` | ordered reveal of a sequence |
| `AttentionShift` | draws attention to what changed |
| `ProcessIndicator` | sustained "system is working" |

### 3D primitives
| Component | Purpose |
|---|---|
| `SceneHost` | canvas, tier gate, error boundary, context preservation |
| `LightingRig` | one lighting language across all 3D |
| `CameraController` | damped, constrained, resettable `[09.6 §8]` |
| `SelectableMesh` | pointer + keyboard selectable geometry |

### Patterns
| Component | Purpose |
|---|---|
| `ContextualOrbit` | 4–6 contextual destinations `[04 §5]` |
| `FocusLayer` | Depth 3 above a preserved parent `[04 §4]` |
| `ContinuousReturn` | one depth out `[04 §5]` |
| `IntentBar` | intent + patient search `[04 §5]` |
| `ProgressiveDisclosure` | replaces tabs/accordions `[06 Phase 5]` |
| `SeverityIndicator` | severity swatch + mandatory text `[09.6 §7]` |
| `Confidence` | AI confidence, always visible `[09.7 §13]` |
| `EvidenceLink` | traceable link to source report `[08 §13]` |
| `ProcessingStatus` | four report states `[09.4 §15]` |
| `TaskStatus`, `Priority` | status + text `[09.8 §8]` |
| `NoteVisibility` | shared vs private, unmistakable `[09.9 §5]` |
| `TimeScrubber` | continuous time control `[09.5 §5]` |
| `UploadZone` | in-place, resumable `[09.4 §6]` |
| `DocumentPreview` | zoom, paging, full screen `[09.4 §16]` |
| `EmptyState`, `ErrorState`, `LoadingSurface` | system states |
| `SearchField`, `FilterGroup`, `SortControl` | shared across Evidence, Journey, Actions, Guidance |

Search / filter / sort are single implementations reused everywhere, because they are specified near-identically across four feature docs `[09.4 §11-13]`, `[09.5 §9-11]`, `[09.8 §13-15]`, `[09.9 §12-14]`.

---

## 3. Global component behaviour (topic 21)

Behaviours every component honours, enforced by review and by the shared test suite (doc 05 §5).

**Focus.** Visible focus indicator meeting 3:1 contrast, never removed. Focus moves into a Focus layer on open and returns to the originating element on close. Focus is trapped inside modal Focus layers only.

**Keyboard.** Every interactive element reachable and operable by keyboard `[00 §16.1]`. `Escape` = Continuous Return. Logical, DOM-order tab sequence.

**Labelling.** Every interactive element has an accessible name `[00 §16.4]`. Icon-only controls always carry a text label.

**State encoding.** Every state uses at least two channels — colour plus text or shape `[00 §16.2]`.

**Motion.** All motion via tokens; all respect reduced motion `[00 §11.9]`.

**Loading.** Components render their own structure before their data `[04 §21]`. Never a blank region.

**Errors.** A component failure is contained by the nearest boundary; the surrounding space survives `[02 §13]`.

**Data.** Components receive data as props or via a feature view-model hook — never fetch directly. Keeps them testable and prevents request waterfalls.

**Content safety.** Long text truncates predictably and never breaks layout `[04 §13]`.

**Destructive actions.** Always confirmed, never the default focus `[04 §11]`.

---

## 4. Responsive behaviour (topic 22)

### 4.1 Principle

**The spatial model is preserved at every size** `[04 §24]`. Depth, continuity and navigation semantics do not change between desktop and mobile. What changes is composition. A mobile user is in the same environment, not a reduced version of it.

Desktop is primary; tablet fully functional; mobile supports patient workflows `[04 §24]`.

### 4.2 Adaptation by surface

| Surface | Desktop | Tablet | Mobile |
|---|---|---|---|
| Contextual Orbit | arranged around the focal object | condensed arc | bottom-anchored row — **never a nested menu** `[04 §24]` |
| Patient Space | Body centre, revealed content beside | Body centre, content below | Body upper, content below, Body stays present |
| Journey | horizontal continuous path | horizontal | vertical path, same continuity |
| Focus | centred layer over dimmed parent | centred layer | full-height sheet, parent still behind |
| Comparison | side by side | side by side | stacked with synchronised camera |
| Intent Bar | centred overlay | centred overlay | full-width sheet |
| Evidence | list + preview together | list, preview in Focus | list, preview in Focus |

### 4.3 3D across sizes

Geometry detail, shadow quality and device pixel ratio scale down with viewport and device capability. Clinical meaning never scales down `[00 §13.6]` — organ identity, severity and evidence remain complete at every size.

### 4.4 Input

Pointer, touch and keyboard are equal citizens. Orbit/zoom/pan have touch equivalents; every one also has a keyboard equivalent `[09.6 §22]`. Hover is never the only way to reveal information — it is an accelerator, never a requirement.

### 4.5 Patient-priority on mobile

Since mobile chiefly serves patients `[04 §24]`, the patient's Actions remain the first thing visible `[09.8 §5]`, and upload must work well from a phone camera — the most common real-world path for a patient uploading a report `[09.4 §6]`.
