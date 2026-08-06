# Art Direction — AI Oncology

**Status:** design document. No implementation until this is agreed.
**Date:** 6 August 2026

---

## Part 1 — What the references actually are

Being accurate about the source material matters more than flattering it. Two of the five are genuine art-direction case studies; three are tool marketing that happen to contain useful frames.

| # | Reference | What it actually is | Value |
|---|---|---|---|
| 1 | **igloo.inc** | A real Awwwards-winning site, shown inside a reaction video | **Highest.** The closest thing to what this product should feel like |
| 5 | **Scarab / "Born of Nature"** | A CSS/JS scroll tutorial, but the site itself is strong | **High.** Best single lesson on scroll choreography |
| 3 | **Dora AI promo** | AI site-builder ad; contains Apple AirPods-style and character scenes | Medium. Good for type/object interpenetration |
| 2 | **"3D websites with Claude Code"** | YouTube tutorial, rapid montage of showcase sites | Low-medium. Confirms recurring patterns |
| 4 | **TIDY (Figma vs Sketch video)** | A light-mode SaaS site | Medium — and the most *directly* relevant to our light theme |

---

## Part 2 — What they have in common (the actual lesson)

Watching all five, the same five decisions recur. None of them is an animation. All of them are compositional.

**1. There is ONE object.** Not a gallery, not a grid of features. igloo.inc has an igloo. Scarab has a scarab. Dora's Apple scene has a pair of AirPods. The entire page is built to serve looking at that one thing.

**2. The object lives in a void.** Not "on a dark background" — in *atmosphere*. Fog, depth haze, falloff into black. In igloo.inc the landscape dissolves into mist; in Scarab the bloom is volumetric smoke. The void is a material, not an absence.

**3. Type is subordinate, and the object cuts through it.** Scarab's headline is "BORN OF | NATURE" with the scarab sitting *between the words*, occluding them. Dora's AirPods overlap the letters of "AirPods Pro". Deadpool breaks through "DEADPOOL". The object is nearer than the text — that single depth relationship does more for premium perception than any animation in these videos.

**4. Scroll transforms the object; it does not scroll the page.** igloo.inc's igloo assembles from wireframe → dome → stacked blocks → exploded → reassembled. Scarab blooms from a small object into a screen-filling cloud, then resolves into a new title. The page is a *timeline for one object's state*, not a stack of sections.

**5. Colour is rationed to near-zero.** igloo.inc is essentially greyscale. Scarab is black with exactly one violet. Where colour appears, it is the subject. TIDY inverts this into daylight — near-white, soft window light, real cast shadows — but keeps the same discipline.

### What should never be copied

- **Spectacle for its own sake.** Scarab's screen-filling particle bloom is beautiful and would be actively hostile in a clinical tool — it obliterates readability for two seconds. We are not competing for a scroll-stopping reel.
- **Illegible micro-type.** igloo.inc's 9px edge labels are gorgeous and unusable for a tired oncologist at 2am.
- **Scroll-jacking.** Several of these hijack scroll velocity. A doctor scanning a timeline must never lose control of the scrollbar.
- **Mystery navigation.** These sites make you hunt. Ours may never.

### What should be adapted

Restraint. Rationing. Depth via occlusion. One object. Atmosphere as a material. Transformation over transition.

---

## Part 3 — The identity problem, stated honestly

**The test: if every word of text vanished, would anyone recognise this product?**

Today: **no.** Remove the text and you have dark rounded rectangles in a column. That is the generic thing — indistinguishable from a thousand dashboards.

But we are sitting on the answer and have been treating it as a widget:

> **A lit human body, alone in the dark, with a single organ glowing.**

Nothing else in medicine looks like that. It is instantly ours. And we have already built it — we just put it in a card in the right-hand column of a two-column grid.

### The signature idea

Our safety rules say severity is the only thing colour may mean. I have been treating that as a constraint to work around. It is actually the strongest art direction available to us:

> **Colour means disease. A healthy body is monochrome. The only saturated thing on the screen is a finding.**

This is memorable, defensible, ownable, and clinically honest at the same time. It makes the design language and the safety invariant the same rule. An oncologist opening a patient sees, pre-cognitively, *where the problem is* — before reading a word. A patient with nothing wrong sees a calm, colourless, whole body.

That is the product's identity. Everything below serves it.

---

## Part 4 — Art direction, screen by screen

### 4.1 Entry (Depth 0)

**Emotional objective.** Gravity, then relief. This is a cancer platform; the first beat must not be cheerful. It should feel like a held breath, then resolution.

**Story.** A body appears out of darkness. The word CANCER is struck through. The body remains.

**Focal point.** The wordmark first (~1.2s), then the body behind it resolves and takes over.

**What already works.** The CANCER wordmark with the point-field rendered *over* it in `screen` blend is genuinely good and is the one place this app already has identity. Screen-blend can only add light, so depth costs nothing in legibility. **Keep this. Build on it.**

**What is missing.** The figure behind the word is currently a sparse dust of points that never reads as a body. It should resolve — from scattered particles into a recognisable human silhouette — and the word should sit *inside* it, occluded by the near shoulder.

**Motion philosophy.** One move. The camera pulls back from the word to reveal the body. Nothing else animates.

**What they remember.** A human figure assembling out of darkness behind a struck-through word.

---

### 4.2 Sign-in

**Emotional objective.** Being admitted, not authenticated.

**Story.** The body turns to face you. You choose which side of it you stand on — patient or clinician.

**Composition.** The body stays where the Entry left it. The two role choices are not cards — they are two positions in the same space. Choosing one moves the camera, it does not replace the screen.

**Hover philosophy.** Hovering "I'm a patient" warms the body's light very slightly. Hovering "I'm a doctor" reveals the organs faintly through the skin. The choice is previewed on the object itself, before it is made.

**Click philosophy.** The panel does not slide in. The camera settles, and the credential field is already there — the space changed, not the page.

**What must not happen.** The email field must never be hard to find, never below the fold, never animated in after a delay. Sign-in is a task.

---

### 4.3 Practice Space (the oncologist's home)

**This screen is currently the worst offender and needs the biggest rethink.**

**Emotional objective.** Command. Calm. "I can see my whole practice."

**The current failure.** Patients are a list on the left; the body is a card on the right. The body is decoration and the list is a CRM.

**The proposal.** Invert it. The body is the screen. Patients are arranged *around* it, and each patient's row carries the colour of their own worst finding — so the roster reads as a field of severity before it reads as names. Selecting a patient does not navigate; the demo body *becomes* that patient's body, and their findings light up on it.

**Visual hierarchy.** (1) Anything red. (2) The body. (3) Names. (4) Everything else.

**What stays still.** The body's position. It is the anchor; if it moves between screens the user loses the thread.

**Empty state philosophy.** An empty practice is not an error and should not apologise. A calm, colourless, whole body, and one line: nothing here is invented. It is honest *and* it teaches the colour language before there is any disease to show.

---

### 4.4 Patient Space + the Body

**Emotional objective.** For the doctor: precision. For the patient: being told the truth, kindly.

**Signature moment — the organ click.** This is the single most important interaction in the product and is currently a colour change. It should be: the camera moves to the organ, the rest of the body fades toward transparency, the organ holds its severity colour and becomes the only lit thing in the frame, and its evidence arrives beside it. One continuous move, ~600ms.

**Scroll philosophy.** Scrolling the Journey moves the body through *time*, not down the page. Findings appear and resolve on the body as the date changes. Scroll is a timeline scrubber attached to an anatomy. This is the "transformation, not translation" lesson from igloo.inc, and here it is clinically meaningful rather than decorative.

**Camera behaviour.** Damped, always settling, never springy. Zoom follows the cursor (done). No auto-rotation ever — a body that spins on its own is a toy.

---

## Part 5 — Moments, not screens

Ranked by how much they define the product.

| # | Moment | Today | Should be |
|---|---|---|---|
| 1 | **An organ is clicked** | Colour change | Camera settles on it, body dissolves around it, evidence arrives |
| 2 | **A doctor opens a patient** | Route change | The body *becomes* that person; their findings light up |
| 3 | **First 5 seconds** | Wordmark + dust | A body assembles out of darkness behind a struck word |
| 4 | **A finding is recorded** | A row appears | Light appears on the body, where it is |
| 5 | **Signing in** | A form | The body turns to face you |
| 6 | **Moving through time** | A date control | The body changes as the date changes |

**Everything else is interface, and interface should get out of the way.**

---

## Part 6 — The rules that govern all of it

1. **Colour = disease.** Nothing else on screen may be saturated. Not buttons, not links, not charts.
2. **One object.** The body is the subject of every space it appears in. It is never a card.
3. **The object is nearer than the type.** Depth comes from occlusion, not shadow.
4. **Atmosphere, not background.** Depth haze and falloff, never a flat fill behind a floating card.
5. **Transformation over transition.** Prefer changing the object over moving the page.
6. **Stillness is a decision.** Only what is alive moves: the breath, the heart, arriving light. Layout never drifts.
7. **Clarity outranks everything above.** Any rule here loses to a doctor finding something faster.

---

## Part 7 — Roadmap

**Phase A — Establish the language (no new features)**
1. Strip saturation from everything that is not a finding. This alone will change the product's character more than any animation.
2. Replace flat panel backgrounds with atmospheric falloff around the body.
3. Type system: one display line per screen, everything else small, quiet, peripheral.

**Phase B — The signature moment**
4. Rebuild organ selection as the camera-settle + body-dissolve + evidence-arrival sequence.

**Phase C — Restage the spaces**
5. Practice Space around the body rather than beside it; patient rows carry their own severity.
6. Patient selection as a body-to-body transformation.

**Phase D — Entry and sign-in as one continuous scene**
7. Figure resolves out of darkness behind the wordmark; role choice previewed on the body; camera settles into credentials.

**Phase E — Time**
8. Journey scroll drives the body through time.

Phase A is deliberately first: it is the cheapest, changes perception the most, and is almost entirely subtraction.

---

## Part 8 — Open questions for the product owner

1. **Is "colour only where there is disease" the identity we commit to?** Everything above depends on it. It means buttons, links and charts all go monochrome.
2. **Light theme:** should it be TIDY-style daylight — near-white, soft window light, real cast shadows — or a plain light mode? Daylight is better but is a second full art direction.
3. **Sound.** A single low sub-bass note when a finding lights up would be extraordinarily effective and is also a real risk in a shared clinical setting. My recommendation: build it, default it off.
