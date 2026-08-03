# The Body — implementation notes

Working notes for this subsystem that don't belong in inline comments because
they describe something *not yet built*, or *why a bigger idea was scoped
down*. Read `anatomy.ts`, `figure.ts` and `organ-shapes.ts` first — this file
doesn't repeat what's already explained there.

## Tumor geometry — planned, not implemented

Severity today colors the **organ itself** (`colorFor()` in `BodyScene.tsx`,
`severityScale` in `design/theme.ts`) — there is no separate tumor mesh
anywhere in this codebase, and that is deliberate for now, not an oversight.

The intended future shape, once the backend/AI pipeline can supply real tumor
geometry: an irregular mass built from **many overlapping spheres merged close
enough together that the union reads as one uneven shape** — a metaball /
implicit-surface blend (e.g. marching cubes over a sum of Gaussian or
inverse-square falloff fields centered on each sphere), not a single sphere
and not a hand-authored mesh. Real tumors are irregular and lobulated; a
single smooth primitive would misrepresent exactly the thing this
visualization exists to show accurately.

This is explicitly **backend/AI-driven work**: the sphere centers, radii and
count would come from segmentation data the AI pipeline produces from imaging,
the same way every other clinical value in this app is validated data rather
than something the frontend invents [00 §5.8]. Building the rendering
technique now, with no real data to drive it, would mean either fabricating
placeholder tumor shapes (which this codebase's own standards forbid — no
placeholder implementations, ever) or building an API surface for data that
doesn't exist yet and may need to change shape once it does.

**Do not implement this until there is a real data contract for it.** When
that contract exists, this is the place to start: the organ mesh a tumor sits
on already has a real silhouette (`organ-shapes.ts`), a stable local coordinate
frame, and a `severityScale`-driven material already proven not to conflict
with `organPalette`'s per-organ colors (`design/theme.ts`) — a tumor mesh
would be a sibling to the organ mesh in the same local frame, not a
replacement for it, so the organ's own healthy-tissue color remains visible
around the tumor exactly as it does clinically.
