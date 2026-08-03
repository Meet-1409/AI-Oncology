import { cn } from '@/lib/utils'

/**
 * Atmosphere — the Entry's lit environment.
 *
 * DOCUMENTED EXCEPTION [04 §14]. The Entry is "a cinematic introduction to the
 * system, not a traditional landing page" and must "feel premium". That requires
 * a presentation vocabulary the clinical Design System deliberately does not
 * have. These components are that vocabulary, and they are confined to Depth 0:
 * inside the application [04 §28] holds — usability is never sacrificed for
 * visual effect.
 *
 * All three pieces are decorative and carry no information, so every one is
 * aria-hidden and none is reachable by keyboard.
 */

/**
 * Film grain.
 *
 * A flat CSS gradient reads as a gradient. The same gradient under fine grain
 * reads as a lit surface, because real light through a real lens is never
 * perfectly smooth. This one texture does more for perceived quality than any
 * other single effect in the Entry.
 *
 * Generated as an inline SVG turbulence so it costs no network request and
 * cannot fail to load.
 */
export function Grain({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 z-[1]', className)}
      style={{
        opacity: 'var(--cinema-grain-opacity)',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'repeat',
        mixBlendMode: 'overlay',
      }}
    />
  )
}

/**
 * The light source.
 *
 * One soft pool of light behind the subject, and a vignette closing the frame.
 * Both reference compositions are built this way: a single source, everything
 * else falling away into darkness. It is what gives a flat screen depth.
 */
export function LightField({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn('pointer-events-none absolute inset-0', className)}>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 62% 52% at 50% 42%, var(--cinema-glow), transparent 72%)',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 92% 74% at 50% 50%, transparent 32%, var(--cinema-void) 100%)',
        }}
      />
    </div>
  )
}

/**
 * A hairline rule.
 *
 * The reference compositions divide space with a single pixel and nothing else —
 * no cards, no boxes. Space and one line do the grouping.
 */
export function Hairline({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('h-px w-full bg-[var(--cinema-line)]', className)}
    />
  )
}
