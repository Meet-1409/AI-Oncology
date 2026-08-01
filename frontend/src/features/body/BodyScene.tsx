import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { ReactNode } from 'react'
import { anatomyPalette, cameraDamping, severityScale } from '@/design/theme'
import { maxPixelRatio } from '@/lib/capability'
import type { RenderTier } from '@/lib/capability'
import { useReducedMotion } from '@/components/motion'
import { BONES, LYMPH_NODES, ORGANS } from './anatomy'
import type { OrganDefinition } from './anatomy'
import type { BodyViewModel } from './use-body-view-model'
import type { SeverityLevel } from '@/lib/status'

/**
 * The Body — 3D scene.
 *
 * Renders anatomy from the view-model only. It holds camera state and nothing
 * else; it cannot write clinical state, which is how "camera movement must never
 * change medical information" [00 §6.12] is structurally guaranteed rather than
 * merely intended.
 *
 * Severity colour transitions between clinical dates rather than switching
 * instantly [09.6 §16], so the eye is drawn to what changed. Under reduced motion
 * the colour is applied immediately.
 */

/** A mesh whose colour eases toward the severity for the current moment. */
function AnimatedPart({
  geometry,
  position,
  rotation,
  scale,
  color,
  selected,
  roughness = 0.55,
  onSelect,
  label,
}: {
  geometry: ReactNode
  position: readonly [number, number, number]
  rotation?: readonly [number, number, number]
  scale?: readonly [number, number, number]
  color: string
  selected: boolean
  roughness?: number
  onSelect?: (() => void) | undefined
  label?: string
}) {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const reduced = useReducedMotion()

  const target = useMemo(() => new THREE.Color(color), [color])
  const emissive = useMemo(
    () => (selected ? new THREE.Color(color) : new THREE.Color('#000000')),
    [selected, color],
  )

  // Apply the initial colour without a transition, so there is no flash of the
  // default material on mount.
  useEffect(() => {
    material.current?.color.set(target)
  }, [])

  useFrame((_, delta) => {
    const mat = material.current
    if (!mat) return
    if (reduced) {
      mat.color.set(target)
      mat.emissive.set(emissive)
      mat.emissiveIntensity = selected ? 0.4 : 0
      return
    }
    const t = Math.min(1, delta * cameraDamping.severityLerp)
    mat.color.lerp(target, t)
    mat.emissive.lerp(emissive, t)
    mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, selected ? 0.4 : 0, t)
  })

  return (
    <mesh
      position={position as [number, number, number]}
      rotation={(rotation ?? [0, 0, 0]) as [number, number, number]}
      scale={(scale ?? [1, 1, 1]) as [number, number, number]}
      onClick={
        onSelect
          ? (event) => {
              event.stopPropagation()
              onSelect()
            }
          : undefined
      }
      onPointerOver={(event) => {
        if (!onSelect) return
        event.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
      userData={{ label }}
    >
      {geometry}
      <meshStandardMaterial ref={material} roughness={roughness} metalness={0.04} />
    </mesh>
  )
}

function organGeometry(organ: OrganDefinition): ReactNode {
  const args = organ.args as number[]
  switch (organ.shape) {
    case 'sphere':
      return <sphereGeometry args={args as [number, number, number]} />
    case 'capsule':
      return <capsuleGeometry args={args as [number, number, number, number]} />
    case 'box':
      return <boxGeometry args={args as [number, number, number]} />
    case 'torus':
      return <torusGeometry args={args as [number, number, number, number]} />
  }
}

/** The body silhouette. Translucent, so internal anatomy reads clearly. */
function BodyShell({ tier }: { tier: RenderTier }) {
  const segments = tier === 'reduced' ? 8 : 14
  const skin = (
    <meshStandardMaterial
      color={anatomyPalette.skin}
      transparent
      opacity={0.15}
      roughness={1}
      depthWrite={false}
    />
  )

  return (
    <group>
      <mesh position={[0, 1.18, 0]}>
        <sphereGeometry args={[0.135, segments + 6, segments + 6]} />
        {skin}
      </mesh>
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.045, 0.05, 0.13, segments]} />
        {skin}
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <capsuleGeometry args={[0.195, 0.32, 3, segments]} />
        {skin}
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <capsuleGeometry args={[0.17, 0.24, 3, segments]} />
        {skin}
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <capsuleGeometry args={[0.155, 0.1, 3, segments]} />
        {skin}
      </mesh>
      {[-1, 1].map((side) => (
        <group key={`limb-${side}`}>
          <mesh position={[0.245 * side, 0.66, 0]} rotation={[0, 0, side * 0.06]}>
            <capsuleGeometry args={[0.052, 0.34, 3, segments - 4]} />
            {skin}
          </mesh>
          <mesh position={[0.27 * side, 0.28, 0]}>
            <capsuleGeometry args={[0.042, 0.32, 3, segments - 4]} />
            {skin}
          </mesh>
          <mesh position={[0.09 * side, -0.16, 0]}>
            <capsuleGeometry args={[0.075, 0.36, 3, segments - 4]} />
            {skin}
          </mesh>
          <mesh position={[0.09 * side, -0.58, 0]}>
            <capsuleGeometry args={[0.058, 0.34, 3, segments - 4]} />
            {skin}
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Anatomy({
  model,
  selectedOrgan,
  onSelectOrgan,
  tier,
}: {
  model: BodyViewModel
  selectedOrgan: string | null
  onSelectOrgan: (organId: string) => void
  tier: RenderTier
}) {
  const colorFor = (severity: SeverityLevel, fallback: string) =>
    severity > 0 ? severityScale[severity] : fallback

  const bones = model.organAt('bones')
  const lymph = model.organAt('lymph-nodes')

  return (
    <group position={[0, -0.1, 0]}>
      <BodyShell tier={tier} />

      {BONES.map((bone) => (
        <AnimatedPart
          key={bone.key}
          geometry={<cylinderGeometry args={bone.args as [number, number, number, number]} />}
          position={bone.position}
          color={colorFor(bones?.severity ?? 0, anatomyPalette.bone)}
          selected={selectedOrgan === 'bones'}
          roughness={0.7}
          onSelect={() => onSelectOrgan('bones')}
          label="Bones"
        />
      ))}

      {LYMPH_NODES.map((position, index) => (
        <AnimatedPart
          key={`lymph-${index}`}
          geometry={<sphereGeometry args={[0.017, 8, 8]} />}
          position={position}
          color={colorFor(lymph?.severity ?? 0, anatomyPalette.lymph)}
          selected={selectedOrgan === 'lymph-nodes'}
          onSelect={() => onSelectOrgan('lymph-nodes')}
          label="Lymph Nodes"
        />
      ))}

      {ORGANS.map((organ) => {
        const state = model.organAt(organ.id)
        return (
          <AnimatedPart
            key={organ.id}
            geometry={organGeometry(organ)}
            position={organ.position}
            rotation={organ.rotation}
            scale={organ.scale}
            color={colorFor(state?.severity ?? 0, anatomyPalette.organ)}
            selected={selectedOrgan === organ.id}
            onSelect={() => onSelectOrgan(organ.id)}
            label={organ.label}
          />
        )
      })}
    </group>
  )
}

export interface BodySceneProps {
  model: BodyViewModel
  selectedOrgan: string | null
  onSelectOrgan: (organId: string) => void
  tier: RenderTier
  /** Exposes the camera reset so the surrounding controls can drive it [09.6 §8]. */
  resetSignal: number
}

export function BodyScene({
  model,
  selectedOrgan,
  onSelectOrgan,
  tier,
  resetSignal,
}: BodySceneProps) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    controls.current?.reset()
  }, [resetSignal])

  return (
    <Canvas
      camera={{ position: [0.85, 0.5, 1.3], fov: 38 }}
      dpr={[1, maxPixelRatio(tier)]}
      // Renders on demand rather than continuously, so a static scene costs
      // nothing and the frame budget is spent only on real interaction.
      frameloop="always"
      gl={{ antialias: tier === 'full', powerPreference: 'high-performance' }}
    >
      <ambientLight intensity={0.68} />
      <directionalLight position={[2, 3, 2]} intensity={0.9} castShadow={false} />
      <directionalLight position={[-2, 1, -1]} intensity={0.28} />
      {tier === 'full' && <pointLight position={[0, 1.2, 1.5]} intensity={0.3} />}

      <Anatomy
        model={model}
        selectedOrgan={selectedOrgan}
        onSelectOrgan={onSelectOrgan}
        tier={tier}
      />

      <OrbitControls
        ref={controls}
        makeDefault
        enablePan
        enableZoom
        enableRotate
        // Damped and settling, never springy [09.6 §16].
        enableDamping={!reduced}
        dampingFactor={0.075}
        minDistance={0.65}
        maxDistance={3}
        // Clamped so the anatomy is never viewed from a disorienting angle.
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
        target={[0, 0.45, 0]}
      />
    </Canvas>
  )
}
