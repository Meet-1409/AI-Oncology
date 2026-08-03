# 03 — Design Language, Color, Typography, Spacing

**Covers blueprint topics 7, 8, 9, 10.**

Everything here resolves to tokens. Components consume tokens; they never hard-code values. This is the mechanism behind "the design language must remain consistent across the entire environment" `[00 §10.16]`.

---

## 1. Design language (topic 7)

### 1.1 Character

Premium, modern, elegant, confident, minimal, medical, professional `[04 §2]`. Never flashy, childish or game-like `[00 §10.17]`.

The most useful way to hold this: **the interface behaves like a precision instrument.** Instruments are quiet, unambiguous, responsive, and they never draw attention to themselves at the expense of what they measure.

### 1.2 The five commitments

1. **Content leads, chrome recedes.** Clinical information is the brightest, largest, most present thing on screen. Controls are quiet until approached.
2. **Continuous surfaces over boxes.** Grids of cards are prohibited `[04 §10]`. Discrete panels appear only for genuine comparison — two clinical dates, two reports. Grouping is achieved with space and typography, not borders.
3. **Depth over decoration.** Hierarchy is expressed through layering, elevation and parallax `[00 §12.4]`, not ornament. No gradients-as-decoration, no glow, no texture.
4. **Progressive revelation.** Detail appears on approach `[04 §10]`. Distant periods on the Journey show only significant events; approaching reveals detail. This is what keeps density high without overwhelming `[00 §10.10]`.
5. **Restraint as trust signal.** In a clinical product, visual excess reads as unseriousness. Confidence is communicated by what is left out.

### 1.3 Elevation model

Four levels only, matching the four depth levels — so elevation and depth mean the same thing everywhere:

| Level | Use | Treatment |
|---|---|---|
| `base` | the space you are in | no shadow |
| `raised` | objects that can be entered | minimal shadow, lifts on approach |
| `focus` | Focus layer above a preserved parent | pronounced shadow, parent dims and recedes |
| `overlay` | Intent Bar, Signals, transient system surfaces | strongest separation |

---

## 2. Color system (topic 8)

### 2.1 Principles

Neutrals dominate `[04 §9]`. Accent highlights only important actions. Colour is **never** the sole carrier of meaning `[00 §16.2]` — every colour-coded state also carries text.

### 2.2 Palette structure

**Neutrals (dominant).** A 13-step ramp from near-white to near-black. Carries all surfaces, text and structure. Deliberately slightly cool to sit correctly beside clinical imagery without tinting it.

**Brand (restrained).** A single desaturated clinical blue-teal ramp, 11 steps. Used for primary action, current-state indication and focus rings. Never used decoratively — if brand colour appears, something is actionable or active.

**Semantic.** Fixed by the documentation `[04 §9]`: error = red, warning = amber, success = green, information = blue. Each provides surface / border / foreground variants so contrast is guaranteed in every context.

**Severity (the clinically critical scale).** Five steps, light → dark red, encoding lower → higher severity `[00 §6.7]`.

| Step | Meaning |
|---|---|
| 1 | Minimal |
| 2 | Mild |
| 3 | Moderate |
| 4 | Significant |
| 5 | Severe |

Plus a distinct **no-involvement** value that is clearly *not* on the red scale, so healthy organs remain visually distinguishable `[09.6 §7]`.

### 2.3 Two hard engineering rules

**Rule 1 — Severity values must be literal colours, never CSS variables.**
The severity scale is consumed by both CSS and three.js. `three.Color` cannot parse `var(--x)`; it silently yields white. A previous implementation shipped exactly this bug and rendered every diseased organ white — the disease visualization appeared to work while showing nothing. Severity tokens are therefore defined as literal values, with the CSS custom properties derived from the same source. Guarded by a test (doc 05 §5).

**Rule 2 — Severity red is reserved.**
The red severity ramp is used *only* for disease severity. Error red is a separate, visually distinct red. If the two were interchangeable, a validation error would read as a clinical finding.

### 2.4 Contrast

WCAG AA minimum: 4.5:1 body text, 3:1 large text and meaningful non-text `[00 §16.3]`. Severity swatches are non-text meaningful content and must meet 3:1 against their surface — which constrains how light severity step 1 may be, and is why the scale starts where it does.

### 2.5 Theme

Light is primary. Dark is offered as a preference `[09.10 §8]`. All colour flows through semantic tokens (`surface.base`, `text.primary`, `severity.3`) rather than raw values, so a theme is a token remap with no component changes.

---

## 3. Typography system (topic 9)

### 3.1 Family

**One family throughout** `[04 §8]`. A humanist sans with: true tabular figures (clinical values must align in comparison), a large weight range, excellent small-size legibility, and unambiguous `1/l/I` and `0/O` — misreading a dose or a measurement is a clinical risk, not an aesthetic one.

Numerals default to **tabular** wherever clinical values appear.

### 3.2 Scale

A restrained ramp — hierarchy comes from weight and space as much as size `[04 §8]`.

| Token | Use |
|---|---|
| `display` | Entry statement only |
| `title` | space title |
| `heading` | section within a space |
| `subheading` | grouping |
| `body` | default reading size |
| `secondary` | supporting detail |
| `caption` | metadata, timestamps |
| `micro` | labels; never for clinical values |

Clinical values never render below `body`.

### 3.3 Rules

- Line length capped for reading comfort; long paragraphs avoided `[04 §8]`.
- Line height loosens as size decreases.
- Weight, not colour, is the primary emphasis mechanism.
- **Text is never rendered in perspective** where legibility suffers `[00 §12.7]`. Labels in the 3D scene are billboarded 2D overlays, not meshes.
- Respects user font-size preference; no absolute `px` root sizing.

---

## 4. Spacing system (topic 10)

### 4.1 Base

4px base unit; the ramp is `0.5 · 1 · 1.5 · 2 · 3 · 4 · 6 · 8 · 12 · 16 · 24` × base. One scale for margin, padding and gap.

### 4.2 Negative space is a design element

Stated explicitly in the docs `[04 §10]` and treated as a real constraint: spacing is not compressed to fit more content. When a space becomes crowded, the answer is progressive disclosure, not tighter spacing.

### 4.3 Rhythm

- Related items: one step apart. Distinct groups: three steps or more. Separation is spatial before it is a border.
- Grouping strength: **space → weight → surface elevation → border**, in that order. Borders are the last resort, which is what prevents the interface drifting back toward boxes `[04 §10]`.
- Vertical rhythm is consistent across spaces so movement between them feels continuous `[04 §27]`.

### 4.4 Density

One density. No compact mode — a second density doubles the visual QA surface and risks clinical text falling below comfortable reading size, against `[00 §10.12]`.

### 4.5 Touch targets

Minimum 44×44 CSS px for any interactive element, including organ selection affordances in the structured renderer. Tablet must remain fully functional `[04 §24]`.

---

## 5. The cinematic layer (Entry only)

### 5.1 Why a second vocabulary exists

The documentation asks for two things that cannot be satisfied by one visual system.

`[04 §14]` requires the Entry to be "a cinematic introduction to the system, not a traditional landing page" — memorable, premium, and creating curiosity. `[04 §28]` requires that inside the application "usability is never sacrificed for visual effect" and that "every space should be understandable without training".

A single system tuned to satisfy both would be a compromise at each end: an Entry too restrained to be memorable, and clinical spaces carrying decoration a working oncologist has to look past. So there are two, and the boundary between them is explicit.

### 5.2 What the cinematic layer contains

Living in `src/components/cinematic/`, used only at Depth 0:

| Component | Purpose |
|---|---|
| `Grain` | Fine SVG turbulence over the frame. Breaks flat gradients so a surface reads as lit rather than as CSS. |
| `LightField` | One soft pool of light plus a vignette — a single source in darkness. |
| `Rise` / `Settle` | Layered reveals. Content arrives in beats, in the order the composition should be read, rather than fading in as a block. |
| `Marquee` | A slow horizontal strip establishing an axis beneath the vertical stack. |
| `CinematicAction` / `CinematicJump` | Fully-rounded actions ending in a disc the arrow travels across. |
| `EdgeLabel` / `Ordinal` / `Hairline` | The quiet half of the type contrast, and grouping by one line instead of a box. |

Its own tokens: `--cinema-void`, `--cinema-ink`, `--cinema-veil`, `--cinema-glow`, `--cinema-line`, `--cinema-grain-opacity`, the `--cinema-settle / draw / withdraw` durations, and the `--text-edge` step.

### 5.3 The composition rule

The Entry is built on **depth, not stacking**. The point field renders *above* the wordmark in `mix-blend-mode: screen`, so the word sits inside the figure rather than in front of a backdrop. Screen blending can only add light, so it is arithmetically incapable of reducing the text's contrast: the depth is real and costs nothing in legibility.

This one decision does more for perceived quality than any quantity of additional animation, which is why it is recorded here rather than left as an implementation detail.

### 5.4 Boundaries

- **Motion.** The application envelope stops at 380ms because a clinician waiting on information must never wait on an animation. The cinematic envelope runs to 1700ms, permitted only where no clinical information exists.
- **Reduced motion.** Both envelopes collapse to 0ms. The Entry's composition — statement, figure, layering — survives intact; only the time spent arriving at it is removed `[00 §11.9]`.
- **Enforcement.** `tools/check-architecture.mjs` fails the build if anything outside `src/spaces/entry` imports from the cinematic layer. The exception is `src/dev/showcase`, which documents the design system and is stripped from production builds.

---

## 6. Plain language (everywhere)

`[04 §28]` requires every space to be understandable without training, and `[01]` requires the product to be "immediately understandable without training". The users are patients and oncologists; a patient may be reading their own cancer record for the first time.

Three components in `components/patterns/orientation.tsx` carry this:

- **`Orientation`** — one plain sentence at the top of a space saying what it shows and what to do with it. The cheapest intervention available with the largest effect on comprehension.
- **`PlainExplanation`** — a collapsed disclosure for concepts that need more than a sentence. Always available, never competing with clinical content.
- **`SeverityLegend`** — the whole severity scale as swatch, clinical label and plain sentence, marked up as a definition list.

### 6.1 What plain language may and may not say

`severityMeaning()` in `lib/status.ts` describes **position on a documented scale and nothing more**. It does not estimate size, spread or outlook. Doing so would be the interface inventing a clinical claim the underlying data never made, which `[00 §5]` forbids — and it would be most dangerous precisely where it would be most reassuring.

Guarded by a patient-safety test: every level must carry a distinct plain sentence, of at least four words, that is not merely a repeat of the clinical label.
