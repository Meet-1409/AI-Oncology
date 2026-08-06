# 02 — Motion, Transition, Camera and 3D

**Covers blueprint topics 5, 6, 12, 13, 14, 15.**

---

## 1. Motion design philosophy (topics 5, 12)

### 1.1 Position

Motion is a **primary interface element** `[00 §11.1]`, not decoration. Its job is to make the environment legible: where the user is, where they came from, what changed. If an animation does not do one of those, it is removed.

### 1.2 The four meanings

Every animation in the product must carry exactly one meaning. This is the governing constraint — it prevents motion from accumulating into noise.

| Meaning | Communicates | Expression |
|---|---|---|
| **Depth** | entering or leaving a space | zoom + shared element continuity |
| **Time** | movement along the Journey | continuous interpolation of the whole space |
| **Clinical change** | something in the patient's state differs | attention-directing reveal on the changed element |
| **Process** | the system is working | sustained, non-blocking indication |

An animation that fits none of these is decoration and is prohibited `[00 §11.2]`.

### 1.3 Motion tokens

Motion is tokenized exactly like colour. Components never hard-code durations.

| Token | Duration | Use |
|---|---|---|
| `motion.instant` | 0ms | reduced-motion resolution of everything below |
| `motion.quick` | 180ms | local feedback, hover, control state |
| `motion.reveal` | 260ms | content revealing on approach, Signals arriving |
| `motion.spatial` | 380ms | depth change, Focus open/close |
| `motion.scrub` | continuous | Journey time; driven by input, not a fixed duration |

All within the documented 180–420ms envelope `[04 §6]`.

**Easing.** A single decelerating curve for entering, a matching accelerating curve for leaving. No bounce, no elastic, no overshoot `[04 §6]` — those read as playful, and the product must never feel game-like `[00 §10.17]`.

### 1.4 Reduced motion

`prefers-reduced-motion` is honoured at the **provider level**: motion tokens resolve to `instant`, spatial transitions become cross-fades, and the Journey applies time changes discretely rather than interpolating `[09.5 §16]`. Camera easing is disabled; camera *control* remains `[09.6 §16]`.

Critically: **no information and no functionality is lost** `[00 §11.9]`. Reduced motion is a different presentation of the same environment, never a reduced feature set. Every state reachable with motion is reachable without it.

### 1.5 Performance rule

Animate only compositor-friendly properties — `transform`, `opacity`, and filters where unavoidable. Never animate layout-affecting properties in a continuous transition. This is what makes the 60fps target `[00 §13.5]` achievable rather than aspirational.

---

## 2. Transition philosophy (topic 13)

### 2.1 The core contract

> The element selected transforms into the space entered. `[04 §6]`

This is shared-element (FLIP) continuity and it is the reason a motion library was chosen (doc 00, D3). Every entering transition must nominate a shared element:

| Transition | Shared element |
|---|---|
| Practice Space → Patient Space | the patient's presence becomes the patient identity in Patient Space |
| Patient Space → Report Focus | the report's row becomes the Focus header |
| Journey event → Event Focus | the event marker becomes the Focus header |
| Organ selected → organ detail | the organ's position anchors the revealed information |
| Home → Account | identity element becomes the account header |

If no honest shared element exists, the transition is a depth-consistent fade — never an arbitrary slide.

### 2.2 Direction encodes depth

Entering zooms in and the parent recedes (scales slightly down, dims, stays visible). Leaving reverses exactly. Because the parent is never unmounted, returning is instantaneous and preserves scroll and selection `[04 §4]`.

### 2.3 Lateral movement

Patient-to-patient is lateral, not deeper `[09.3 §5]`: no zoom, a directional cross-dissolve, identity morphing between the two patients. The Body persists (doc §5.4) — it is the same instrument showing a different subject.

### 2.4 Interruptibility

All transitions are interruptible and reversible mid-flight. A user who changes their mind must never wait for an animation `[00 §11.8]`. Transitions are therefore driven by spring/velocity-aware animation, not fixed timelines that must complete.

---

## 3. Camera movement philosophy (topic 14)

Applies to the literal 3D camera in the Body, and to the metaphorical camera of spatial transitions — they obey one language so the environment feels coherent.

### 3.1 Rules

1. **The camera never teleports.** Every change of viewpoint is a continuous move; discontinuity destroys spatial understanding.
2. **The camera is damped.** Inertial, settling, confident. Never springy `[04 §6]`.
3. **Camera movement never changes medical information** `[00 §6.12]`. Camera state is strictly separate from clinical state — a hard architectural boundary (§5.2), not a convention.
4. **The camera has opinions, the user has control.** Selecting an organ may frame that organ, but the user can always override, and manual control is never wrested away mid-gesture.
5. **Reset is always one action** `[09.6 §8]`, and returns to a known, documented default framing.
6. **Constrained orbit.** Polar angle is clamped so the anatomy is never viewed from a disorienting angle; zoom is clamped so the model cannot be lost.

### 3.2 Framing on organ selection

Selecting an organ eases the camera to a framing that keeps the whole body silhouette partially visible. Losing the body context would break the anatomical relationship that justifies 3D in the first place `[09.6 §5]`.

---

## 4. 3D interaction philosophy (topic 6)

### 4.1 When 3D is permitted

3D must be meaningful; decorative 3D is prohibited `[00 §12.5]`. The test: **does spatial understanding aid clinical understanding here?**

| Surface | 3D? | Reason |
|---|---|---|
| Body / Digital Twin | Full 3D | Anatomical location, severity and progression are inherently spatial `[00 §12.3]` |
| Entry focal element | Light 3D | Communicates product identity `[04 §14]` |
| Everything else | Depth, not 3D | Layering, shadow, parallax, perspective `[04 §7]` |

The last row is the important one. "The application should feel physically layered rather than visually flat" `[00 §12.4]` is satisfied by *depth* — Focus layers above preserved parents, parallax on approach, considered elevation — not by rendering ordinary UI in a 3D scene, which would harm legibility `[00 §12.7]`.

### 4.2 Capability tiering

Detected once at startup, re-evaluated if sustained frame rate drops:

| Tier | Condition | Behaviour |
|---|---|---|
| Full | WebGL2, healthy frame budget | Full anatomy, soft shadows, full material quality |
| Reduced | WebGL2, constrained device | Simplified lighting, no shadows, lower geometry detail, capped DPR |
| None | No WebGL, or user preference | Non-3D equivalent (§6) |

Degradation reduces *visual complexity only*. Clinical meaning is never reduced `[00 §13.6]`.

---

## 5. Digital Twin interaction design (topic 15)

The centrepiece `[00 §6.15]` and a primary navigation space.

### 5.1 Composition

The Body sits at the centre of Patient Space and is present on arrival — it does not need to be opened `[09.3 §14]`. Around it: persistent patient identity, the Journey as a time control, evidence revealed in place on selection, comparison controls only when comparison is active `[09.6 §4]`. Chrome recedes; anatomy leads `[09.6 §4]`.

### 5.2 State separation (critical)

Three independent state groups, deliberately isolated:

```
CLINICAL STATE     organ severities, evidence, assessment   ← from backend/AI only
VIEW STATE         selected organ, comparison, time position ← user navigation
CAMERA STATE       position, target, zoom                    ← user manipulation
```

Camera state can never write to clinical state. This is the architectural enforcement of `[00 §6.12]`. It also means the Body "never generates medical information independently" `[09.6 §14]` is structurally guaranteed, not merely intended.

### 5.3 Organ interaction

Selecting an organ is a **navigation action** `[09.6 §9]` — it reveals, in place, the organ's clinical information, supporting evidence, related Journey events and related Understanding. It never requires leaving the Body.

- Hit-testing via raycasting against organ meshes; every organ also reachable from a keyboard-navigable list `[09.6 §22]`.
- Selection is reflected in the URL (`?organ=`) so a clinical view is shareable and restorable.
- Evidence for the selected organ arrives with the twin payload `[05 §9]` — no additional request, no spinner on selection.

### 5.4 Time and continuity

- Moving through the Journey updates the Body **continuously**, interpolating severity colour between clinical dates rather than switching instantly `[09.6 §16]`.
- All clinical dates are fetched together `[02 §11]`, so scrubbing never awaits the network.
- Interpolation is **visual only** — the underlying data remains the discrete validated states. Intermediate frames must never be readable as clinical fact; date and severity labels always show the nearest validated state, never an interpolated value. This is the frontend's obligation under "must never display unsupported findings" `[09.6 §18]`.
- Switching patients keeps the WebGL context and scene graph alive, swapping only the organ state — which is how "switching between patients should feel smooth" `[09.6 §21]` is met.

### 5.5 Severity encoding

Five-step red scale, light → dark `[00 §6.7]`. Always accompanied by a text label `[09.6 §7]` — colour is never the sole encoding `[00 §16.2]`. Healthy organs remain visually distinguishable, never merely absent.

### 5.6 Comparison

Two clinical states presented together `[09.6 §11]`. Both viewports share one camera, so rotating one rotates both — otherwise the comparison is not honest. Entering and leaving comparison is a smooth spatial transition, not an abrupt layout change `[09.6 §11]`.

### 5.7 Anatomy authoring (D2)

Custom stylized low-poly meshes, authored for this product. Organ definitions are declarative records (id, mesh, anatomical position, label, clinical mapping) so anatomy coverage grows by adding data, not code (doc 00 §5).

**Requirements:** every organ individually selectable and independently shadeable; meshes small enough to load progressively `[09.6 §21]`; anatomically *plausible* and correctly located, without implying more precision than the data supports `[00 §6.4]`.

### 5.8 Failure

A rendering failure falls back to the non-3D equivalent rather than failing the space `[09.6 §20]`. The Body is wrapped in an error boundary that swaps renderers; the surrounding Patient Space is unaffected `[02 §13]`.

---

## 6. The non-3D equivalent

Not a degraded fallback — a **first-class equivalent** `[00 §12.6]`, and the primary experience for screen-reader and no-WebGL users.

Architecturally, the Body feature exposes **one view-model with two renderers**:

```
useBodyViewModel()  →  { organs[], severities, evidence, assessment,
                         timePosition, selection, comparison }
        ├── SceneRenderer     (R3F)
        └── StructuredRenderer (semantic HTML)
```

Because both consume the same view-model, they cannot drift. Every organ, severity, label and piece of evidence available in 3D is present in the structured renderer, with identical selection behaviour and identical URL state. Selection, time and comparison all work identically.

This design is what makes "screen reader users must be able to reach every piece of information available to sighted users" `[00 §16.5]` achievable without maintaining two parallel implementations.

---

## 7. Why motion kept "not working"

**Added 6 August 2026.** Three separate surfaces were reported as having no animation. All three had animation code. All three had the same root cause in different clothing:

> **A CSS transition cannot animate a mount.** An element rendered directly into its final state on its first paint has nothing to transition *from*.

- `Reveal` already solved this by mounting one frame short of its target and catching up (see its own comment). Correct.
- **Tab panels did not.** `<Reveal key={tab}>` replays an *entrance*, but by the time React re-renders the outgoing panel is already gone — so a tab change was a hard cut with a fade tacked on the end. Fixed by `components/motion/swap.tsx`, which holds the outgoing content for one short exit beat before bringing the new content in.
- **Focus layers and dialogs did not, in both directions.** Radix unmounts a closed dialog immediately *unless it detects a running CSS animation* — it waits on `animationend`, not `transitionend`. Keyed off transitions, the open had nothing to animate from and the close was never given time to play. Fixed with real `@keyframes` (`.ao-scrim` / `.ao-panel` in `index.css`).

**Rule for anything that mounts or unmounts: use `@keyframes`, not `transition`.** Transitions are correct only for state changes on an element that is already on screen (hover, focus, a value updating).

### 7.1 Why `Swap` is sequential, not a cross-fade

Overlapping two panels requires absolute positioning, which collapses the container height and makes the page jump. Sequential is also the honest reading — the content *replaced* the previous content, it did not blend into it. And clinical panels must never appear momentarily superimposed: two sets of values on screen at once, however briefly, is a misread risk no amount of polish is worth.

### 7.2 The Entry's point field is a custom shader, not `pointsMaterial`

`pointsMaterial` cannot react to anything. The field now uses a `ShaderMaterial` that takes the cursor in the figure's own local space and pushes each point away from it with a smooth radial falloff, so moving the mouse parts the cloud and it closes again behind. Displacement is per-vertex on the GPU — doing it in JavaScript would mean touching 24,000 positions per frame on the main thread, which is the difference between physical and stuttering.

The cursor is raycast onto the figure's plane and then converted into the *rotating group's* local space. Skipping that conversion makes the parting slide across the body as it turns, instead of staying under the pointer.

## 8. Dependencies deliberately not added

Framer Motion, GSAP/ScrollTrigger and Lenis were all considered and declined for now. The work they were proposed for — tab swaps, modal open/close, route transitions, cursor reactivity — is done above in CSS keyframes and one shader, at zero bundle cost, and this is a clinical product where every kilobyte is downloaded on hospital wifi by someone who needs a result.

They remain the right call the moment the requirement is genuinely beyond CSS — scroll-linked camera choreography through a 3D scene is the honest example. Revisit then, not before.

---

## 9. The Body is fill-bound (measured, 6 August 2026)

Do not optimise this scene by reducing triangles. It was measured, not guessed:

| Scene | Canvas | fps |
|---|---|---|
| Any page with no WebGL | — | **60** |
| Auth / Practice (sculpted body) | 662×900 | **4** |
| The *same* scene, same triangle count | 300×150 | **61** |

Twenty times fewer pixels, identical geometry, fifteen times the frame rate. The cost is **fragments**, not vertices: a large double-sided *transparent* shell with `depthWrite: false`, blended over fourteen organs, means every pixel of the body's silhouette is shaded several times over.

The levers that work, in order:

1. **Resolution.** `dpr` is capped at 1 device pixel. A 2× display would quadruple fragment work for a translucent anatomical diagram that gains almost nothing from the density.
2. **Sample count.** `antialias: false`. MSAA multiplies fragment cost by its sample count — precisely the resource this scene has least of — and the fresnel rim already keeps the silhouette smooth.
3. **Pass count.** The shell used to draw *twice* (a lit skin pass, then the fresnel rim as a second full-mesh mesh), both double-sided and transparent — four full passes of fragment work over the silhouette. The rim is now a term inside the skin material's own fragment stage. One draw, identical output.

Levers that do **not** work here: decimating the mesh further, reducing organ count, `frameloop="demand"` (the body breathes, so it always has a reason to render).

### 9.1 Headless numbers are not device numbers

The figures above come from headless Chromium, which uses **SwiftShader** — a pure-CPU rasteriser with no GPU at all. It is a useful *relative* instrument (the 300×150 vs 662×900 comparison above is what identified the bottleneck) and a worthless *absolute* one. Even entry-level integrated graphics has orders of magnitude more fill rate than a CPU rasteriser. Do not conclude the product is slow on real hardware from a low number here, and do not tune against it past the point where the relative comparison stops changing.

The three fixes above are worth keeping regardless — they are free.
