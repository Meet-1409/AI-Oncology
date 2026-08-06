# AI Oncology Patient Intelligence Platform — Frontend Handover

**Repository:** `C:\Users\Asus\Desktop\AI Oncology`
**Scope of this document:** the frontend, end to end. Backend, AI and infrastructure are out of scope and have not been started.
**Originally written as of:** commit `3a05b81`, 3 August 2026. **Updated 4 August 2026** — see §2.1 and the commit list in §14 for what changed since.

**Updated again 4 August 2026, evening** — realistic organ anatomy, sex-specific organs and a first pass of motion/depth throughout the application. See §2.2, §7 and §9.

**Updated again 4 August 2026, later that evening** — a darker theme, a real skin-like Body shell (the point-cloud "dots" are gone), and a two-column Practice Space with a demo Digital Twin. See §2.3.

**Updated 6 August 2026** — no invented clinical data anywhere, separate patient/doctor sign-in, and real sculpted anatomy (Z-Anatomy, CC BY-SA 4.0) installed and rendering. See §2.4. **A substantially higher visual bar has been set for the work still ahead — read `HANDOVER_FOR_CHATGPT.md` Part 2 before designing anything.**

---

## 1. Read this first

Three things will save you the most time.

**`READ THIS/` was deliberately cut down to two files, 4 August 2026: `00_Ground_Rules.txt` and `02_Technical_Requirements_Document.txt`.** It used to be nineteen. The Product Owner asked for this directly: everything else in that folder was locked-in feature/flow detail that "can change every now and then," and treating it as permanently frozen was the wrong level of rigidity. **Ground Rules stay permanent and non-negotiable — follow them exactly, always, and implement any future change to that file the moment it happens.** The TRD is kept as the durable architecture reference (overall system split, module responsibilities, cross-cutting rules) — not a rigid spec either, but a useful map. Everything the seventeen removed documents used to pin down (exact screen layouts, navigation trees, per-feature business rules) is now something to use good engineering judgment on, informed by the Ground Rules, the actual codebase, and `BLUEPRINT/`, rather than something to look up and match exactly. The old files are not gone — they're recoverable from git history (`git show <commit>:"READ THIS/<file>"`) if a past decision's original wording is ever needed. Code comments citing sections of the removed documents (`[09.4 §14]` etc.) were left as-is: they're historical rationale, not live links, and rewriting all of them wasn't part of what was asked.

**`BLUEPRINT/` is the engineering companion and *is* editable.** Records how requirements were turned into a build, and why. If you make an architectural decision, record it there.

**The safety tests are not UI tests.** `frontend/tools/safety-tests.ts` guards clinical properties, and several exist because the corresponding defect actually shipped and was caught. Read section 6 before changing anything they touch.

---

## 2. Current state

### Complete

| Area | State |
|---|---|
| Design system, tokens, primitives, patterns | Complete, with a dev-only Showcase |
| Global shell, depth model, spatial travel | Complete |
| Entry (landing) and authentication UI | Complete |
| Home Space / Practice Space / Patient Home Space | Complete |
| Patient Space with Contextual Orbit | Complete |
| The Body (Digital Twin) — 3D and structured | Complete, with real sculpted anatomy installed |
| Journey, Evidence, Understanding, Actions, Guidance | Complete |
| Signals, Account, Intent Bar (⌘K) | Complete |
| Data layer — zod contracts, adapter, mock store | Complete, backend-ready |
| Light and dark themes | Complete |

### Outstanding

- **The premium visual rebuild.** The product owner has set a far higher design bar than the application currently meets — see §2.4 and `HANDOVER_FOR_CHATGPT.md` Part 2. Entry, Auth, the dashboards, per-screen atmosphere and a systematic microinteraction pass are all still to do.
- **Female anatomy.** The installed atlas is male-only; a properly-licensed female body and organ set still needs sourcing. See §2.4.
- **In-app attribution.** CC BY-SA 4.0 requires the credit to be visible to users, not only in the repository. The Account space is the intended place and it is not yet built. See `ATTRIBUTIONS.md`.
- **Real-device audit.** See section 2.1 below — a real-browser/DOM-level pass is done; hardware has not been touched.
- **Backend integration.** See section 9.

### 2.1 Completed since the commit above

- **Report comparison view** `[09.4 §14]` — done. `data/contract/domain.ts` gained `reportComparisonSchema`; the mock layer (`data/adapters/mock-store.ts`) compares two reports' `keyFindings`, classifying only what a documented keyword vocabulary or a verbatim repeat actually supports (`stable`/`progression`/`regression`) and surfacing anything else, unclaimed, as `otherFindings` — asserting a direction the wording doesn't support would be interpreting beyond available evidence `[08 §9]`. `ComparisonFocus` (`spaces/focus/index.tsx`) and a compare-selection mode in `EvidenceView` are the UI. Verified live against the seeded r3→r7 breast-MRI pair (100% confidence, three correctly-classified improvements) in an actual browser, not just tests.
- **Document preview zoom and paging** `[09.4 §16]` — done, as `components/patterns/document-preview.tsx`. Zoom (50%–250%, real `transform: scale`) and full screen (real Fullscreen API) are fully functional. Page navigation honestly shows "Page 1 of 1" with Previous/Next disabled rather than inventing a page count `[00 §5.8]` — there is still no file storage backend, so there is no real multi-page document to page through; the controls are real and already wired for a real page count the moment one exists.
- **Test runner** — Vitest + `@testing-library/react` + `@testing-library/user-event` + `@testing-library/jest-dom`, folded into `npm run verify`. **Not** `@axe-core/react` — that package's own README says it does not support React 18+. `jest-axe` is used instead (runs `axe-core` directly against rendered DOM, so it's React-version-independent); see BLUEPRINT `05 §9`. 20 tests, 0 failures, 0 axe violations across the components exercised.
- **Responsive/accessibility audit (feasible subset)** — done. No horizontal overflow at 768px or 375px for Evidence, compare-selection mode, `ComparisonFocus`, or `DocumentPreview`; Escape closes Focus layers; touch targets confirmed sized via the existing `pointer-coarse:` responsive classes (structurally verified — this environment doesn't emulate a coarse pointer, so the 44px path itself wasn't visually observed). axe-core covers structural accessibility only — contrast checks are disabled under jsdom (no real layout engine) and remain a manual/real-browser check.
  - **Flagged, not fixed (out of scope for this pass):** the Body's WebGL canvas appeared stuck at its default 300×150 buffer regardless of container size when the browser window was resized in this session — WebGL context creation succeeded and `BodyStructured` (the accessible fallback) rendered and worked correctly at every tested size, so nothing was blocked, but a screenshot to confirm whether this is a real R3F/ResizeObserver issue or an artifact of this specific remote browser wasn't obtainable here. Worth a look with real screenshot tooling or a device before the next release.
- **Unused `motion` dependency** — removed, along with its now-dead `vendor-motion` manual chunk in `vite.config.ts`.

### 2.2 Completed since 2.1 — realistic anatomy, and motion/depth throughout

The product owner asked directly for two more things: organs that read as real organ shapes rather than "blobs flying over" the body, and a level of restrained, real-time motion throughout the application comparable to Vercel/Apple — while explicitly warning against it becoming a marketing-site full of decorative effects that would confuse a non-technical clinical audience. Both are done. See §7 and §9 for the durable technical description; this is the changelog entry.

**Realistic, sex-specific organ anatomy** `[00 §6.15]`:
- Liver, both lungs (with a cardiac notch on the left), heart, both kidneys (with the medial hilum concavity), stomach, spleen, pancreas, bladder, thyroid and brain are now bespoke lofted meshes — the same `Section`/spline/superellipse/loft technique the body shell already used, extended with new per-organ section tables in the new `features/body/organ-shapes.ts`, not a new geometry engine. The colon keeps a primitive (an oval torus) since a donut shape already reads correctly; lymph nodes and bones stay clusters of primitives since they were never the complaint.
- Every organ now has its own colour (`design/theme.ts`'s new `organPalette`), drawn only from hue families outside the red band so it can never be confused with the severity scale, which continues to override it exactly as before whenever severity > 0.
- **The organ set is now sex-conditional, not just the body shell.** `uterus`, `left-ovary` and `right-ovary` are new organs, present only for the female form; `prostate` is present only for the male form; both breasts stay present for every form (male breast cancer is rare but clinically real) with a reduced scale on the male form as a stylization. `selectableIdsFor(form)` in `anatomy.ts` is the single filter both `BodyScene` (3D) and `BodyStructured` (accessible) draw from, so the two views cannot drift apart on which organs exist for which patient — the same guarantee §6.3 already gave for organ *content*, now extended to organ *presence*.
- `tools/safety-tests.ts` was extended, not weakened, to match: it now asserts containment and reachability per body form, and that the female/male-only organs never appear on the wrong form. 17 checks, up from 16.
- **The tumor itself is deliberately not built.** The plan is documented in `features/body/README.md`: many overlapping spherical blobs merged closely enough to read as one irregular mass (a metaball approach), driven by data the backend will supply once it exists. Building it now would mean inventing the shape a real finding should have.

**Motion and depth, applied throughout the authenticated application** `[04 §6]`, within the existing 180–420ms envelope — nothing here touches the cinematic layer or its boundary (§8):
- `components/motion/reveal.tsx` — the one component that mediates almost all of this — had a real defect fixed: it previously rendered content already in its final state, so there was nothing for the CSS transition to animate *from*. It now mounts in the from-state and flips to the to-state one frame later, the same pattern already used by `SpaceTransition`/Entry. `Confidence`'s bar (`components/patterns/clinical.tsx`) got the identical fix locally for its width fill.
- `components/primitives/surface.tsx` gained an opt-in `interactive` variant and a cursor-reactive `tilt` prop, gated off entirely under reduced motion and on touch pointers.
- `components/patterns/tab-rail.tsx` is a new, reusable sliding-underline tab control; it replaced the hand-rolled tab markup in `AccountSpace` and `PatientSpace`'s Contextual Orbit.
- `components/motion/use-on-approach.ts` is a new, app-safe (not cinematic) on-approach reveal hook.
- Applied mechanically: staggered reveals on `PatientOverview`'s info cards, `SignalsView` rows and Intent Bar search results; a hover lift on Practice Space's patient rows; a one-shot arrival animation on the unread Signals dot (`.signal-dot` in `index.css`); height transitions already present on the Body's fullscreen/compare toggle got a matching cross-fade on the canvas itself.
- **Intent Bar** (⌘K) — the single highest-leverage surface, per the product owner's own comparison to Vercel/Apple — now has a real entrance (scale + translate + blur-free fade, scrim fading in) and a real exit (same, reversed, with the dialog staying mounted for the closing transition rather than vanishing instantly), instead of one-shot CSS keyframes that only ever played on open. Its result rows stagger in. **Note on verification:** this remote browser tool's tab reports `document.visibilityState: "hidden"`, which suspends `requestAnimationFrame` — the same root cause already flagged in 2.1 for the Body's canvas-sizing anomaly. This made the *entrance* transition unobservable here (rAF-gated), while the *exit* path was confirmed working functionally (Escape correctly closed the dialog via the `setTimeout`-gated unmount, which is not rAF-suspended). The code follows the exact mount-then-flip pattern already proven live elsewhere in this codebase; treat as functionally verified, visually unconfirmed in this specific tool.

### 2.3 Completed since 2.2 — a darker theme, real skin, and a Practice Space home

Three more direct product-owner requests, done together:

- **Darker theme.** `--surface-base`/`--surface-raised`/`--surface-sunken` in `design/tokens.css` are deepened — closer to the Body's own `--body-volume` and the Entry's `--cinema-void`, so the whole application, the Body and the Entry now read as one dark register instead of three different shades of "dark enough." Only the dark theme's semantic values changed; nothing else needed touching, which is the entire reason the token system is two layers.
- **The Body's shell is a real skin surface, not a point cloud.** The previous shell was a nearly-invisible glass mesh (11% opacity) plus a scattered layer of points — the "dots" the product owner was reacting to. The points layer is gone. The shell itself is now warm-toned (`anatomyPalette.skin`, `design/theme.ts`) and substantially more opaque (0.42–0.48, up from 0.11–0.16), lit properly by the scene rather than sitting below the threshold where lighting mattered. It still stops short of fully opaque on purpose — organ severity, drawn opaque underneath, has to keep reading through it; §6.3/§7's "the shell cannot hide an organ" property is untouched. This also makes a *future* skin-level finding renderable at all, which a near-invisible outline structurally couldn't carry — no such finding is built yet, same as the tumor note in §2.2.
- **Practice Space is now two columns.** The oncologist's post-login screen (`spaces/home/PracticeSpace.tsx`) puts the patient list on the left and, on the right, the "Find a patient" search above a small Digital Twin preview (`features/body/DemoBodyPreview.tsx`, new). The search narrows the same list beside it rather than being a second, disconnected control. The preview is intentionally not real clinical data: it is built from an *empty* snapshot list through the same `useBodyViewModel`, so every organ resolves to a real, defined "no findings recorded" state rather than an invented one `[00 §5.8]` — it says as much in its caption. Stacks to a single column below the `lg` breakpoint, list first.

### 2.4 Completed since 2.3 — honest data, two-role sign-in, and real sculpted anatomy

The product owner raised the bar substantially in this round: no invented clinical data at all, separate patient and doctor entry points, a visible theme toggle, distinctive typography, and an anatomical model that "replicates a real human completely… not shapes joined together." They also asked to be able to stop supervising — bugs are to be found and fixed without another prompt. The full brief, in their own words, is preserved in `HANDOVER_FOR_CHATGPT.md` Part 2; it governs the work still outstanding.

**Every seeded patient is gone.** `mock-data.ts` no longer ships fabricated people. `synthesizePatient()` / `synthesizeOncologist()` build an identity from the email actually submitted at sign-in, and `mock-store.ts` now persists state to `localStorage` under `ao.mock-store.v1`. That persistence was a real architectural gap, not a nicety: without it the in-memory store reset on every reload and a signed-in patient's own record vanished underneath them. Empty states across Practice Space, Patient Home and Patient Space now say plainly that nothing is invented, and every unrecorded clinical field renders **"Not yet recorded"** rather than a blank cell or a value computed from zeros.

**Two separate sign-in paths.** `AuthSpace` is now role selection (*I'm a patient* / *I'm a doctor*) followed by credentials. The old "choose a fake patient record from a dropdown" affordance is gone entirely.

**Real sculpted anatomy is installed** — the single largest visual change in the project so far. Fourteen organs and the external body surface, extracted from **Z-Anatomy** (CC BY-SA 4.0), decimated from ≈991k to ≈42k triangles so they render in real time on a patient's own device. The pipeline is reproducible and committed as `tools/extract-organs.mjs` and `tools/extract-body.mjs`; no application code changed, because `model.ts`'s registration mechanism already did the coordinate fitting and name matching. Three defects were found and fixed by looking at rendered pixels rather than at code:

- Non-anatomical helper geometry bundled in the source export — hair strands, eyelashes, the viewer's cross-section planes — was being baked into the body surface.
- Needle-thin triangles at the seams between adjacent authored surface patches were catching the shell's fresnel rim light and reading as stray glowing lines radiating off the silhouette. They are now dropped by shape (area against longest edge), because anatomically real geometry is never that thin relative to its size.
- meshoptimizer shrinks the *index* list but leaves the source vertex buffer intact, so a 96%-reduced mesh was still shipping 100% of its vertices. Compacting recovered ~11 MB.

**Licensing is decided but not finished.** CC BY-SA 4.0 permits commercial use; it is also copyleft, and it requires attribution to be **visible to users**, which is not yet implemented. `ATTRIBUTIONS.md` at the repository root records the terms and the open question.

**Other fixes in this round:**
- **Zoom now travels toward the cursor** (`zoomToCursor` on the Body's OrbitControls). Dollying to a fixed centre meant examining a shoulder required zooming past it and panning back — the anatomy the user aimed at slid out of frame exactly as they approached it.
- A `NaN yrs` in the Patient Space header, and an empty stage chip, for a patient with nothing recorded yet.
- Two pre-existing `exhaustive-deps` errors that were failing `npm run verify` at the lint step: the Body's mount-only colour effect (folded into the first `useFrame` tick, where the material is actually guaranteed to exist and emissive stays in step), and the Intent Bar memoizing on an array literal rebuilt every render.
- **Verification is now visual.** `tools/shot.mjs` drives a real headless Chromium: it signs in, captures actual pixels, and reports console errors and layout overflow. The in-editor browser preview reports its tab as hidden, which suspends `requestAnimationFrame` and makes it unable to composite frames — this tool exists because of that limitation and is how everything above was confirmed.
- Bricolage Grotesque paired with Inter for display type; a visible light/dark toggle in the shell.
- Dead code removed: `spaces/entry/CancerStatement.tsx`, unreferenced since before this round.

### Never started, by instruction

Backend, AI, APIs, database logic, authentication logic. The frontend is prepared for all of them and implements none.

---

## 3. Running and verifying

```bash
cd frontend
npm install        # on Windows, natively — see the warning below
npm run dev        # http://localhost:5173
npm run verify     # typecheck + architecture + safety + lint
npm run verify:full  # the above, plus build and production-bundle check
```

### ⚠ Never run `npm install` inside a Linux sandbox against this folder

It has broken the working tree once. `node_modules` holds Windows-native binaries (`@tailwindcss/oxide-win32-x64-msvc`); a Linux install replaces them and `npm run dev` then fails with `Cannot find native binding`. Recovery is deleting `package-lock.json` and reinstalling natively on Windows.

### `.ts` files that will not open by double-click

`.ts` is also the extension for MPEG-2 Transport Stream, so Windows hands them to a media player. Open them from inside VS Code or Cursor.

---

## 4. Architecture

### Stack

React 19 · TypeScript 6 (strict) · Vite 8 · Tailwind v4 (CSS-first `@theme`) · Radix UI · TanStack Query · Zustand · react-router-dom v7 · three.js + @react-three/fiber + drei · zod · lucide-react · class-variance-authority

`exactOptionalPropertyTypes` is deliberately **off** — React and `@react-three` component types declare optional props without `| undefined`, which forced annotations everywhere without catching a single real defect here. Every other strict flag is on. Documented in `tsconfig.app.json`.

### Layering

```
spaces  →  features  →  components  →  lib
              ↘  data
```

Enforced by `tools/check-architecture.mjs`, which fails the build. Features may not import each other; shared behaviour goes to `components` or is coordinated by the shell.

### The spatial model — the organising idea

Four depth levels. This is not decoration; it drives routing, motion and the shell.

| Depth | Space | Route |
|---|---|---|
| 0 | Entry, authentication | `/`, `/enter` |
| 1 | Home Space / Practice Space, Account | `/home`, `/account` |
| 2 | Patient Space | `/patient/:id` |
| 3 | Focus | `/patient/:id/report/:id` etc. |

**Focus opens *above* a preserved parent** — nested routes and `<Outlet />`, never a route swap. The space behind stays mounted and visible `[04 §4]`.

### Vocabulary

Every surface pairs a spatial name with the clinical name. Both are shown; neither is self-evident alone.

| Spatial | Clinical |
|---|---|
| Entry | Landing |
| Home Space / Practice Space | Dashboard |
| Patient Space | Patient Profile |
| Body | Digital Twin |
| Journey | Timeline |
| Evidence | Reports |
| Understanding | Patient Intelligence |
| Actions | Tasks |
| Guidance | Notes |
| Signals | Notifications |
| Account | Settings |

### URL as state

Routes encode *place*. State that modifies a space **in situ** lives in query parameters, because moving through the Journey moves the whole space through time rather than navigating `[00 §15.5]`:

`?t=` clinical date · `?organ=` selected organ · `?compare=` comparison date

This matters when you touch scroll or transition behaviour — see `use-space-arrival.ts`.

### Data layer

Contract-first and backend-ready:

```
zod schemas (data/contract) → DataAdapter interface → mock-adapter | http-adapter
```

Every response is validated at the boundary. Swapping `mock-adapter` for an HTTP adapter is the entire backend integration on the frontend side.

---

## 5. Locked constraints

From the project owner, standing:

- `READ THIS/` is frozen. Do not modify.
- Do not redesign workflows. Do not add features. Do not remove features. Do not simplify the product.
- No placeholder implementations, no TODO comments, no incomplete components.
- **No UI component outside the Design System without a documented reason.** The Design System is the single source of truth for components.
- Frontend only. Prepare for backend integration; do not build backend.
- Features 1, 2 and 3 (initialization, design system, global layout) are frozen.
- If a decision affects product requirements, user workflow, the security model, or the Ground Rules — **stop and ask.** Otherwise make the best engineering decision and continue.

There is exactly one documented exception to the Design System rule: the **cinematic layer** (section 8).

---

## 6. Safety invariants

Each of these exists because of a real defect. They are enforced, not trusted.

### 6.1 Severity colours must be literal hex — never `var(--x)`

`SEVERITY_COLOR` in `lib/status.ts` is handed to `three.Color`. three.js **cannot parse CSS custom properties**: it emits a warning and silently yields white. Shipping that once made every diseased organ render white while the feature appeared to work perfectly.

The scale is necessarily duplicated in three places, because `three.Color` cannot read CSS without a build step:

```
design/tokens.css   CSS consumers
design/theme.ts     three.js materials
lib/status.ts       status mapping
```

`check-architecture.mjs` asserts all three agree, on every build. **Do not add a fourth copy.**

### 6.2 The severity scale is never themed

Fixed by documentation — lighter is lower severity, darker is higher `[00 §6.7]`. A theme that restyled it would mean the same finding rendering as two different colours depending on a display preference. The dark theme delineates the swatch with a themed *ring* instead. `check-architecture.mjs` fails the build if the dark theme redefines any severity token.

### 6.3 One view-model, two renderers

`use-body-view-model.ts` feeds both `BodyScene` (3D) and `BodyStructured` (accessible). They cannot drift, and a safety test asserts every organ reachable in one is reachable in the other `[00 §16.5]`.

### 6.4 Role isolation is checked at the transport boundary

A patient session must never receive private notes, Patient Intelligence, or oncologist-only timeline events `[09.5 §19]`. Tested against `mockStore.handle` directly, not against the UI.

### 6.5 Time resolution never interpolates

Selecting a date returns a real, validated snapshot — never an invented clinical state `[09.6 §18]`.

### 6.6 Plain language may not invent clinical claims

`severityMeaning()` describes **position on a documented scale and nothing more**. Not size, not spread, not outlook. Saying more would be the interface inventing a claim the data never made `[00 §5]` — and it would be most dangerous exactly where it would be most reassuring.

### 6.7 Every semantic token needs a dark value

A token defined for light but forgotten in dark inherits the light value silently: dark text on a dark surface, an invisible border, an unreadable status chip. `check-architecture.mjs` fails the build. Negative-tested.

### Running them

```bash
npm run test:safety     # 17 checks
```

---

## 7. The Body — the deepest subsystem

Files: `features/body/` — `figure.ts`, `anatomy.ts`, `model.ts`, `use-figure-geometry.ts`, `BodyScene.tsx`, `BodyStructured.tsx`, `BodyView.tsx`, `use-body-view-model.ts`

### Coordinate frame

A standing figure, **feet at y = -0.51, crown at y = 1.31**, facing +Z. 1.82 units tall, so one unit is one metre. Every landmark is a real fraction of stature. All 16 organ coordinates in `anatomy.ts` are **absolute** within this frame.

### Two sources of geometry

**1. Generated (`figure.ts`)** — always present, no asset required. Cross-sections defined at anatomical landmarks, splined with Catmull-Rom into a dense ring stack, skinned into one continuous surface. Three construction rules, each from a visible defect:

- **Never join primitives.** A sphere on a cylinder always looks like a sphere on a cylinder.
- **Bury every closing cap.** A loft closes with a flat disc. A cap wider than the mass it emerges from protrudes as a shoulder plate, or draws a hard horizontal line across the hips. Both were observed.
- **The trunk does not carry shoulder width.** The deltoid belongs to the arm loft. A torso widened to the acromion reads as armour.

Three forms — `male`, `female`, `neutral` — selected by `bodyFormFor()` from the sex on the patient's record. `Other` and missing both resolve to `neutral`; guessing is worse than being non-committal. All three share one vertical frame so a single organ coordinate set stays correct in each.

### Organs are lofted too, not primitives dressed up

The same rule that built the shell — never join primitives — applies to individual organs as of 4 August 2026. `features/body/organ-shapes.ts` holds a `Section[]` table per organ (liver, both lungs with a cardiac notch on the left, heart, both kidneys with the medial hilum concavity, stomach, spleen, pancreas, bladder, thyroid, brain) fed through `figure.ts`'s existing `spline()`/`superellipse()`/`loft()` — no new geometry engine, just new `buildOrganGeometry()`/`organLocalBounds()` exports on it. The colon stays a primitive (a squashed torus reads correctly as-is); lymph nodes and bones stay clusters of primitives.

Each organ has its own colour, from the new `organPalette` in `design/theme.ts` — every hue chosen outside the red band on purpose, so it can never be mistaken for the severity scale, which still overrides it whenever severity > 0 exactly as before.

**The organ set is sex-conditional, not just the body shell.** `uterus`, `left-ovary`, `right-ovary` exist only for the female form; `prostate` only for the male form; both breasts render for every form (scaled down, not removed, for male). `anatomy.ts`'s `selectableIdsFor(form)` is the one filter both `BodyScene` and `BodyStructured` read from — see §6.3 — so which organs exist for a given patient can't drift between the two views. `tools/safety-tests.ts` asserts this directly: the wrong-sex organ must never appear, for any form.

**The tumor is not built.** It is intentionally out of scope for the frontend: a real finding's shape will come from the backend, and the intended technique — many overlapping spherical blobs merged closely enough to read as one uneven mass — is documented, not implemented, in `features/body/README.md`.

**2. A sculpted atlas (`model.ts`)** — used automatically when installed. **Installed, 6 August 2026: Z-Anatomy, CC BY-SA 4.0.** See §2.4 and `ATTRIBUTIONS.md`. The generated geometry above remains the per-organ fallback and is still load-bearing.

### Installing an atlas

Drop into `frontend/public/models/`:

```
body-male.glb  body-female.glb  body-neutral.glb   organs.glb
```

Organ meshes must be named for their organ id (`liver`, `left-lung`, `right-kidney`…). Matching is forgiving about case, spaces, underscores, trailing numbers and `.001` suffixes.

**The one thing you must get right:** `body-*.glb` and `organs.glb` must be exported from **the same source atlas in the same coordinate space**. The loader fits the *body* into the figure frame, then applies that exact transform to the organs. Different sources and the organs will be *plausibly* wrong — nothing on screen will look broken. That is far worse than an obvious failure and the tests cannot catch it for you.

Requirements, licensing options and the full rationale are in `frontend/public/models/README.md`.

**Licence before shipping.** The model displays inside a clinical product; that is commercial use. Most anatomy models on Sketchfab and TurboSquid are personal-use only. **BodyParts3D** (CC-BY-SA) and **Z-Anatomy** (CC-BY-SA) both permit commercial use with attribution. Record the choice in `ATTRIBUTIONS.md`.

### Fallbacks are per organ

A missing atlas leaves the generated figure. A *partial* atlas gives sculpted meshes for what it has and primitives for the rest, so coverage can grow incrementally `[08 §11]`.

### Presentation

Rim-lit form in a dark volume, not flesh. Two reasons, the second clinical:

1. A photoreal body invites the reading that this **is** the patient's body. It is not — it represents body structure `[09.6 §5]` and is explicitly not a physical replica `[00 §6.4]`.
2. The severity scale is red. Red on flesh tones has small hue separation and the eye discounts it; against a dark blue volume every step separates cleanly.

The shell renders `DoubleSide` with `depthWrite: false` at low opacity, so organs draw first as opaque and the shell blends over them. **The shell cannot hide an organ** — that is the property being bought.

---

## 8. Two visual vocabularies

The frozen docs ask for two incompatible things:

- `[04 §14]` — the Entry must be "a cinematic introduction to the system, not a traditional landing page", memorable, premium.
- `[04 §28]` — inside the application, "usability is never sacrificed for visual effect" and "every space should be understandable without training".

One system tuned for both is a compromise at each end. So there are two, and the boundary is enforced.

**The cinematic layer** lives in `components/cinematic/` — `Grain`, `LightField`, `Hairline`, `Rise`, `Settle`, `Marquee`, `CinematicAction`, `CinematicJump`, `EdgeLabel`, `Ordinal`. Its own `--cinema-*` tokens and a longer motion envelope (to 1700ms, versus the application's 380ms ceiling).

`check-architecture.mjs` **fails the build** if anything outside `src/spaces/entry` imports it. The one exception is `src/dev/showcase`, which documents the design system and is stripped from production. Negative-tested.

### The Entry's key move

The point field renders **above** the CANCER wordmark in `mix-blend-mode: screen`, so the word sits *inside* the figure rather than in front of a backdrop. Screen blending can only add light, so it is arithmetically incapable of reducing text contrast: the depth is real and costs nothing in legibility. Depth layering — not animation volume — is what makes the reference compositions read as expensive.

---

## 9. Motion and travel

### The envelope

| Token | Duration | Use |
|---|---|---|
| `--motion-quick` | 180ms | hover, control state |
| `--motion-reveal` | 260ms | content revealing, Signals arriving |
| `--motion-spatial` | 380ms | depth change, Focus open and close |

Motion carries exactly one of four meanings `[04 §6]`: depth, time, clinical, process. Nothing animates for decoration inside the application.

**Reduced motion is honoured at the token level** — every duration resolves to 0ms and every consumer inherits it without opting in. Presentation changes; information and functionality do not `[00 §11.9]`.

### Spatial travel

Both spaces animate at once. The space being left is held mounted and played out while the arriving one plays in, overlapping in the same frame. Animating only the arrival leaves an empty frame between spaces — and an empty frame is a page change however carefully it is eased.

Blur carries the depth. Scale alone reads as an effect applied to a page; scale plus focus reads as moving through space, because that is what a lens does.

```
deeper      old space rushes past, new one grows into place
shallower   old falls away, new settles back from beyond
lateral     peers slide past each other, no depth change
```

Applied at **two levels**. The outermost carries Entry ↔ authentication ↔ environment, keyed by *region* rather than address — keying on the address would replay it on every move inside the environment and the persistent shell would blink. Space-to-space travel is the shell's own transition, one level in.

### Continuous Return

One gesture always moves exactly one depth level out `[04 §5]`. Bound to Escape, and now also a visible control in the shell whenever there is somewhere to ascend to — a keyboard shortcut nobody can see is not a way back for a patient on a tablet. It ignores Escape while the user is typing, so it can never discard unsaved work.

### Restrained motion, applied throughout — not just travel

As of 4 August 2026 the same envelope above is also used for smaller, real-time motion across the application, at the product owner's request — a level comparable to Vercel or Apple, deliberately short of a decorative marketing site, since the primary audience is non-technical. This is a second, smaller layer than spatial travel, built from the same tokens:

- `components/motion/reveal.tsx` mounts content in its from-state and flips to its to-state one frame later — a CSS transition has nothing to animate if content is already at its destination on mount. Used for staggered list/card reveals (`PatientOverview`, `SignalsView`, Intent Bar results) and for the Body's canvas fade-in.
- `components/primitives/surface.tsx`'s opt-in `interactive`/`tilt` variant gives a cursor-reactive tilt, off entirely under reduced motion or a touch pointer.
- `components/patterns/tab-rail.tsx` is a reusable sliding-underline tab control (`AccountSpace`, `PatientSpace`'s Contextual Orbit).
- The Intent Bar (⌘K) has a real entrance/exit — scale, translate and scrim fade — rather than a one-shot keyframe that only ever played once. See §2.2 for the verification note: this specific remote-browser tool reports its tab as `hidden`, which suspends `requestAnimationFrame` and made the entrance transition unobservable here, though the exit path (which unmounts on a `setTimeout`, not rAF) was confirmed working.
- All of it collapses under `prefers-reduced-motion` at the same token level as spatial travel — nothing here has its own opt-out to forget.

---

## 10. Backend integration — what the backend team needs to provide

The frontend is contract-first. Every shape the backend must return is already declared in `data/contract/domain.ts` as a zod schema, and every response is validated at the boundary.

To integrate:

1. Implement the `DataAdapter` interface (`data/adapters/adapter.ts`) against real endpoints.
2. Swap `mock-adapter` for it in `data/adapters/index.ts`.

Nothing else in the frontend changes.

**Enforced on the server, not here.** The role guard in `EnvironmentShell` is a second lock and a navigation convenience — never the only protection `[02 §7]`. Authorization, and the filtering of private notes and Patient Intelligence out of patient sessions, must be enforced server-side. The safety suite checks the frontend's mock honours it; that is a test of the contract, not a substitute for it.

**Every AI output must carry evidence and confidence** `[00 §5.9]`, `[00 §5.10]`. The UI renders confidence beside every derived statement and refuses to hide it behind an interaction. Summaries without a confidence value will fail schema validation.

---

## 11. Traps

Things that have already cost time, or will.

**Verification in a Linux sandbox is slow and misleading.** `tsc` against the mounted folder does not finish inside a normal timeout. The workaround is copying `src`, `tools`, the tsconfigs and the needed `node_modules` packages to local disk — **in small batches**, because a batch loop that times out leaves packages silently truncated. A truncated `zod` makes every inferred type `any` (a wave of TS7006); a truncated `@react-three/drei` makes `OrbitControls` "not exported". Before believing any error, confirm the package copied completely. The reliable check is `git archive` of the last known-good commit into a parallel directory and diffing the two error sets.

**oxlint only ships a Windows binary here.** Lint cannot run in a Linux sandbox. Audit by hand against `.oxlintrc.json` if you cannot run it.

**Dead lint config fails silently and loudly.** An override referencing `import/no-restricted-paths` — a rule oxlint does not have — caused config loading to fail outright, so lint never ran at all while appearing configured. Layer boundaries are enforced by `check-architecture.mjs`, which is stricter.

**zustand v5 and SSR.** `getInitialState` is React's server snapshot, so `setState` is ignored under `renderToString`. The safety suite uses an aliased auth-store test double for this reason.

**`@axe-core/react` does not support React 18+ — its own README says so.** Do not wire it in; `jest-axe` runs the same `axe-core` engine directly against rendered DOM and works with any React version. Already swapped in; see BLUEPRINT `05 §9`.

**Module augmentation of an already-typed package silently replaces it instead of merging, in a `.d.ts` file with no top-level `import`/`export`.** `declare module 'vitest' { interface Assertion... }` inside a script-mode `.d.ts` file discards vitest's real types outright (`describe`/`it`/`expect` all vanish) rather than extending them. Fix: give that file its own `export {}` — or, simpler, keep ambient module declarations for untyped packages (which want script mode) and augmentations of typed packages (which want module mode) in separate files, as `src/test/jest-axe.d.ts` and `src/test/vitest-axe-matchers.d.ts` now do.

---

## 12. Decisions on record

| # | Decision | Rationale |
|---|---|---|
| D1 | Clean rebuild rather than refactor | The original app was a flat-sidebar dashboard; the rewritten docs describe a spatial model that could not be reached incrementally |
| D2 | Custom stylized anatomy, not a purchased model | Later revisited — see D5 |
| D3 | Motion library | Superseded by CSS keyframes + View Transitions API |
| D4 | Modern evergreen browsers + WebGL2 | Every space remains usable with WebGL absent |
| D5 | Load a sculpted atlas when installed, generate otherwise | Procedural geometry has a ceiling a sculpt clears; the fallback keeps the Body from ever being absent |
| D6 | Two visual vocabularies, hard boundary | The frozen docs require both a cinematic Entry and a restrained application |
| D7 | Dark as the default theme | The Entry and the Body are both lit volumes in darkness; a bright application between them reads as a different product. Light and System remain available `[09.10 §8]` |
| D8 | Male / female / neutral body forms | The sites that matter clinically sit differently, and a figure that does not match the person is a constant small signal the record is not theirs |
| D9 | Organs reuse the body-shell's lofting engine rather than a second geometry system | Realistic organ silhouettes and a watertight body shell are the same problem — a stack of splined cross-sections — solved once |
| D10 | Reproductive organs are sex-conditional; breast tissue is not | Prostate/uterus/ovaries only exist for the sex that has them; breast tissue stays present for every form, scaled down rather than removed for male, since male breast cancer is rare but clinically real |
| D11 | READ THIS/ frozen-doc set cut from nineteen files to two | Feature/flow detail changes; only the Ground Rules and the overall architecture reference are meant to be permanent — see §1 |

---

## 13. Where to pick up

In rough order of value:

1. **The premium visual rebuild.** This is now the main body of outstanding work and the owner's stated priority: Entry as a genuine cinematic hero, sign-in that feels like entering a system rather than submitting a form, dashboards designed to the stated bar, a Digital Twin that breathes and responds, per-screen atmosphere, and a systematic microinteraction pass over every control state. Read `HANDOVER_FOR_CHATGPT.md` Part 2 first — it carries the brief verbatim, including the constraint that overrides all of it: *if forced to choose between beauty and usability, choose usability.*
2. **Source a female body and organ set.** The installed atlas is male-only, so half of real patients currently fall back to the generated figure. Needs a properly-licensed source, registered in the same coordinate space.
3. **Make the licence attribution visible in-app**, in the Account space. This is a condition of CC BY-SA 4.0, not a nicety. `ATTRIBUTIONS.md`.
4. **Audit on real hardware.** The DOM/browser-level responsive and accessibility pass is done (2.1); actual devices — a tablet in particular, `[04 §24]` — have not been touched. Note that `tools/shot.mjs` now gives real rendered pixels at any viewport, which covers much of what was previously unverifiable.
5. **Add Playwright test coverage** for the integration/E2E layer named in BLUEPRINT `05 §9` (A8). Playwright is already a dev dependency of the screenshot tool; nothing exercises full documented workflows end to end yet.
6. **Backend integration** when endpoints exist. Section 10.

---

## 14. Commit history

```
a17daa0  feat(home,body): darker theme, real skin surface, two-column Practice Space
9076460  feat(motion): real-time depth and motion throughout the application
160b6a0  feat(body): real organ silhouettes, per-organ color, sex-specific organs
06c42e3  docs: cut READ THIS down to Ground Rules and the TRD
27f4e14  chore: add dev server launch config for browser preview
7cdff66  docs: update handover for completed work
65ec0c4  test(frontend): add Vitest, Testing Library and jest-axe; remove unused motion
a81d873  feat(evidence): finish report comparison and document preview
20145c8  docs: add frontend handover
3a05b81  feat(shell): continuous spatial travel and one theme throughout
a1f1ca6  feat(theme): add dark theme as the default appearance
8d6e31f  feat(body): load sculpted anatomy from a model atlas
6fdad7e  feat(body): open pose, glass shell and surface relief
dd36b85  feat(body): a real lofted human figure, with male and female forms
8ac4e3a  fix(frontend): remove dead oxlint override that broke the lint step
2681ab1  feat(frontend): cinematic Entry composition and plain-language clinical spaces
a390094  feat(frontend): cinematic Entry scene and anatomically credible human figure
1984e98  feat(frontend): Intent Bar, task composer and patient-safety test suite
32d0429  feat(frontend): Digital Twin, Patient Space, Home Spaces, Signals and Account
6df0012  feat(frontend): Feature 3 global layout, dev showcase, data layer, Entry and Auth
f420e2a  feat(frontend): complete Feature 2 - Design System
73a0738  feat(frontend): complete Feature 1 - Project Initialization
30872b0  docs: add frontend engineering blueprint
31e591f  docs: rewrite project documentation for spatial experience model
```

Commit messages carry the reasoning for each change, including the defects that motivated the safety invariants. They are worth reading before changing the Body or the token system.
