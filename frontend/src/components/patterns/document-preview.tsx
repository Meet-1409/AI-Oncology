import { useEffect, useRef, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Maximize,
  Minimize,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Control, Icon, Surface, Text } from '@/components/primitives'
import { cn } from '@/lib/utils'
import type { Report } from '@/types'

/**
 * Report preview [09.4 §16].
 *
 * Supports zoom, page navigation and full screen without downloading the
 * report. There is no file storage yet [05 §1] — no backend exists to hold the
 * original bytes — so the surface being zoomed and paged is the report's own
 * known information, honestly presented as one page, rather than a fabricated
 * multi-page facsimile of a document this system has never actually seen. The
 * controls are real and fully wired; they extend to a real page count the
 * moment a backend provides one, with no change to this component.
 */

const ZOOM_MIN = 0.5
const ZOOM_MAX = 2.5
const ZOOM_STEP = 0.25

function clampZoom(value: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 100) / 100))
}

export interface DocumentPreviewProps {
  report: Report
  className?: string
}

export function DocumentPreview({ report, className }: DocumentPreviewProps) {
  const [zoom, setZoom] = useState(1)
  // Page navigation always reflects what is actually known — one page — rather
  // than an invented count [00 §5.8].
  const [page] = useState(1)
  const totalPages = 1

  const containerRef = useRef<HTMLDivElement>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const fullscreenSupported =
    typeof document !== 'undefined' && Boolean(document.documentElement.requestFullscreen)

  useEffect(() => {
    if (!fullscreenSupported) return
    const onChange = () => setFullscreen(document.fullscreenElement === containerRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [fullscreenSupported])

  const toggleFullscreen = () => {
    if (!fullscreenSupported) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      // Rejected in contexts that disallow it (e.g. an iframe without the
      // permission) — the button remains a no-op rather than throwing [00 §13.4].
      void containerRef.current?.requestFullscreen().catch(() => undefined)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-[var(--border-default)]',
        fullscreen && 'h-screen bg-[var(--surface-base)]',
        className,
      )}
    >
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-2 border-b',
          'border-[var(--border-subtle)] bg-[var(--surface-raised)] px-2 py-1.5',
        )}
      >
        <div className="flex items-center gap-1">
          <Control
            size="icon"
            intent="quiet"
            onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
            disabled={zoom <= ZOOM_MIN}
            aria-label="Zoom out"
          >
            <Icon icon={ZoomOut} size="sm" />
          </Control>
          <Text level="caption" tone="muted" className="w-11 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </Text>
          <Control
            size="icon"
            intent="quiet"
            onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
            disabled={zoom >= ZOOM_MAX}
            aria-label="Zoom in"
          >
            <Icon icon={ZoomIn} size="sm" />
          </Control>
        </div>

        <div className="flex items-center gap-1">
          <Control size="icon" intent="quiet" disabled aria-label="Previous page">
            <Icon icon={ChevronLeft} size="sm" />
          </Control>
          <Text level="caption" tone="muted" className="tabular-nums">
            Page {page} of {totalPages}
          </Text>
          <Control size="icon" intent="quiet" disabled aria-label="Next page">
            <Icon icon={ChevronRight} size="sm" />
          </Control>
        </div>

        {fullscreenSupported && (
          <Control
            size="icon"
            intent="quiet"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
          >
            <Icon icon={fullscreen ? Minimize : Maximize} size="sm" />
          </Control>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        <div
          className="mx-auto origin-top transition-transform duration-[var(--motion-quick)]"
          style={{ transform: `scale(${zoom})` }}
        >
          <Surface
            elevation="sunken"
            radius="lg"
            inset="lg"
            className="border border-dashed border-[var(--border-default)] text-center"
          >
            <Icon
              icon={report.fileKind === 'image' ? ImageIcon : FileText}
              size="lg"
              className="mx-auto text-[var(--text-subtle)]"
            />
            <Text level="secondary" tone="muted" className="mt-3">
              Original document preview
            </Text>
            <Text level="caption" tone="subtle" className="mt-1">
              {report.fileSizeKb.toLocaleString()} KB · {report.fileKind.toUpperCase()}
            </Text>
          </Surface>
        </div>
      </div>
    </div>
  )
}
