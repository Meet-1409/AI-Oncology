# AI Oncology — Context Handover

**Purpose of this document:** bring a fresh AI assistant (with no prior conversation history) fully up to speed on this project — what it is, how it is built, what has changed recently, and above all *what kind of product the owner is trying to make*. Read it end to end before proposing anything.

**Date:** 6 August 2026
**Repository:** `C:\Users\Asus\Desktop\AI Oncology` (Windows, git, branch `master`)

---

## Part 1 — What the product is

An **AI Oncology Patient Intelligence Platform**. A web application with two distinct audiences sharing one system:

- **Oncologists** — manage patients, review reports, track cases, read AI-derived analysis.
- **Patients** — see their own reports, their care team, their record, and their treatment journey in one place.

The centrepiece is **The Digital Twin**: an interactive, anatomically real 3D human body where organs are coloured by disease severity, and the whole model can be moved backward and forward through the patient's clinical timeline.

**Only the frontend exists.** Backend, AI, APIs, database and real authentication have deliberately never been started. The frontend is built contract-first so a backend can be dropped in behind it: every response shape is declared as a zod schema, every response is validated at the boundary, and swapping the mock adapter for an HTTP adapter is the entire integration on the frontend side.

### Two hard product rules that constrain everything

1. **No invented clinical data, ever.** If a value is not recorded, the interface says "Not yet recorded" — never a blank, never a guess, never a plausible-looking placeholder. There are currently **zero fake patients** in the system; signing in synthesizes an empty identity from the email you typed. Any AI-derived statement must carry its evidence and a confidence value, or it fails schema validation.
2. **The interface must never make a clinical claim the data does not support.** For example, the severity colour scale describes *position on a documented scale and nothing else* — not size, not spread, not prognosis. This matters most exactly where a reassuring-sounding phrase would be most tempting.

There is a permanent, non-negotiable rules file at `READ THIS/00_Ground_Rules.txt`, plus a technical requirements document beside it. Those two files are frozen and authoritative. `BLUEPRINT/` is the editable engineering companion where architectural decisions get recorded.

---

## Part 2 — What kind of website the owner wants

This is the part most likely to be underestimated. **The owner does not want a nice dashboard. The owner wants an unforgettable experience** — something that could plausibly sell for **$10–12k** as a piece of design work.

Their own words, verbatim, across several messages:

> "create a perfect 3d website … complete a proper website which I might like and something that could sell for almost 10-12k dollars. that much 3d and animation, seen those reels of nike, sony, adidas, watches websites which are cool as fuck and so much graphic. I want that."

> "everything must be 3d, full of designs."

> "do not add any fake data. only create a demo human structural model. which replicates a real human completely which is completely identical to a real human and not shapes joined together. every organ every body part should be identical to a real human body."

> "check the website on your own, if there is any bug or some thing is not working solve it, do not make me enter a prompt again unless i want to add a feature … do not stop unless you're done."

And a later, much more specific design brief. The assistant is asked to act simultaneously as: **Apple HIG team, Vercel Design, Linear Design, Framer, Stripe, Awwwards judges, motion designer, UI designer, UX designer, 3D artist, lighting artist, creative director, frontend architect, accessibility expert, performance engineer, QA engineer, interaction designer, cinematographer, product designer.**

The key lines from that brief:

- The objective is **not to build a website** — it is to create an experience closer to **an operating system, a cinematic experience, or an interactive installation** than to a traditional website.
- Users should think *"How is this website this smooth?"* — not *"this website has nice features."*
- **Every page must feel alive.** Subtle breathing motion, floating particles, animated lighting, moving reflections, camera drift, glass refraction, gradient movement, soft noise, volumetric atmosphere — alive without being distracting.
- **Every interaction matters.** A button has idle, hover, cursor-attraction, press, release, loading, success, error, disabled, focus, keyboard and touch states — each intentionally designed.
- **Every transition must have purpose.** Transitions communicate movement, hierarchy, focus, depth, cause and effect. *Animation should teach the user where they are.* Never animate for decoration.
- **The login should feel like entering a secure AI medical operating system** — the interface materializes, panels assemble, glass forms, lighting reacts. Authentication should feel like entering another space, not navigating to another page.
- **The Digital Twin is the centre of the experience**, never decoration: idle animation, breathing, subtle heartbeat, lighting changes, organ highlighting, smooth camera movement, hover and selection responses.
- **Every screen should have its own atmosphere** — landing, patient, doctor, reports, settings each feel subtly different *without changing the design language*.
- Think like a film director: *where is the camera, where is the light, what is the focal point, where does the eye move, what emotion does this frame create?*
- **Performance is never sacrificed.** GPU-friendly animation, no layout shift, smooth frame rates. "Luxury comes from precision, not complexity."

### The non-negotiable counterweight

> "If forced to choose between beauty and usability, always choose usability."

The users are a **cancer patient** — possibly frightened, possibly non-technical, possibly on a tablet — and a **working oncologist** who needs information fast. So despite the premium ambition: navigation stays obvious, no hidden functionality, no confusing layouts, no "vibe coded" behaviour. *If an animation makes something harder to understand, remove or redesign it.*

This tension — cinematic ambition vs. clinical clarity — is the defining design problem of this project. It is resolved architecturally by maintaining **two visual vocabularies** with an enforced boundary (see Part 4).

### Required working method

The owner has asked for a specific process, and it is as much a requirement as the visual bar:

- **Study everything before changing anything.** Never blindly rewrite.
- **Self-verify visually.** Run the app, look at real screenshots, find flaws, rank them, fix them, repeat. Do not declare something done without having actually looked at it.
- **After every review cycle, produce ten independent reviews** — Apple UI designer, Awwwards judge, senior frontend engineer, UX researcher, motion designer, accessibility expert, performance engineer, first-time patient, oncologist using it at work, and an investor seeing it for the first time. Each must find problems independently; merge, prioritize, fix, repeat.
- **Never praise your own work.** Assume it is still missing something.
- **Stop only after three complete review cycles find nothing** — no visual, interaction, animation, accessibility, layout, performance, spacing or typography issues, and no obvious opportunity to raise premium perception.
- Work autonomously; do not ask for another prompt unless the owner wants a genuinely new feature.

---

## Part 3 — Current state

### Working and verified

| Area | State |
|---|---|
| Design system, tokens, primitives, patterns | Complete, with a dev-only Showcase route |
| Global shell, depth model, spatial travel | Complete |
| Entry (landing) + two-role authentication | Working; **Entry still needs the full cinematic rebuild** |
| Practice Space (doctor home) / Patient Home Space | Working, real empty states, no fake data |
| Patient Space with Contextual Orbit tabs | Complete |
| The Digital Twin — 3D and accessible-DOM twin | Complete, **now with real sculpted anatomy** |
| Journey, Evidence, Understanding, Actions, Guidance | Complete |
| Signals, Account, Intent Bar (⌘K) | Complete |
| Data layer — zod contracts, adapter, mock store | Complete, backend-ready, persists to localStorage |
| Light and dark themes + visible toggle | Complete |

Verification currently passes end to end: TypeScript typecheck, the custom architecture guardrail, 11 clinical safety checks, 20 unit tests, lint, and a production build.

### Known outstanding work

1. **Entry page** — not yet the Nike/Apple-tier cinematic hero the brief calls for.
2. **Auth screen** — functional two-role split, but does not yet "materialize / assemble / form glass" as described.
3. **Dashboards** — real layouts with honest empty states, but not yet designed to the stated bar.
4. **Digital Twin life** — the model renders beautifully but does not yet breathe, pulse, drift, or respond on hover.
5. **Female anatomy** — the sourced atlas is male-only; a properly-licensed female body/organ set still needs finding.
6. **Per-screen atmosphere** — not yet differentiated.
7. **Microinteraction pass** — not yet done systematically across every control.
8. **Real-device audit** — never run on actual hardware, a tablet in particular.

---

## Part 4 — Architecture

### Stack

React 19 · TypeScript 6 (strict) · Vite 8 · Tailwind v4 (CSS-first `@theme`) · Radix UI · TanStack Query · Zustand · react-router-dom v7 · three.js + @react-three/fiber + drei · zod · lucide-react · class-variance-authority

`exactOptionalPropertyTypes` is deliberately off (React and @react-three types declare optional props without `| undefined`); every other strict flag is on.

### Layering, enforced by a build-failing script

```
spaces  →  features  →  components  →  lib
              ↘  data
```

`frontend/tools/check-architecture.mjs` fails the build on violation. Features may not import each other.

### The spatial model — the organising idea

Four depth levels. This is not decoration; it drives routing, motion and the shell.

| Depth | Space | Route |
|---|---|---|
| 0 | Entry, authentication | `/`, `/enter` |
| 1 | Practice Space / Patient Home, Account | `/home`, `/account` |
| 2 | Patient Space | `/patient/:id` |
| 3 | Focus layers | `/patient/:id/report/:id` etc. |

**Focus opens *above* a preserved parent** — nested routes and `<Outlet />`, never a route swap. The space behind stays mounted and visible.

**Spatial travel:** both spaces animate at once — the departing space plays out while the arriving one plays in, overlapping in the same frame. Blur carries the depth, because scale alone reads as an effect applied to a page whereas scale plus focus reads as moving through space. Motion carries exactly one of four meanings: depth, time, clinical, or process.

**Continuous Return:** one gesture always moves exactly one depth level out. Bound to Escape *and* a visible control, because a keyboard shortcut nobody can see is not a way back for a patient on a tablet.

### Vocabulary — every surface has a spatial name and a clinical name

Entry/Landing · Practice Space/Dashboard · Patient Space/Patient Profile · **Body/Digital Twin** · Journey/Timeline · Evidence/Reports · Understanding/Patient Intelligence · Actions/Tasks · Guidance/Notes · Signals/Notifications · Account/Settings

### Two visual vocabularies, with an enforced boundary

The frozen docs demand two incompatible things: a *cinematic* Entry, and an application where *usability is never sacrificed for visual effect*. One system tuned for both is a compromise at each end — so there are two.

The **cinematic layer** lives in `components/cinematic/` with its own `--cinema-*` tokens and a longer motion envelope (up to 1700ms vs. the application's 380ms ceiling). The architecture check **fails the build** if anything outside `src/spaces/entry` imports it.

### Motion envelope

| Token | Duration | Use |
|---|---|---|
| `--motion-quick` | 180ms | hover, control state |
| `--motion-reveal` | 260ms | content revealing, signals arriving |
| `--motion-spatial` | 380ms | depth change, focus open/close |

Reduced motion is honoured at the *token* level — every duration resolves to 0ms and every consumer inherits it without opting in.

---

## Part 5 — Safety invariants (each exists because of a real shipped defect)

These are enforced by tooling, not trusted to discipline. **Do not weaken them.**

1. **Severity colours must be literal hex, never `var(--x)`.** three.js cannot parse CSS custom properties — it warns and silently yields *white*. Shipping that once made every diseased organ render white while the feature appeared to work perfectly. The scale is necessarily duplicated in three files (`design/tokens.css`, `design/theme.ts`, `lib/status.ts`) and the architecture check asserts all three agree on every build. **Do not add a fourth copy.**
2. **The severity scale is never themed.** Lighter = lower severity, darker = higher. A theme that restyled it would mean the same finding rendering as two different colours depending on a display preference. The dark theme delineates the swatch with a themed *ring* instead.
3. **One view-model, two renderers.** `use-body-view-model.ts` feeds both the 3D `BodyScene` and the accessible `BodyStructured`. They cannot drift, and a test asserts every organ reachable in one is reachable in the other. This is also the WebGL-absent fallback path.
4. **Role isolation is checked at the transport boundary.** A patient session must never receive private notes, Patient Intelligence, or oncologist-only timeline events. Tested against the store directly, not through the UI. (Must also be enforced server-side when a backend exists — the frontend guard is a second lock, never the only one.)
5. **Time resolution never interpolates.** Selecting a date returns a real validated snapshot, never an invented in-between clinical state.
6. **Plain language may not invent clinical claims** (see Part 1, rule 2).
7. **Every semantic token needs a dark value**, or it silently inherits the light one — dark text on a dark surface. Build fails otherwise.

Run them with `npm run test:safety`.

---

## Part 6 — What changed in the most recent work

### Everything was rebuilt around honest data

Previously the app shipped seeded fake patients. Now:
- **Zero fake patients.** `synthesizePatient()` / `synthesizeOncologist()` build an empty identity from the email submitted at sign-in.
- Identities **persist to `localStorage`** (`ao.mock-store.v1`) so they survive reload — a real architectural gap that was found and fixed.
- Empty states everywhere are honest and specific: "This is a real, empty practice — nothing here is invented."
- Every empty clinical field renders **"Not yet recorded"** rather than a blank or a `NaN`.

### Two separate login paths

Role-selection cards (*I'm a patient* / *I'm a doctor*) followed by an email/password step. The old "pick a fake patient record from a dropdown" flow is gone.

### Real sculpted anatomy replaced procedural geometry

This was the largest piece of work. Previously the body and organs were generated in code — mathematically correct, but they read as generated. Now they are extracted from **Z-Anatomy**, an open-source anatomical atlas.

- 14 organ meshes (brain, thyroid, heart, both lungs, liver, stomach, pancreas, spleen, both kidneys, colon, bladder, prostate) plus the external body surface.
- Decimated from **≈991,000 triangles to ≈42,000** so it renders in real time on a patient's own device.
- Files live at `frontend/public/models/{body-male,body-neutral,organs}.glb`; the reproducible pipeline is `frontend/tools/extract-organs.mjs` and `extract-body.mjs`.
- The procedural geometry **remains as a per-organ fallback** — a missing or broken asset must never leave a patient looking at an empty panel where their anatomy should be.

Three real bugs were found and fixed during this work, all by looking at actual rendered output:
- Non-anatomical helper geometry (hair strands, eyelashes, viewer cross-section planes) was being baked into the body surface.
- Needle-thin "sliver" triangles at the seams between adjacent authored surface patches were catching the rim-light shader and reading as stray glowing lines radiating off the silhouette.
- The mesh simplifier shrinks the *index* list but leaves the original vertex buffer intact, so a 96%-reduced mesh was still shipping 100% of its source vertices. Compacting recovered ~11 MB.

### Other fixes

- **Zoom now travels toward the cursor**, not the figure's centre — previously, examining a shoulder meant zooming past it and panning back.
- A **`NaN yrs`** bug in the Patient Space header.
- Distinctive display typeface (Bricolage Grotesque) paired with Inter, and a **visible light/dark theme toggle** in the shell.
- A headless-Chromium screenshot tool (`frontend/tools/shot.mjs`) that logs in, captures real pixels, and reports console errors and layout overflow — this is now the standard way work gets verified, because the in-editor browser preview cannot composite frames in this environment.

### Licensing — needs a decision

Z-Anatomy is **CC BY-SA 4.0**. Commercial use is permitted, but it is **copyleft**, and two conditions bind a commercial release: attribution must be **visible to users inside the running app** (currently only in `ATTRIBUTIONS.md` — the Account space is the intended place and this is **not yet implemented**), and ShareAlike applies to the model files and adaptations of them. Full analysis is in `ATTRIBUTIONS.md`. If those terms are unacceptable, a purchased atlas can be dropped in — the loading path is source-agnostic.

---

## Part 7 — Practical notes for whoever works on this next

```bash
cd frontend
npm install          # on Windows, natively — see warning below
npm run dev          # http://localhost:5173
npm run verify       # typecheck + architecture + safety + tests + lint
npm run verify:full  # the above, plus production build and bundle check
node tools/shot.mjs http://localhost:5173/home out.png 1440 900 oncologist
```

**Traps that have already cost real time:**

- **Never run `npm install` from a Linux sandbox against this folder.** `node_modules` holds Windows-native binaries; a Linux install replaces them and the dev server then fails with `Cannot find native binding`. Recovery is deleting `package-lock.json` and reinstalling natively on Windows.
- `.ts` is also the extension for MPEG-2 Transport Stream, so Windows hands those files to a media player. Open them from inside the editor.
- The lint config ignores `tools/`; Node dev scripts belong there, not at the frontend root, or `no-console` fails the build.
- three.js's `GLTFExporter` calls `FileReader.onloadend` (not `onload`) — a Node shim that implements only `onload` fails **silently**, exiting cleanly with no file written and no error.
- The mesh simplifier needs a **welded, indexed** mesh; a freshly-baked geometry has no shared edges to collapse.

---

## Part 8 — How to be useful here

Given the brief in Part 2, the most valuable contributions are almost certainly:

1. **Concrete art direction** for the Entry and the login-as-entering-a-system moment — composition, lighting, camera, timing, easing.
2. **A specific microinteraction system** — actual curves and durations for the full state matrix of a control, not general advice.
3. **Making the Digital Twin feel alive** — breathing, heartbeat, camera drift, hover response — while keeping every clinical guarantee in Part 5 intact.
4. **Per-screen atmosphere** achieved without fragmenting the design language.
5. **Ruthless critique.** The owner explicitly asked for reviewers who find problems rather than validate. General praise is worthless here; a ranked list of specific flaws is the deliverable.

Whatever is proposed, it has to survive two questions: *would Apple, Vercel, Stripe, Linear or Framer ship this?* — and — *can a frightened patient or a busy oncologist still understand it in seconds?* Both must be yes.
