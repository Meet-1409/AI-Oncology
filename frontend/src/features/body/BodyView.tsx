import { Component, Suspense, lazy, useCallback, useMemo, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Columns2, Maximize2, Minimize2, RotateCcw, Boxes } from 'lucide-react'
import { Control, Icon, Surface, Text } from '@/components/primitives'
import {
  EmptyState,
  EvidenceList,
  PlainExplanation,
  SeverityIndicator,
  SeverityLegend,
} from '@/components/patterns'
import { detectRenderTier } from '@/lib/capability'
import type { RenderTier } from '@/lib/capability'
import { formatDate } from '@/lib/format'
import { severityMeaning } from '@/lib/status'
import { bodyFormFor } from './figure'
import type { BodyForm } from './figure'
import { cn } from '@/lib/utils'
import { BodyStructured } from './BodyStructured'
import { useBodyViewModel } from './use-body-view-model'
import type { BodySnapshot } from '@/data/contract/domain'

/**
 * The Body — the centrepiece of the application [00 §6.15].
 *
 * Composes the 3D scene, the structured equivalent, camera controls and the
 * evidence panel. It owns view state (selection, comparison, camera reset) and
 * never owns clinical state.
 *
 * The 3D bundle is loaded only when the scene will actually render, so devices
 * without WebGL never download three.js.
 */

const BodyScene = lazy(() => import('./BodyScene').then((m) => ({ default: m.BodyScene })))

/** A rendering failure falls back to the structured view, never a broken space [09.6 §20]. */
class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  override state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Digital Twin rendering failed', error, info)
    this.props.onError()
  }

  override render() {
    return this.state.failed ? null : this.props.children
  }
}

export interface BodyViewProps {
  snapshots: readonly BodySnapshot[]
  /**
   * Sex recorded for this patient, which selects the figure drawn.
   *
   * Passed as the raw record value rather than a resolved form, so that the one
   * place deciding what an unrecorded or non-binary value means is bodyFormFor()
   * — not each call site guessing separately.
   */
  gender?: string | undefined
  /** Clinical date currently displayed, from the URL. */
  date?: string | undefined
  /** Clinical date being compared against, when comparison is active. */
  compareDate?: string | undefined
  selectedOrgan: string | null
  onSelectOrgan: (organId: string | null) => void
  onCompareChange: (date: string | undefined) => void
  reportHref?: ((reportId: string) => string) | undefined
  className?: string
}

export function BodyView({
  snapshots,
  gender,
  date,
  compareDate,
  selectedOrgan,
  onSelectOrgan,
  onCompareChange,
  reportHref,
  className,
}: BodyViewProps) {
  const [tier, setTier] = useState<RenderTier>(() => detectRenderTier())
  const form: BodyForm = bodyFormFor(gender)
  const [resetSignal, setResetSignal] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  const model = useBodyViewModel(snapshots, { date, compareDate, form })
  const comparisonModel = useBodyViewModel(snapshots, { date: compareDate, form })

  const selected = selectedOrgan ? model.organAt(selectedOrgan) : undefined
  const showScene = tier !== 'none'

  const handleSceneError = useCallback(() => setTier('none'), [])
  const handleSelect = useCallback(
    (organId: string) => onSelectOrgan(selectedOrgan === organId ? null : organId),
    [onSelectOrgan, selectedOrgan],
  )

  const sceneReason = useMemo(() => {
    if (tier !== 'none') return undefined
    return 'The 3D view is unavailable on this device. All clinical information is shown below.'
  }, [tier])

  if (model.isEmpty) {
    return (
      <EmptyState
        icon={Boxes}
        title="No visualization available"
        description="A visualization appears once imaging or pathology reports establish disease location and severity."
        className={className}
      />
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Camera and comparison controls. Comparison controls appear only when
          comparison is possible [09.6 §4]. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {model.current && (
            <Text level="caption" tone="muted">
              {model.current.label} · {formatDate(model.current.date)}
            </Text>
          )}
        </div>

        <div className="flex items-center gap-2">
          {model.canCompare && (
            <Control
              size="sm"
              intent={compareDate ? 'primary' : 'secondary'}
              onClick={() =>
                onCompareChange(compareDate ? undefined : model.snapshots[0]?.date)
              }
              aria-pressed={Boolean(compareDate)}
            >
              <Icon icon={Columns2} size="xs" />
              Compare
            </Control>
          )}
          {showScene && (
            <>
              <Control
                size="icon"
                intent="secondary"
                onClick={() => setResetSignal((n) => n + 1)}
                aria-label="Reset camera"
                title="Reset camera"
              >
                <Icon icon={RotateCcw} size="xs" />
              </Control>
              <Control
                size="icon"
                intent="secondary"
                onClick={() => setFullscreen((v) => !v)}
                aria-label={fullscreen ? 'Exit full screen' : 'Enter full screen'}
                aria-pressed={fullscreen}
              >
                <Icon icon={fullscreen ? Minimize2 : Maximize2} size="xs" />
              </Control>
            </>
          )}
        </div>
      </div>

      {/* How to use it, before it is used.
          The Body is the one place in the application where the primary control
          is a 3D scene rather than a familiar widget, and nothing on screen
          announces that it can be turned or tapped. Patients and oncologists
          both arrive here without training [04 §28], so the instruction is
          stated plainly rather than left to be discovered. */}
      {showScene && (
        <Text level="secondary" tone="muted">
          Drag to turn the body. Scroll to zoom. Select any part to see what is
          known about it and which report that came from.
        </Text>
      )}

      {showScene && (
        <div className={cn('grid gap-4', compareDate && 'lg:grid-cols-2')}>
          {compareDate && comparisonModel.current && (
            <figure className="space-y-2">
              <figcaption>
                <Text level="micro" tone="subtle">
                  {comparisonModel.current.label} · {formatDate(comparisonModel.current.date)}
                </Text>
              </figcaption>
              <Surface
                elevation="sunken"
                radius="xl"
                className="relative overflow-hidden bg-[var(--body-volume)]"
                style={{ height: fullscreen ? '70vh' : 380 }}
              >
                <SceneBoundary onError={handleSceneError}>
                  <Suspense fallback={null}>
                    <BodyScene
                      model={comparisonModel}
                      selectedOrgan={selectedOrgan}
                      onSelectOrgan={handleSelect}
                      tier={tier}
                      form={form}
                      resetSignal={resetSignal}
                    />
                  </Suspense>
                </SceneBoundary>
              </Surface>
            </figure>
          )}

          <figure className="space-y-2">
            {compareDate && model.current && (
              <figcaption>
                <Text level="micro" tone="subtle">
                  {model.current.label} · {formatDate(model.current.date)}
                </Text>
              </figcaption>
            )}
            <Surface
              elevation="sunken"
              radius="xl"
              className="relative overflow-hidden bg-[var(--body-volume)]"
              style={{ height: fullscreen ? '70vh' : compareDate ? 380 : 460 }}
            >
              <SceneBoundary onError={handleSceneError}>
                <Suspense fallback={null}>
                  <BodyScene
                    model={model}
                    selectedOrgan={selectedOrgan}
                    onSelectOrgan={handleSelect}
                    tier={tier}
                    form={form}
                    resetSignal={resetSignal}
                  />
                </Suspense>
              </SceneBoundary>
            </Surface>
          </figure>
        </div>
      )}

      {/* Selected site detail and its evidence, revealed in place [09.6 §9]. */}
      {selected && (
        <Surface elevation="raised" radius="lg" border="subtle" inset="md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text level="subheading" tone="primary">
              {selected.label}
            </Text>
            <SeverityIndicator severity={selected.severity} />
          </div>
          {/* The short label beside it is clinical shorthand; this is the same
              fact in words anyone can read [04 §28]. */}
          <Text level="secondary" tone="body" className="mt-1.5">
            {severityMeaning(selected.severity)}
          </Text>
          {selected.note && (
            <Text level="secondary" tone="muted" className="mt-2">
              {selected.note}
            </Text>
          )}
          <div className="mt-4">
            <Text level="micro" tone="subtle" className="mb-2">
              Supporting evidence
            </Text>
            <EvidenceList
              items={selected.evidence ? [selected.evidence] : []}
              hrefFor={reportHref}
            />
          </div>
        </Surface>
      )}

      {/* The colour scale, explained on demand. Severity is never carried by
          colour alone [00 §16.2], but the labels beside each colour are clinical
          shorthand; this gives the whole scale in plain words to anyone who
          wants it, without pushing an explanation at readers who do not. */}
      <PlainExplanation summary="What the colours on the body mean">
        <SeverityLegend />
      </PlainExplanation>

      {/* The structured equivalent is always present, not only on failure — it is
          the accessible representation of the scene [00 §16.5]. */}
      <Surface elevation="raised" radius="lg" border="subtle" inset="md">
        <BodyStructured
          model={model}
          selectedOrgan={selectedOrgan}
          onSelectOrgan={handleSelect}
          reportHref={reportHref}
          reason={sceneReason}
        />
      </Surface>
    </div>
  )
}
