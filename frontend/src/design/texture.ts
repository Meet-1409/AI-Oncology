/**
 * The not-assessed hatch — defined once, consumed everywhere.
 *
 * WHY A TEXTURE AND NOT A COLOUR
 *
 * `colour means disease` still holds (BLUEPRINT 03 §7). What contract v2 adds is
 * that the ABSENCE of colour now has two meanings, and conflating them is the
 * most dangerous rendering mistake this product can make:
 *
 *   smooth, monochrome     assessed, and clear
 *   hatched, desaturated   never assessed
 *
 * An organ that was never imaged is not a healthy organ [CLAUDE.md rule 2]. A
 * second colour cannot carry that distinction — every saturated hue is spoken
 * for by severity, and a second grey would read as a lighting difference. So the
 * carrier is SURFACE rather than hue, which is also why it survives greyscale
 * printing and every form of colour blindness.
 *
 * WHY SCREEN SPACE
 *
 * The hatch is computed from `gl_FragCoord` in the 3D scene and from CSS pixels
 * in the DOM, which means the stripe has the same period in the WebGL canvas as
 * in the organ list beside it. A UV-space or world-space hatch would change
 * period with zoom and organ size, and the two surfaces would stop reading as
 * the same material.
 *
 * WHY THE NUMBERS ARE DUPLICATED IN tokens.css
 *
 * Same reason the severity scale is: a shader cannot read a CSS custom property
 * without a build step. `tools/check-architecture.mjs` asserts the two agree on
 * every build rather than trusting them to.
 */

/** Angle in degrees, stripe period and line width in CSS pixels. */
export const hatch = {
  angle: 45,
  period: 6,
  line: 2,
} as const

/**
 * The hatch as a GLSL helper, for the Body's organ material.
 *
 * Returns 1 inside a stripe and 0 between them, with a half-pixel smoothstep so
 * the edges do not crawl as the camera moves.
 */
export const HATCH_GLSL = /* glsl */ `
  float aoHatch(vec2 fragCoord) {
    float a = radians(${hatch.angle}.0);
    float d = fragCoord.x * cos(a) + fragCoord.y * sin(a);
    float m = mod(d, ${hatch.period}.0);
    return 1.0 - smoothstep(${hatch.line}.0 - 0.5, ${hatch.line}.0 + 0.5, m);
  }
`

/**
 * The hatch as a CSS background, for the organ list and the legend.
 *
 * `repeating-linear-gradient` with hard stops rather than a gradient — this is a
 * texture, not a fade, and a soft edge at 6px reads as blur.
 */
export function hatchBackground(color: string): string {
  return (
    `repeating-linear-gradient(${hatch.angle}deg, ` +
    `${color} 0, ${color} ${hatch.line}px, ` +
    `transparent ${hatch.line}px, transparent ${hatch.period}px)`
  )
}
