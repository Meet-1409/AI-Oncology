# 05 — Data, State, Quality and System Strategies

**Covers blueprint topics 23, 24, 25, 26, 27, 28, 29, 30, 33, 34, 35.**

---

## 1. API integration strategy (topic 29)

### 1.1 Situation

No backend exists yet. The TRD nonetheless fixes the rules: the frontend talks only to APIs `[02 §9]`, never touches a database, and contains no business logic `[02 §2]`.

### 1.2 Contract-first with a swappable adapter

**[ASSUMPTION — flagged for review]** The docs do not say how to proceed before the backend exists. My decision:

```
features / spaces
      │  (typed hooks only)
      ▼
data/queries        TanStack Query hooks
      │
      ▼
data/contract       TypeScript types + zod schemas   ← the contract
      │
      ▼
data/adapters       mock adapter (now) ──► http adapter (later)
```

The contract is written **first**, from the documented data requirements, and validated at runtime with zod. The mock adapter satisfies it today; the HTTP adapter satisfies it later. Nothing above `data/` knows which is in use — swapping is a single composition-root change.

This avoids the failure mode where mock-shaped data leaks into components and the real integration becomes a rewrite. Runtime validation also means a backend that drifts from the contract fails loudly at the boundary rather than silently rendering wrong clinical values.

### 1.3 Endpoint shapes required by the experience

Derived from documented requirements, not invented:

| Need | Requirement |
|---|---|
| Enter a space in one request | `[02 §9]` "retrievable in a single aggregated request" |
| Twin data for all clinical dates together | `[02 §11]`, `[05 §9]` — makes scrubbing network-free |
| Evidence attached to organ states | `[05 §9]`, `[08 §11]` — organ selection needs no request |
| Evidence attached to AI statements | `[08 §13]` — verification without leaving the space |

Practical consequence: entering Patient Space issues **one** aggregated read, not six. This is the difference between an environment and a set of pages.

### 1.4 Mutations

Upload, task creation, task completion and note creation follow: optimistic update where the outcome is certain → invalidate affected queries → reconcile.

Uploads are resumable and must never lose the user's position on failure `[09.8 §21]`; note composers must never lose written text on a failed save `[09.9 §20]`. Both imply draft state held outside the request lifecycle.

### 1.5 Processing status

Reports move `uploaded → processing → processed/failed` `[09.4 §15]`. The docs specify status updates "automatically after refresh" — so polling while any report is processing is sufficient, and no realtime transport is required. **[ASSUMPTION]** Polling interval and backoff are an engineering choice.

---

## 2. State management strategy (topic 30)

### 2.1 Four kinds of state, deliberately separated

| Kind | Owner | Examples |
|---|---|---|
| **Server state** | TanStack Query | patients, reports, journey, twin, tasks, notes, signals |
| **Session state** | Zustand (persisted) | identity, role, preferences |
| **Environment state** | Zustand (not persisted) | depth stack, transition status, Intent Bar |
| **Space state** | URL | patient id, time position, selected organ, comparison |

### 2.2 Why the URL holds space state

Because `[03 §23]` requires that the current depth and Patient Case are always identifiable, and because a clinical view should be restorable and shareable. Putting time position and organ selection in component state would make a colleague unable to open the same view, and would break browser back.

### 2.3 Why server state is not in a global store

TanStack Query's cache is what makes "entering a previously visited space should not require a full reload" `[02 §12]` true by default. Mirroring server data into Zustand would create two sources of truth for clinical information — an unacceptable risk in this domain.

### 2.4 Continuity guarantee

Nothing in the environment is destroyed by navigation. Parent spaces stay mounted beneath Focus; the query cache survives; the WebGL context survives patient changes. This is the concrete implementation of "never rebuilt from scratch" `[02 §2]`.

### 2.5 Role and visibility

Role determines which queries may run and which fields are requested. Patients must never receive private notes, AI confidence or internal clinical information `[09.5 §19]`. Enforced server-side `[02 §7]`; additionally guarded in the query layer so a UI mistake cannot expose data the session should not hold. Defence in depth — the frontend guard is a second lock, never the only one.

---

## 3. Loading strategy (topic 25)

**Rule: a blank screen is never displayed** `[00 §13.7]`.

1. **Structure before detail.** A space renders its own layout immediately; content fills in `[04 §21]`.
2. **Loading uses the motion language** — it communicates the system is moving, not stuck `[04 §21]`.
3. **Progressive 3D.** Patient Space is usable before anatomy finishes loading; meshes stream in `[09.6 §21]`.
4. **Prefetch on intent.** Hovering or focusing a patient prefetches their aggregated read, so the zoom transition and the data arrive together.
5. **Never block on AI.** Understanding and summaries load independently; the space works without them `[00 §13.4]`.
6. **Skeletons mirror final layout** so no reflow occurs on arrival.

---

## 4. Error handling strategy (topic 26)

**Rule: an error in one space never breaks the surrounding environment** `[02 §13]`.

### 4.1 Boundaries

Nested error boundaries at Shell → Space → Feature → 3D scene. The innermost boundary catches; everything outside continues.

### 4.2 Behaviour by class

| Error | Behaviour |
|---|---|
| Network | Explain, offer retry, preserve position `[04 §23]` |
| Validation | In place, explaining how to fix `[04 §12]` |
| Upload failure | Retry without losing position or file selection `[09.8 §21]` |
| Save failure | Never lose written text `[09.9 §20]` |
| AI processing | Degrade only that surface; original reports unaffected `[00 §13.4]` |
| 3D render failure | Swap to structured renderer; space unaffected `[09.6 §20]` |
| Session expired | Explain, preserve intended destination, resume after re-auth |
| Permission denied | Explain plainly, no technical detail `[04 §23]` |

### 4.3 Language

Explain the problem, explain what to do next, avoid technical language, allow recovery `[04 §23]`. Never expose stack traces or system internals `[05 §18]`.

---

## 5. Empty state strategy (topic 27)

Every empty space explains **why** it is empty and offers the next action where appropriate `[04 §22]`.

| Space | Message | Action |
|---|---|---|
| No reports | Nothing uploaded yet | Upload prompt `[09.4 §22]` |
| No tasks | Nothing needed right now | — `[09.8 §20]` |
| No notes | No guidance yet | — `[09.9 §19]` |
| No signals | Up to date | — `[09.1 §15]` |
| No visualization | No validated data to visualize | Open Evidence `[09.6 §19]` |
| No comparison | Only one clinical date available | — `[09.6 §19]` |
| No search results | Nothing matched | Clear filters `[09.4 §22]` |
| No patients | None assigned | — `[09.2 §15]` |

Empty states are never blank and never apologetic. For patients they are reassuring; an empty task list means "you're up to date", not "nothing found" `[00 §10.10]`.

---

## 6. Notification (Signals) strategy (topic 28)

**Signals never interrupt clinical work** `[04 §20]`.

- Delivery is peripheral: they arrive quietly, never steal focus, never block, never modal.
- Motion draws attention without alarming `[09.9 §17]`.
- Selecting a Signal moves directly to the relevant space `[04 §20]` — it is a navigation action.
- Categorised, short, dismissible `[04 §20]`; category conveyed in text, never colour alone.
- Unread count is visible but never a red badge implying emergency — this product must not create alarm fatigue in a cancer-care context. **[ASSUMPTION]**
- Screen readers: polite live region, never assertive, so a Signal cannot interrupt a doctor reading clinical information.

Documented triggers preserved exactly: patient — new task, task updated/cancelled/reviewed, report uploaded, new note `[09.8 §16]`, `[09.9 §15]`; oncologist — report uploaded, task completed, AI processing complete, system alerts `[09.2 §11]`.

---

## 7. Accessibility strategy (topic 23)

Target: **WCAG 2.2 AA**. **[ASSUMPTION]** — the docs require the constituent behaviours but name no standard; AA is the defensible baseline for healthcare software.

| Requirement | Implementation |
|---|---|
| Keyboard equivalent for every spatial action `[00 §16.1]` | Global key model (doc 01 §2.5); organs keyboard-selectable |
| Never colour alone `[00 §16.2]` | Every state carries text or shape |
| Readable contrast, size, spacing `[00 §16.3]` | Token-enforced; respects user font size |
| Descriptive labels `[00 §16.4]` | Accessible name on every control |
| Screen-reader parity `[00 §16.5]` | Structured renderer for the Body (doc 02 §6) |
| Reduced motion `[00 §11.9]` | Provider-level token resolution |
| Non-3D equivalent `[00 §12.6]` | First-class, same view-model |

**Depth and screen readers.** Opening Focus moves focus in and marks the parent inert; closing restores focus to the origin. Depth changes are announced politely, so non-visual users receive the same "where am I" information that motion gives sighted users.

**Testing.** Automated axe checks in CI, plus manual keyboard-only and screen-reader passes on the Body, Journey and upload flows — the three most spatial, highest-risk surfaces.

---

## 8. Performance strategy (topic 24)

Target: **60fps** during navigation and 3D interaction `[00 §13.5]`.

### 8.1 Budgets **[ASSUMPTION — numbers are my proposal]**

| Metric | Budget |
|---|---|
| Entry initial JS (gzipped) | ≤ 200KB, excluding 3D |
| Patient Space interactive | ≤ 2.5s on target hardware |
| Frame budget during transition/orbit | ≤ 16ms |
| Journey scrub | no network request |
| Patient switch | no WebGL context loss |

### 8.2 Techniques

- Route-level code splitting; three.js excluded from the Entry bundle (doc 00 §4.2).
- Animate only compositor-friendly properties (doc 02 §1.5).
- 3D: instancing where possible, capped DPR, on-demand rendering when the scene is static, capability tiering (doc 02 §4.2).
- Render isolation so 3D re-renders never cascade into UI re-renders.
- Aggregated reads to eliminate request waterfalls `[02 §9]`.
- Virtualization for long collections; pagination as documented `[09.4 §24]`.
- Large PDFs render off the main thread and never block the interface `[09.4 §24]`.

### 8.3 Degradation

Sustained frame drops reduce visual complexity automatically — never clinical meaning `[00 §13.6]`.

---

## 9. Testing strategy (topic 33)

**[ASSUMPTION]** The docs require verification `[00 §17.7]` but name no tooling. Proposed: Vitest + Testing Library + Playwright + axe. None currently installed.

**Implemented (unit/component/accessibility layers):** Vitest + `@testing-library/react` +
`@testing-library/user-event` + `@testing-library/jest-dom`, wired into `npm run verify`.
`@axe-core/react` — this document's original axe pick — does not support React
18 and above by its own README; `jest-axe` runs the same `axe-core` engine
directly against rendered DOM instead of via React internals, so it is
React-version-independent, and is what `src/test/setup.ts` actually extends
`expect` with (`toHaveNoViolations()`). Contrast rules are disabled by
`jest-axe` under jsdom (no real layout engine to measure against), so the
automated pass covers structural accessibility — labels, ARIA validity,
heading order — and contrast remains a manual/real-browser check. Playwright
(the integration/E2E layer) is not yet installed.

| Layer | Scope |
|---|---|
| **Unit** | contract schemas, severity mapping, time interpolation, visibility filtering, format utilities |
| **Component** | states, keyboard operation, accessible names, reduced-motion behaviour |
| **Integration** | full documented workflows: patient completes a task; oncologist reviews a patient end to end |
| **Accessibility** | automated axe on every space; keyboard-only journeys |
| **Visual** | severity scale, elevation, spacing rhythm |
| **Performance** | frame-rate assertion during transitions and orbit |

### 9.1 Non-negotiable regression tests

Derived from real failure modes and clinical risk:

1. **Severity colours parse in three.js** — the white-organ bug (doc 03 §2.3) must never recur.
2. **Patients never receive private notes, AI confidence or internal clinical information** `[09.5 §19]`.
3. **Reduced motion loses no functionality or information** `[00 §11.9]`.
4. **The structured renderer exposes every organ, severity and evidence item the 3D scene does** `[00 §16.5]`.
5. **Every AI output renders its evidence and confidence** `[00 §5.9]`, `[00 §5.10]`.
6. **Camera movement never alters clinical state** `[00 §6.12]`.
7. **Interpolated time never displays as a validated clinical value** (doc 02 §5.4).

Items 2, 5, 6 and 7 are patient-safety tests, not UI tests. They should fail the build.

---

## 10. Code quality strategy (topic 34)

Required: production quality, reusable, maintainable, no placeholders, no incomplete components, no TODOs `[00 §17.6]`, `[02 §18]`.

- **TypeScript strict**, no `any` in application code; the contract is the type source of truth.
- **Lint enforces architecture**: the import rules in doc 00 §4.1 are lint rules, so a layering violation fails CI rather than relying on review.
- **No hard-coded design values** — colour, spacing, type and motion must come from tokens; enforced by lint.
- **Definition of done**, per `[00 §17.7]` and `[06 §23]`: feature verified against every project document; loading, empty and error states implemented; keyboard parity; reduced-motion verified; non-3D equivalent where 3D is used; performance checked; no TODOs.
- **Review checklist** mirrors `[06 §23]` exactly, so review is verification against documentation rather than taste.
- **Every non-obvious decision carries a comment explaining *why***, especially clinical-safety constraints — a future contributor must not "simplify" the camera/clinical state separation without understanding what it protects.

---

## 11. Future expansion strategy (topic 35)

Constraint: future features must not change the existing vision `[01 §17]`, and must follow the Ground Rules.

**Ready by construction.** New capability = new `features/` directory + an Orbit entry; no existing feature edited. New anatomy = new organ records. New AI outputs = contract extension; the evidence/confidence pattern already generalises. Theming = token remap.

**Explicitly out of scope and deliberately not pre-built** `[01 §16]`: doctor-to-doctor chat, messaging, tumour boards, collaboration, hospital management, scheduling, billing, payments, inventory, e-prescriptions, video consultation, hospital administration. No speculative scaffolding for these — it would violate "never adds features unless instructed" `[00 §18.3]`.

**Anticipated but not built:** DICOM support is named as future `[09.4 §7]`, so the report model treats file kind as an open enumeration rather than a closed union — a small decision now that avoids a schema migration later. Search-within-report is likewise future `[09.4 §16]`.

**Known limits to revisit** (restating doc 00 §5 honestly): Journey virtualization beyond a few thousand events; server-side patient search beyond a few hundred patients; realtime transport if Signals ever need to be instant rather than refresh-driven.
