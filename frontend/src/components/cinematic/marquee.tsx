import { cn } from '@/lib/utils'

/**
 * The drifting strip — the Entry only [04 §14].
 *
 * A slow horizontal band of short phrases. It appears in both reference
 * compositions and it does something specific: it establishes a horizontal axis
 * beneath a vertical stack, which keeps a full-bleed hero from reading as a
 * single static image.
 *
 * The strip is aria-hidden and every phrase in it also appears as real content
 * further down the Entry, so nothing is communicated by motion alone [00 §16.2]
 * and a screen reader loses nothing. Under reduced motion it holds still and
 * simply reads as a row of phrases.
 */
export function Marquee({ items, className }: { items: readonly string[]; className?: string }) {
  // Rendered twice, end to end, so translating by exactly -50% returns the strip
  // to its starting position and the loop has no visible seam.
  const track = [...items, ...items]

  return (
    <div
      aria-hidden
      className={cn(
        'relative flex w-full overflow-hidden border-y border-[var(--cinema-line)] py-3.5',
        className,
      )}
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
      }}
    >
      <div className="cinema-marquee flex w-max shrink-0 items-center">
        {track.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center">
            <span className="whitespace-nowrap px-7 text-edge uppercase text-[var(--cinema-ink)]/55">
              {item}
            </span>
            <span className="size-1 rounded-full bg-[var(--cinema-line-strong)]" />
          </span>
        ))}
      </div>
    </div>
  )
}
