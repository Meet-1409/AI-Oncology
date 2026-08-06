# Attributions

Third-party assets shipped inside this product, and the terms they are used under.

---

## Anatomical models — Z-Anatomy

**Files:** `frontend/public/models/body-male.glb`, `body-neutral.glb`, `organs.glb`

**Source:** [Z-Anatomy](https://github.com/LluisV/Z-Anatomy) — an open-source 3D anatomy atlas, itself built on the anatomical work of BodyParts3D and the Z-Anatomy contributors.

**Licence:** [Creative Commons Attribution–ShareAlike 4.0 International (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/)

**What was taken.** Fourteen organ meshes (brain, thyroid, heart, both lungs, liver, stomach, pancreas, spleen, both kidneys, colon, bladder, prostate) and the external body surface, extracted from Z-Anatomy's `VisceralSystem`, `LymphoidOrgans`, `CardioVascular`, `NervousSystem` and `RegionsOfBody` FBX exports.

**What was changed.** Geometry only — no anatomy was re-sculpted or re-positioned. Source materials, textures and the internal scene hierarchy were dropped; each organ was flattened to a single world-space mesh and decimated (≈991k → ≈42k triangles total) so it can render in real time on a patient's own device. Non-anatomical helper geometry bundled in the source export (hair strands, eyelashes, viewer cross-section planes) was removed, along with degenerate sliver triangles at the seams between adjacent authored surface patches. The reproducible extraction pipeline is `frontend/tools/extract-organs.mjs` and `frontend/tools/extract-body.mjs`.

### ⚠ ShareAlike is a real obligation — read before shipping commercially

CC BY-SA 4.0 permits commercial use, but it is **copyleft**. Two conditions bind this product:

1. **Attribution must reach the user.** A licence file in the repository is not sufficient on its own — the credit above needs to be visible somewhere in the running application. The Account space is the intended place; **this is not yet implemented.**
2. **ShareAlike applies to the models and to adaptations of them.** The `.glb` files in `public/models/` and any future modification of them must be distributed under CC BY-SA 4.0. This does **not** virally relicense the application's own source code — the app *uses* the models, it is not an adaptation of them — but the boundary is worth confirming with counsel before a commercial release, because "the 3D model is the product's centrepiece" is exactly the kind of fact a licensor would argue on.

If either condition is unacceptable for the commercial licence this product ships under, the alternative is a purchased anatomical atlas with an explicit commercial licence. The loading path in `frontend/src/features/body/model.ts` is source-agnostic: replacing the files in `public/models/` is the entire swap.

---

## Fonts

**Inter** and **Bricolage Grotesque**, served via Google Fonts. Both are licensed under the [SIL Open Font License 1.1](https://openfontlicense.org/), which permits commercial embedding and redistribution.
