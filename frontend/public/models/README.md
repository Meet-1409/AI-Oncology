# Anatomical models

Drop model files here and the Body uses them automatically. Nothing in the code needs to change.

```
body-male.glb      the external body, skin surface only
body-female.glb
body-neutral.glb   (optional)
organs.glb         every organ, as separate named meshes
```

Nothing here is required. If a file is absent, `features/body/model.ts` falls back — the body to the figure generated in `figure.ts`, and each organ to its primitive in `anatomy.ts`. That fallback is load-bearing. The Body is the centrepiece of the application `[00 §6.15]`, and a missing asset must never leave a patient looking at an empty panel where their anatomy should be.

The fallback is **per organ**, so a partial atlas still shows a complete body. An atlas with a liver and lungs but no pancreas gives you a sculpted liver, sculpted lungs, and a primitive pancreas.

## Requirements

| | |
|---|---|
| **Format** | `.glb` or `.gltf`, **uncompressed geometry** |
| **Body content** | External body only — skin surface |
| **Organ content** | One mesh per organ, named for its organ id |
| **Pose** | Standing, arms clear of the torso |
| **Orientation** | Y up, facing +Z |
| **Scale / origin** | Anything. The loader normalises both. |
| **Size** | Under ~8 MB each. Fetched only when the Body is opened. |

**Uncompressed matters.** Draco and Meshopt need a decoder fetched separately at runtime — one more network request that can fail in front of a patient. Re-export without compression, or run `gltf-transform` to decompress.

**Keep the body and the organs in separate files.** Organs baked into the body mesh cannot be coloured by severity or selected individually, which is the entire function of this visualization.

**Different orientation?** Set `rotation` on the model's entry in `BODY_MODELS` in `features/body/model.ts`. Z-up exports — common from Blender and from medical scanners — need `[-Math.PI / 2, 0, 0]`. It is applied to the organ atlas too, so the two stay registered.

## Organ mesh names

Name each mesh for its organ id. Matching is forgiving about case, spaces, underscores, trailing numbers and `.001` suffixes — `Liver`, `liver_002` and `Liver.001` all resolve to `liver`.

```
brain          thyroid        left-lung      right-lung     heart
left-breast    right-breast   liver          stomach        pancreas
spleen         left-kidney    right-kidney   colon          bladder
prostate       lymph-nodes    bones
```

An organ split across several meshes (the colon usually is) is merged into one, so the whole organ takes a single severity colour. Two halves easing to the same colour at different rates would read as two separate findings.

## Registration — the part that matters

`body-*.glb` and `organs.glb` **must be exported from the same source atlas in the same coordinate space.**

The loader fits the *body* into the figure frame — feet at `y = -0.51`, crown at `y = 1.31`, centred on x and z, uniform scale — and then applies that exact same transform to the organs. Everything lands where the atlas author put it, relative to that body.

Export the two from different models and the organs will be confidently, plausibly wrong: a liver somewhere in the abdomen, just not the right part of it. Nothing on screen will look broken. That is far worse than an obvious failure, and it is the one mistake this directory can produce that the tests cannot catch for you.

Scaling is **uniform**, not per-axis. Stretching a body to fill the frame on each axis independently would put every organ in the wrong place relative to it.

After installing anything, run `npm run test:safety`.

## Licence — check before shipping

The model is displayed inside a clinical product. **That is commercial use.** Many anatomical models on Sketchfab, TurboSquid and CGTrader are licensed for personal or editorial use only, and a licence violation in a hospital-facing product is not a small problem.

Options that permit commercial use with attribution:

- **BodyParts3D** — CC-BY-SA, from Japan's Database Center for Life Science
- **Z-Anatomy** — CC-BY-SA, open-source anatomy atlas
- A model purchased with an explicit commercial licence

Record whichever is used, with its licence and source URL, in `ATTRIBUTIONS.md` at the repository root. CC-BY-SA also requires attribution to be visible to users — the Account space is the appropriate place.
