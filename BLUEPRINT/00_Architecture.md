# 00 — Frontend Architecture

**Covers blueprint topics 1, 2, 31, 32.**

Citation format: `[00 §10.1]` = document `00_Ground_Rules`, section 10.1. All citations refer to files in `READ THIS/`.

---

## 0. Decisions confirmed with the Product Owner

These four were not derivable from the documentation and were confirmed before this blueprint was written:

| # | Decision | Consequence |
|---|---|---|
| D1 | **Clean rebuild.** New `src/` built to the spatial model; salvage only types, mock data, format/status utilities and low-level Radix wrappers. | The existing dashboard shell, layouts, pages and routing are discarded. |
| D2 | **Custom stylized low-poly anatomy.** Purpose-built simplified organ meshes. | No licensing exposure, predictable bundle, full control of severity shading and organ picking. |
| D3 | **Dedicated motion library** (Motion, formerly Framer Motion). | Shared-element continuity is FLIP-based layout animation; hand-rolling it is the largest avoidable risk in this project. |
| D4 | **Modern evergreen browsers, WebGL2 assumed.** | 3D is the primary path. The non-3D equivalent is required and fully functional, but is not the common case. |

Anything below marked **[ASSUMPTION]** is an engineering judgement I made rather than a documented requirement. Each is flagged for review.

---

## 1. Overall architecture

### 1.1 Shape

A **single-page client application** with a persistent runtime, layered as:

```
┌─────────────────────────────────────────────────────────┐
│  Shell            depth manager · motion orchestration   │
│                   Intent Bar · Signals · session         │
├─────────────────────────────────────────────────────────┤
│  Spaces           Entry · Home · Patient · Focus         │
│                   (one module per space, not per page)   │
├─────────────────────────────────────────────────────────┤
│  Features         Body · Journey · Evidence ·            │
│                   Understanding · Actions · Guidance     │
├─────────────────────────────────────────────────────────┤
│  Components       composed UI · primitives · motion      │
│                   primitives · 3D primitives             │
├─────────────────────────────────────────────────────────┤
│  Data             query layer · API contract · adapters  │
├─────────────────────────────────────────────────────────┤
│  Platform         router · theme · capability detection  │
└─────────────────────────────────────────────────────────┘
```

Dependencies point **downward only**. A feature may use components and data; a component may never import a feature; nothing below Spaces may know what depth it is rendered at.

### 1.2 Confirmed stack

| Concern | Choice | Basis |
|---|---|---|
| Framework | React 19 + TypeScript | Already established in repo; component model matches the reusability requirement `[02 §18]` |
| Build | Vite 8 | Already established; native code-splitting supports the loading strategy `[02 §12]` |
| Routing | React Router v7 | Depth must be addressable; see §3.3 |
| Motion | Motion (Framer Motion) | D3; shared-element continuity `[04 §6]` |
| 3D | three.js + React Three Fiber + drei | Declarative 3D that composes with React state, required because the Body is a *navigation space* `[00 §6.15]`, not an isolated widget |
| Styling | Tailwind v4 (CSS-first `@theme`) | Token-driven consistency `[04 §27]` |
| Headless UI | Radix primitives | Accessibility and keyboard behaviour for free `[00 §16]` |
| Server state | TanStack Query | Caching enables "entering a previously visited space should not require a full reload" `[02 §12]` |
| Client state | Zustand | Small, non-reactive-overhead store for session and ephemeral UI state |
| Forms | react-hook-form + zod | Validation messages that explain how to fix the issue `[04 §12]` |

### 1.3 Why a single-page application

This is the single most consequential architectural choice, and it is forced by the documentation rather than chosen for preference.

The docs require that the environment is **never rebuilt from scratch during navigation** `[02 §2]`, that navigation feels **continuous** `[00 §10.1]`, that **sudden page changes are avoided** `[00 §11.7]`, and that an element **transforms into the space it becomes** `[04 §6]`.

A document-navigation architecture (MPA, or SSR with full navigations) tears down and recreates the DOM on every navigation. Under that model, shared-element continuity is impossible, WebGL context is destroyed and re-initialised on every patient change — violating "switching between patients should feel smooth" `[09.6 §21]` — and in-place Focus layers cannot exist above a preserved parent space `[04 §4]`.

**Tradeoff accepted:** no server-side rendering means no SEO for the Entry and a larger initial JavaScript payload. This is acceptable because every space except the Entry is behind authentication `[03 §3]` and therefore not indexable anyway, and the Entry's cost is mitigated by route-level code splitting (§4.2). If marketing SEO later becomes a requirement, the Entry can be pre-rendered independently without disturbing the authenticated environment.

---

## 2. Why this architecture suits this project

Each requirement, and the architectural mechanism that satisfies it:

| Requirement | Mechanism |
|---|---|
| Continuous environment, no rebuild `[00 §10.1]`, `[02 §2]` | Persistent SPA runtime; TanStack Query cache survives navigation |
| Four depth levels, parent stays visible `[04 §4]` | Depth manager in Shell renders a stack, not a swap |
| Element transforms into the space `[04 §6]` | Motion shared layout IDs, coordinated by the Shell |
| Body is a navigation space `[00 §6.15]` | R3F scene lives in the Patient Space module, holds selection state, and emits navigation intents |
| Everything reachable in ≤3 interactions `[00 §10.7]` | Depth capped at 4; Intent Bar is a constant-time jump from anywhere |
| Never remember where features are `[00 §10.6]` | Contextual Orbit is derived from current context, not a fixed menu |
| Frontend contains no business logic `[02 §2]` | Data layer returns server-shaped models; components render, they do not decide |
| 60fps `[00 §13.5]` | Motion on compositor-friendly properties; 3D tiering; render isolation |
| Non-3D equivalent `[00 §12.6]` | Body feature exposes two renderers over one view-model (§ doc 02) |
| Reduced motion, no loss of information `[00 §11.9]` | Motion tokens resolve to zero-duration variants at the provider level |
| Modular, replaceable `[02 §17]` | Layer boundaries; features never import each other directly |

---

## 3. Structural decisions

### 3.1 Space modules, not page components

A *page* owns a screen. A *space* owns a region of the environment that can be entered, layered over, and returned to with its state intact. Space modules therefore expose: a view-model hook, a renderer, an enter/exit motion contract, and a data prefetch descriptor. This is what allows a parent space to remain mounted and visible beneath a Focus layer `[04 §4]`.

### 3.2 Depth is state, not a route side-effect

The Shell holds an explicit depth stack. The router reflects it; it does not own it. This inversion matters because Focus opens *above* a space without replacing it `[04 §4]` — behaviour a conventional route swap cannot express.

### 3.3 URL scheme

Depth and context must always be identifiable `[03 §23]`, and browser back must behave predictably.

```
/                                    Depth 0  Entry
/enter                               Depth 0  Authentication
/home                                Depth 1  Home Space (role-resolved)
/account                             Depth 1  Account (lateral, not nested — see doc 01 §7)
/patient/:patientId                  Depth 2  Patient Space (Body at centre)
/patient/:patientId?t=<iso-date>     Depth 2  Journey position — the whole space is at this time
/patient/:patientId?organ=<organId>  Depth 2  Organ selected on the Body
/patient/:patientId?compare=<iso>    Depth 2  Comparison mode active
/patient/:patientId/report/:reportId Depth 3  Focus over Patient Space
/patient/:patientId/event/:eventId   Depth 3  Focus over Patient Space
```

Time, organ and comparison are **query parameters, not routes**, because they modify the state of a space rather than entering a new one — moving through the Journey moves the entire space through time `[00 §15.5]`, it does not navigate. Focus is a **child route** because it is a genuine depth increase.

**[ASSUMPTION]** Patients use the same `/patient/:patientId` shape scoped to themselves rather than a separate URL namespace. Fewer route trees, and authorization is enforced by the backend regardless `[02 §7]`.

### 3.4 Role resolution

`/home` resolves to Patient Home Space or Practice Space from session role `[03 §4]`. One address, two spaces — reinforcing a single environment rather than two applications, and avoiding a role-prefixed URL scheme that would leak structure users must remember `[00 §10.6]`.

---

## 4. Folder organization (topic 31)

```
src/
  shell/            depth stack, motion orchestration, Intent Bar,
                    Signals surface, session boundary, error boundaries
  spaces/
    entry/          Entry + authentication (Depth 0)
    home/           patient-home/ · practice/          (Depth 1)
    patient/        Patient Space + Contextual Orbit    (Depth 2)
    focus/          report · event · task · note        (Depth 3)
    account/        profile · security · notifications · preferences · sessions
  features/
    body/           view-model · scene/ · fallback/ · anatomy/ · interaction
    journey/        time model · scrubber · event reveal
    evidence/       library · upload · preview · comparison
    understanding/  summary · progression · evidence linking · confidence
    actions/        list · composer · completion
    guidance/       shared · private · composer
    signals/        feed · delivery
  components/
    primitives/     control, input, select, label, surface, list, table,
                    badge, dialog, tooltip, avatar, separator, checkbox, switch
    motion/         SpatialTransition, SharedElement, Reveal, Stagger
    three/          canvas host, lighting rig, camera controller, tier gate
    patterns/       ContextualOrbit, FocusLayer, ProgressiveDisclosure,
                    EmptyState, ErrorState, LoadingSurface, Confidence,
                    EvidenceLink, SeverityIndicator
  data/
    contract/       API types + zod schemas (the contract)
    queries/        TanStack Query hooks, one file per resource
    adapters/       mock adapter (now) · http adapter (later)
  state/            session store, depth store, preferences store
  design/           tokens.css, theme, motion tokens, severity scale
  lib/              format, status mapping, capability detection, a11y utils
  types/            domain model
```

**Rationale.** Grouped by *architectural role*, then by *domain* — not by technical kind. A developer asked to change how the Body reveals evidence opens exactly one directory. Feature-per-directory also makes the "every module should be replaceable" requirement `[02 §17]` structurally true rather than aspirational.

`spaces/` and `features/` are deliberately separate: a space is a place the user occupies; a feature is capability that can appear in more than one space. Evidence appears in Patient Space, inside Focus, and scoped from an organ `[09.4 §5]` — so it cannot live inside any single space.

### 4.1 Import rules (enforced by lint)

- `components/` must not import from `features/` or `spaces/`
- `features/` must not import from `spaces/`
- features must not import each other; cross-feature interaction goes through the Shell or shared state
- only `data/` may import from `data/adapters/`

### 4.2 Code splitting

Split at space boundaries. The Entry must stay fast `[04 §14]`, so it must not pay for three.js. The Body's 3D bundle loads when Patient Space is entered, and the anatomy meshes load progressively `[09.6 §21]`.

---

## 5. Scalability strategy (topic 32)

**Structural.** Layer boundaries and the import rules above mean a new capability is a new directory under `features/`, wired into a Contextual Orbit — no existing feature is edited. This satisfies "future services should be added without changing existing modules" `[05 §20]` on the frontend side.

**Data.** The contract layer (doc 05) is the only place that knows the wire format. Swapping the mock adapter for HTTP, or absorbing a backend response-shape change, touches one directory.

**Visual.** All design decisions resolve to tokens (doc 03). A theme change is a token change, never a component edit — which is what makes "the design language must remain consistent" `[00 §10.16]` maintainable at scale.

**3D.** Anatomy is data-driven: organ definitions are declarative records, not hand-placed JSX. Adding an organ is adding a record. This matters because AI-provided organ coverage `[08 §11]` will expand over time.

**Team.** Feature directories are independently ownable with minimal merge contention.

**Known scaling limits, stated honestly.** Two areas will need revisiting before very large scale: the Journey renders all events for one patient (fine for a realistic patient history; needs virtualization beyond a few thousand events), and the Patient List will need server-side pagination and search rather than client filtering once an oncologist exceeds a few hundred patients `[09.2 §19]`.
