import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from '@/components/motion'
import { detectRenderTier, maxPixelRatio } from '@/lib/capability'
import { buildAnatomyField } from './anatomy-field'

/**
 * The Entry scene.
 *
 * A cinematic 3D environment: the body rendered as a field of points, held in
 * darkness, with the camera moving through it as the visitor descends. This is the
 * platform's identity in one image — the body, as data.
 *
 * It carries no patient information [04 §14]. The form is anonymous.
 *
 * Scroll drives the camera rather than a timeline, so the visitor is always in
 * control and the motion never runs away from them. Under reduced motion the
 * camera holds still and the field stops rotating; the composition remains, so
 * nothing is lost [00 §11.9].
 */

interface SceneProps {
  /** 0 at the top of the document, 1 at the end of the cinematic section. */
  progressRef: React.RefObject<number>
}

/** The body, as points. */
function AnatomyPoints({ progressRef }: SceneProps) {
  const reduced = useReducedMotion()
  const group = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Points>(null)
  const organRef = useRef<THREE.Points>(null)

  const field = useMemo(() => buildAnatomyField(7000), [])

  const bodyGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(field.positions, 3))
    geometry.setAttribute('aScale', new THREE.BufferAttribute(field.scales, 1))
    return geometry
  }, [field])

  const organGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(field.organPositions, 3))
    return geometry
  }, [field])

  useEffect(() => {
    return () => {
      bodyGeometry.dispose()
      organGeometry.dispose()
    }
  }, [bodyGeometry, organGeometry])

  useFrame((state, delta) => {
    if (!group.current) return
    const progress = progressRef.current ?? 0

    if (reduced) {
      group.current.rotation.y = 0.35
      return
    }

    // A slow, continuous turn — the figure is alive but never restless.
    group.current.rotation.y += delta * 0.085

    // Breathing: an almost imperceptible vertical drift, so the form never reads
    // as a static render.
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.012

    // The field opens outward as the visitor descends, as though moving inside it.
    const expansion = 1 + progress * 0.22
    group.current.scale.setScalar(expansion)
  })

  return (
    <group ref={group}>
      <points ref={bodyRef} geometry={bodyGeometry}>
        <pointsMaterial
          size={0.0075}
          sizeAttenuation
          color="#8fb6c7"
          transparent
          opacity={0.62}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Organ landmarks, marginally warmer and brighter. */}
      <points ref={organRef} geometry={organGeometry}>
        <pointsMaterial
          size={0.013}
          sizeAttenuation
          color="#e8f2f6"
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}

/** Ambient dust, giving the darkness volume and a sense of depth. */
function Atmosphere() {
  const reduced = useReducedMotion()
  const ref = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const count = 900
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((_, delta) => {
    if (ref.current && !reduced) ref.current.rotation.y -= delta * 0.012
  })

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.006}
        sizeAttenuation
        color="#4f7285"
        transparent
        opacity={0.4}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

/** Scroll-driven camera. The visitor descends through the figure. */
function CameraRig({ progressRef }: SceneProps) {
  const { camera } = useThree()
  const reduced = useReducedMotion()
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (reduced) return
    function onPointerMove(event: PointerEvent) {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointerMove)
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [reduced])

  useFrame((_, delta) => {
    const progress = progressRef.current ?? 0

    // Starts far back and high, settles closer and level as the visitor descends
    // — a camera move, not a page change.
    const targetZ = 3.4 - progress * 2.05
    const targetY = 0.92 - progress * 0.42

    // A very small parallax response to the pointer, so the scene feels physical
    // without becoming a toy.
    const parallaxX = reduced ? 0 : pointer.current.x * 0.16
    const parallaxY = reduced ? 0 : -pointer.current.y * 0.1

    const damping = reduced ? 1 : Math.min(1, delta * 2.4)

    camera.position.x += (parallaxX - camera.position.x) * damping
    camera.position.y += (targetY + parallaxY - camera.position.y) * damping
    camera.position.z += (targetZ - camera.position.z) * damping

    camera.lookAt(0, 0.62 - progress * 0.12, 0)
  })

  return null
}

export function EntryScene({ progressRef }: SceneProps) {
  const tier = useMemo(() => detectRenderTier(), [])

  // Without WebGL the Entry still reads completely — the HTML layer above carries
  // every word [04 §14].
  if (tier === 'none') return null

  return (
    <Canvas
      camera={{ position: [0, 0.92, 3.4], fov: 42 }}
      dpr={[1, maxPixelRatio(tier)]}
      gl={{ antialias: tier === 'full', alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <CameraRig progressRef={progressRef} />
      <AnatomyPoints progressRef={progressRef} />
      {tier === 'full' && <Atmosphere />}
    </Canvas>
  )
}
