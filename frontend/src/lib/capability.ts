/**
 * Device and user-preference capability detection.
 *
 * Drives the 3D tiering in [blueprint 02 §4.2] and the reduced-motion handling
 * required by [00 §11.9]. Degradation reduces visual complexity only — clinical
 * meaning is never reduced [00 §13.6].
 */

export type RenderTier = 'full' | 'reduced' | 'none'

/**
 * WebGL2 availability. The baseline assumes it is present [decision D4], but a
 * missing or blocked context must still resolve to the non-3D equivalent rather
 * than a broken space [09.6 §20].
 */
export function detectWebGL2(): boolean {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2')
    if (!context) return false
    // Release immediately; this is a probe, not a live context.
    context.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Subscribe to reduced-motion changes so the setting applies without a reload. */
export function watchReducedMotion(onChange: (reduced: boolean) => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const query = window.matchMedia('(prefers-reduced-motion: reduce)')
  const handler = (event: MediaQueryListEvent) => onChange(event.matches)
  query.addEventListener('change', handler)
  return () => query.removeEventListener('change', handler)
}

/**
 * Conservative signals for a constrained device. Used only to *start* at a lower
 * tier; sustained frame-rate measurement during interaction is what actually
 * governs tier changes at runtime.
 */
function isConstrainedDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  const cores = navigator.hardwareConcurrency
  if (typeof cores === 'number' && cores > 0 && cores <= 4) return true
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (typeof memory === 'number' && memory > 0 && memory <= 4) return true
  return false
}

export function detectRenderTier(): RenderTier {
  if (!detectWebGL2()) return 'none'
  return isConstrainedDevice() ? 'reduced' : 'full'
}

/** Device pixel ratio clamped per tier to protect the frame budget. */
export function maxPixelRatio(tier: RenderTier): number {
  if (typeof window === 'undefined') return 1
  const actual = window.devicePixelRatio || 1
  if (tier === 'reduced') return Math.min(actual, 1)
  return Math.min(actual, 1.75)
}
