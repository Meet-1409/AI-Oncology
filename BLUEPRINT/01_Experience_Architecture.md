# 01 — Experience Architecture

**Covers blueprint topics 3, 4, 16, 17, 18, 19.**

---

## 1. Complete application flow (topic 3)

### 1.1 The depth graph

```
Depth 0   ENTRY ─────────────────────► AUTHENTICATION
                                              │ role
                        ┌─────────────────────┴─────────────────────┐
Depth 1        PATIENT HOME SPACE                            PRACTICE SPACE
                        │                                            │
                        │                                    select patient
                        │                                            ▼
Depth 2                 │                                    PATIENT SPACE
                        │                                    (Body at centre)
                        │                                            │
                        │                              Contextual Orbit:
                        │                       Journey · Evidence · Understanding
                        │                       Actions · Guidance · Information
                        │                                            │
Depth 3        FOCUS ◄──┴────────────────────────────────────────────┘
               report · event · task · note · composer

Lateral (Depth 1):  ACCOUNT — reached from user identity, not nested under Home
```

Movement rules, from `[04 §4]`:
- Deeper = zoom in. Back = zoom out. The space behind stays visible and recognisable.
- Focus never replaces the space beneath it.
- Depth never exceeds 4.
- Continuous Return always moves exactly one level out.

### 1.2 Patient Space is a stateful place, not a page

Inside Patient Space, three pieces of state modify the *entire* space rather than navigating:

| State | Effect | Basis |
|---|---|---|
| Journey position (time) | Body, Understanding and Evidence all reflect that moment | `[00 §15.5]`, `[09.5 §15]` |
| Selected organ | Reveals related Evidence, Journey events, Understanding | `[00 §6.17]`, `[09.6 §9]` |
| Comparison date | Two clinical states shown together | `[09.6 §11]` |

This is why they are query parameters (doc 00 §3.3). Changing time is not a navigation event, and treating it as one would cause a route transition where the docs demand continuity `[09.5 §16]`.

### 1.3 Cross-cutting surfaces

Three things exist at every depth and belong to the Shell, not to any space:

- **Intent Bar** — constant-time jump to any patient or destination `[04 §5]`. It replaces menus, which is what allows the "never remember where features are" rule `[00 §10.6]` to hold.
- **Signals** — arrive without interrupting clinical work `[04 §20]`; selecting one moves directly to the relevant space.
- **Identity** — the current user, and the current Patient Case when inside Patient Space `[09.3 §5]`. This is the primary "where am I" cue.

---

## 2. Navigation philosophy (topic 4)

### 2.1 Principle

Navigation is **movement through one environment**, not selection from an index. The user's mental model should be *place*, not *menu*. Every navigation therefore answers two questions visually: where did I come from, and where am I now.

### 2.2 The six primitives

| Primitive | Behaviour | Where used |
|---|---|---|
| **Spatial Zoom** | The selected object becomes the space entered | Patient → Patient Space; report → Focus |
| **Body as Navigation** | Selecting an organ reveals its clinical information and evidence in place | Patient Space |
| **Journey Scrubber** | Continuous time control; moves the whole space through time | Patient Space |
| **Intent Bar** | Single input expressing intent, including patient search | Everywhere |
| **Contextual Orbit** | 4–6 destinations around the focal object, revealed on demand | Patient Space, Home Space |
| **Continuous Return** | One consistent gesture/control, always one depth out | Everywhere below Depth 0 |

### 2.3 Prohibitions, and why they are architectural rather than cosmetic

The docs forbid a persistent sidebar of links and nested menus `[00 §10.5]`. This is not styling: a permanent sidebar implies a flat set of equally-available destinations, which directly contradicts a depth model where available destinations depend on where you are. The Contextual Orbit exists precisely because its contents are *derived from context*.

### 2.4 Reachability audit

Every requirement in `[00 §10.7]` (≤3 interactions) verified against the flow:

| Destination | From | Interactions |
|---|---|---|
| Any patient | anywhere | 2 (Intent Bar → select) |
| Body, current state | Practice Space | 1 (select patient — Body is already centre) |
| Organ evidence | Patient Space | 1 (select organ) |
| Any report | Patient Space | 2 (Orbit → Evidence → select = 3 worst case) |
| Journey event detail | Patient Space | 2 |
| Understanding | Patient Space | 1 |
| Assign an Action | Patient Space | 2 |
| Patient's next task | Patient Home Space | 0 — it is the first thing shown `[09.8 §5]` |
| Comparison view | Patient Space | 2 |

Worst case is 3. No destination exceeds the budget.

### 2.5 Keyboard model

Every spatial action needs a keyboard equivalent `[00 §16.1]`. Reserved globally:

| Key | Action |
|---|---|
| `Ctrl/Cmd + K` | Intent Bar |
| `Escape` | Continuous Return (one depth out) |
| `[` / `]` | Previous / next Journey event |
| `Shift + [` / `]` | Previous / next clinical date |
| `Tab` / arrows | Move focus within Contextual Orbit and organ list |
| `Enter` | Enter the focused object |

**[ASSUMPTION]** These specific bindings are my proposal; the docs require keyboard parity but name no keys.

---

## 3. Landing experience flow (topic 16)

The Entry must communicate identity, quality and trust immediately, create curiosity, be memorable, and remain fully usable without 3D `[04 §14]`.

### 3.1 Sequence

1. **Arrival.** A single, quiet statement of what the platform is. One focal 3D element — a slowly rotating, abstracted anatomical form rendered in the product's own visual language. It signals *this is a spatial medical instrument* before a word is read.
2. **Descent.** Scrolling moves *through* the introduction rather than down a document: About, Features, How It Works, Contact appear as stations along one continuous movement `[03 §3]`.
3. **Threshold.** Authentication is presented as entering the environment, not as a separate page.

### 3.2 Engineering constraints

- The Entry must not load the Body's 3D bundle. Its focal element is a separate lightweight scene (doc 00 §4.2).
- Must be fully usable with WebGL absent or reduced motion active — the focal element degrades to a static rendered image, and the descent becomes ordinary scrolling `[04 §14]`, `[00 §11.9]`.
- First meaningful paint must not wait on 3D. Text and layout render first, the scene fades in when ready `[04 §21]`.

### 3.3 What it must not be

No marketing hyperbole, no testimonials, no pricing, no feature grid of boxes. It must never look like a SaaS template `[04 §1]`. Restraint is the trust signal.

---

## 4. Patient journey (topic 17)

Design goal: the patient must **never feel overwhelmed** `[00 §10.10]`, and medical terminology is minimized `[09.1 §1]`.

```
Entry → sign in → Patient Home Space
   ↓
"What do I need to do?"  →  Actions appear first, closest to the viewer  [09.8 §5]
   ↓
Task requires a report   →  Upload happens in place, never leaving the space  [09.4 §6]
   ↓
Confirmation in place    →  Journey updates  →  Signal received
   ↓
Reads Guidance from the oncologist, in plain language  [09.9 §4]
   ↓
Sign out (ascent out of the environment)
```

**Engineering implications.**
- Upload must be an in-place Focus with resumable progress; a failed upload must never lose position `[09.8 §21]`.
- The patient's Journey is filtered by visibility — private observations, AI confidence and internal clinical information must never reach the client for a patient session `[09.5 §19]`. This is enforced server-side and additionally guarded in the query layer (doc 05 §4).
- The patient's Home Space presents priority order, not a grid `[09.1 §5]`.

---

## 5. Oncologist journey (topic 18)

Design goal: the oncologist must **never have to search for information** `[00 §10.9]`; it reveals itself in context.

```
Entry → sign in → Practice Space
   ↓
"Which patient needs me?"  →  patients as recognisable presences, with clinical context  [09.2 §5]
   ↓
Select patient  →  spatial zoom  →  PATIENT SPACE, Body already showing current state
   ↓
Understanding read first (the clinical narrative)  [09.7 §1]
   ↓
Journey scrubbed → Body moves through time continuously  [09.5 §15]
   ↓
Organ selected → its evidence, events and findings reveal in place  [09.6 §9]
   ↓
Report opened in Focus → original document is the source of truth  [09.4 §10]
   ↓
Comparison of two clinical dates  [09.6 §11]
   ↓
Assign Action · write Shared Guidance · write Private Observation — all in place  [09.8 §5], [09.9 §5]
   ↓
Continuous Return → next patient (lateral movement, smooth)  [09.3 §5]
```

**Engineering implications.**
- Arrival at Patient Space must show the Body's current clinical state without a further request — driving the aggregated-read requirement `[02 §9]` and the all-dates twin payload `[05 §9]`.
- Lateral patient movement must not tear down the WebGL context (doc 02 §5.4).
- Evidence reached from an organ arrives pre-scoped, with no manual filtering `[09.4 §5]`.

---

## 6. Complete screen map (topic 19)

"Screen" is used here to mean an addressable state of the environment.

### Depth 0
| Space | Address | Contents |
|---|---|---|
| Entry | `/` | Introduction, About, Features, How It Works, Contact `[03 §3]` |
| Authentication | `/enter` | Sign in; failure renders in place `[03 §4]` |
| Password recovery | `/enter/recover`, `/enter/reset` | `[06 Phase 7]` |

### Depth 1
| Space | Address | Contents |
|---|---|---|
| Patient Home Space | `/home` (patient) | Welcome · Quick Summary · Actions · Recent Evidence · Recent Guidance · Journey Preview · Signals `[09.1 §5]` |
| Practice Space | `/home` (oncologist) | Orientation · Practice Summary · Patient presences · Recent Evidence · Pending Actions · Signals `[09.2 §5]` |
| Account | `/account` | Profile · Security · Notifications · Preferences · Sessions · Privacy `[09.10 §4]` |
| Signals | `/signals` | Full notification history `[04 §20]` |

### Depth 2
| Space | Address | Contents |
|---|---|---|
| Patient Space | `/patient/:id` | Body at centre; persistent identity; Contextual Orbit `[09.3 §5]` |
| — at a time | `?t=` | Whole space at that clinical date |
| — organ selected | `?organ=` | Organ clinical info + evidence revealed |
| — comparison | `?compare=` | Two clinical states together |
| Orbit: Information | in-space | Overview, medical information, comorbidities `[09.3 §6-9]` |
| Orbit: Journey | in-space | Continuous path through time `[09.5]` |
| Orbit: Evidence | in-space | Report set, searchable/filterable/sortable `[09.4 §9]` |
| Orbit: Understanding | in-space | Summary, disease, treatment, progression, evidence, confidence `[09.7 §5]` |
| Orbit: Actions | in-space | Assigned / pending / completed `[09.8]` |
| Orbit: Guidance | in-space | Shared Guidance · Private Observations `[09.9]` |

### Depth 3 — Focus (always above a preserved parent)
| Focus | Address | Contents |
|---|---|---|
| Report | `/patient/:id/report/:reportId` | Original document · metadata · AI summary · evidence · confidence · related events `[09.4 §10]` |
| Report comparison | `…/report/:a?compare=:b` | Previous · current · detected changes · evidence · confidence `[09.4 §14]` |
| Journey event | `/patient/:id/event/:eventId` | Full event · related reports · evidence · prev/next `[09.5 §7]` |
| Task | `/patient/:id/task/:taskId` | Details · uploaded files · completion history `[09.8 §11]` |
| Task composer | `/patient/:id/task/new` | Oncologist assigns an Action `[09.8 §10]` |
| Note | `/patient/:id/note/:noteId` | Shared Guidance or Private Observation `[09.9 §6-7]` |
| Note composer | `/patient/:id/note/new` | Visibility unmistakable before saving `[09.9 §10-11]` |
| Upload | `…?upload=1` | In-place upload with progress `[09.4 §6]` |

### Non-3D equivalent
Every Body state has an equivalent structured presentation of organs, severities and evidence `[00 §12.6]`, reachable at the same address with the 3D renderer disabled — not a separate screen (doc 02 §6).

### System states
Every space implements loading, empty and error states as defined in doc 04. `[04 §21-23]`
