import { Component, Suspense, lazy, useCallback, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Boxes } from 'lucide-react'
import { Icon, Text } from '@/components/primitives'
import { detectRenderTier } from '@/lib/capability'
import type { RenderTier } from '@/lib/capability'
import { Reveal } from '@/components/motion'
import { useBodyViewModel } from './use-body-view-model'
import { cn } from '@/lib/utils'

/**
 * A demo Digital Twin — decorative, not a patient's record.
 *
 * Shown before any patient is open [09.2 §1], so it must never resemble real
 * clinical data. Built from an empty snapshot list, which gives every organ a
 * real, defined, healthy (severity 0) state rather than an invented one
 * [00 §5.8] — nothing here is a guess at what a patient's data might look
 * like, it is what "no findings recorded" actually renders as.
 *
 * Shares BodyScene with the real Body view so a visual change to one changes
 * both, but owns no selection or clinical wiring — turning it is the entire
 * interaction.
 */

const BodyScene = lazy(() => import('./BodyScene').then((m) => ({ default: m.BodyScene })))

class SceneBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  override state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Demo Digital Twin rendering failed', error, info)
    this.props.onError()
  }

  override render() {
    return this.state.failed ? null : this.props.children
  }
}

export function DemoBodyPreview({ className }: { className?: string }) {
  const [tier, setTier] = useState<RenderTier>(() => detectRenderTier())
  const model = useBodyViewModel([], { form: 'neutral' })
  const handleError = useCallback(() => setTier('none'), [])

  if (tier === 'none') {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-2 text-center', className)}>
        <Icon icon={Boxes} size="lg" className="text-[var(--text-subtle)]" />
        <Text level="caption" tone="muted">
          The 3D preview is unavailable on this device.
        </Text>
      </div>
    )
  }

  return (
    <div className={className}>
      <SceneBoundary onError={handleError}>
        <Suspense fallback={null}>
          <Reveal className="h-full w-full">
            <BodyScene
              model={model}
              selectedOrgan={null}
              onSelectOrgan={() => {}}
              tier={tier}
              form="neutral"
              resetSignal={0}
              framing="figure"
            />
          </Reveal>
        </Suspense>
      </SceneBoundary>
    </div>
  )
}
