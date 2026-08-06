import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useReducedMotion } from '@/components/motion'
import { detectRenderTier, maxPixelRatio } from '@/lib/capability'
import type { RenderTier } from '@/lib/capability'
import { buildAnatomyField, sampleAnatomyField } from './anatomy-field'
import type { FieldGeometry } from './anatomy-field'

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

/**
 * How many points the field is worth on this machine.
 *
 * This runs on hospital desktops with integrated graphics, not on the machine
 * it was written on. Point count is the single biggest lever on the Entry's
 * cost, so it is tied to the same capability probe everything else uses rather
 * than being one number chosen once and hoped for.
 */
const POINT_BUDGET: Record<'full' | 'reduced' | 'none', number> = {
  full: 12000,
  reduced: 5000,
  none: 0,
}

/**
 * The point material.
 *
 * A plain pointsMaterial cannot react to anything — every point is drawn at a
 * fixed size at a fixed place. This one takes the cursor in world space and
 * pushes each point AWAY from it with a smooth radial falloff, so moving the
 * mouse across the figure parts the cloud like a hand through smoke and it
 * closes again behind you.
 *
 * Displacement is computed per vertex on the GPU. Doing it in JavaScript would
 * mean touching 24,000 positions every frame on the main thread, which is the
 * difference between an effect that feels physical and one that stutters.
 *
 * Points also brighten and swell slightly as the cursor nears, so the response
 * reads as attention rather than as a hole being punched in the body.
 */
function createPointMaterial(color: string, size: number, opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uSize: { value: size },
      uOpacity: { value: opacity },
      uPointer: { value: new THREE.Vector3(0, 0, 999) },
      uReach: { value: 0.42 },
      uPush: { value: 0.16 },
      uTime: { value: 0 },
      // Perspective size attenuation, in PIXELS per world unit at unit depth.
      // Driven from the real canvas height and camera FOV each frame — see the
      // note in the vertex shader for why a hardcoded constant was a defect.
      uAttenuation: { value: 1000 },
    },
    vertexShader: /* glsl */ `
      attribute float aScale;
      uniform float uSize;
      uniform vec3 uPointer;
      uniform float uReach;
      uniform float uPush;
      uniform float uTime;
      uniform float uAttenuation;
      varying float vGlow;

      void main() {
        vec3 p = position;

        // Distance to the cursor, measured in the figure's own space.
        vec3 away = p - uPointer;
        float d = length(away);
        // 1 at the cursor, 0 at the edge of its reach. smoothstep rather than a
        // linear ramp so there is no visible boundary where the effect stops.
        float influence = 1.0 - smoothstep(0.0, uReach, d);
        p += normalize(away + vec3(0.0001)) * influence * uPush;

        // A slow, tiny per-point drift so the cloud is never perfectly still
        // even when nothing is moving. Seeded from position, so it is stable.
        float seed = p.x * 37.0 + p.y * 71.0 + p.z * 13.0;
        p.x += sin(uTime * 0.5 + seed) * 0.0016;
        p.y += cos(uTime * 0.42 + seed) * 0.0016;

        vGlow = influence;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);

        // Perspective size attenuation.
        //
        // This multiplier is NOT a free-choice constant. It converts a world
        // size into pixels and must come from the canvas height and the
        // camera's field of view. A guessed value of 300.0 here made every
        // point ~240px wide instead of ~3px: 24,000 giant additive quads
        // stacked into a solid white blob over the wordmark, and the fill-rate
        // cost alone was enough to drop a machine with integrated graphics to a
        // crawl. Both symptoms, one bad number.
        //
        // Clamped as a hard backstop. Whatever the viewport, a point in this
        // field is a speck; nothing here should ever be allowed to become a
        // screen-filling sprite again.
        float size = uSize * aScale * (1.0 + influence * 1.6) * (uAttenuation / -mv.z);
        gl_PointSize = clamp(size, 1.0, 4.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vGlow;

      void main() {
        // Round points with a soft edge — a square point reads as a pixel
        // artifact at this density, not as a particle.
        //
        // The falloff is TIGHT on purpose. These sprites are 2-4px; a wide
        // smoothstep spends most of that on fade, so the figure washed out to
        // almost nothing. Only the outermost ring softens.
        vec2 c = gl_PointCoord - vec2(0.5);
        float r = length(c);
        if (r > 0.5) discard;
        float edge = 1.0 - smoothstep(0.42, 0.5, r);
        gl_FragColor = vec4(uColor * (1.0 + vGlow * 1.5), uOpacity * edge);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}

/** The body, as points. */
function AnatomyPoints({ progressRef, tier }: SceneProps & { tier: RenderTier }) {
  const reduced = useReducedMotion()
  const group = useRef<THREE.Group>(null)
  const bodyRef = useRef<THREE.Points>(null)
  const organRef = useRef<THREE.Points>(null)

  // The generated field draws immediately so there is never an empty frame;
  // the sculpted body replaces it the moment it has been sampled. Same
  // never-nothing rule the Digital Twin follows.
  const generated = useMemo(() => buildAnatomyField(7000), [])
  const [sampled, setSampled] = useState<FieldGeometry | null>(null)

  useEffect(() => {
    let alive = true
    void sampleAnatomyField(POINT_BUDGET[tier]).then((result) => {
      if (alive && result) setSampled(result)
    })
    return () => {
      alive = false
    }
  }, [tier])

  const field = sampled ?? generated

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

  // World units, converted to pixels by uAttenuation and then clamped. Tuned
  // against the rendered frame, not derived — the sprite's alpha falloff and
  // additive blending both affect how large a point needs to be to read.
  const bodyMaterial = useMemo(() => createPointMaterial('#8fb6c7', 0.012, 0.8), [])
  useEffect(() => () => bodyMaterial.dispose(), [bodyMaterial])

  // Where the cursor is, in the figure's own space. Kept in refs so pointer
  // movement never triggers a React render — at 24,000 points that would be
  // the difference between smooth and unusable.
  const pointerNdc = useRef(new THREE.Vector2(0, 0))
  const pointerActive = useRef(false)
  const pointerWorld = useRef(new THREE.Vector3(0, 0, 999))
  const smoothed = useRef(new THREE.Vector3(0, 0, 999))
  const raycaster = useMemo(() => new THREE.Raycaster(), [])
  // The cursor is projected onto the plane the figure stands in, so "near the
  // cursor" means near it on screen, at the figure's depth.
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), [])

  useEffect(() => {
    if (reduced) return
    function onMove(event: PointerEvent) {
      pointerNdc.current.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1,
      )
      pointerActive.current = true
    }
    function onLeave() {
      pointerActive.current = false
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [reduced])

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

    // Project the cursor into the scene, then into the ROTATING group's local
    // space — the cloud is turning, so a world-space cursor would slide across
    // the body as it spins instead of staying under the pointer.
    if (pointerActive.current) {
      raycaster.setFromCamera(pointerNdc.current, state.camera)
      if (raycaster.ray.intersectPlane(plane, pointerWorld.current)) {
        group.current.worldToLocal(pointerWorld.current)
      }
    } else {
      pointerWorld.current.set(0, 0, 999)
    }

    // Damped, so the parting follows the cursor rather than snapping to it.
    smoothed.current.lerp(pointerWorld.current, Math.min(1, delta * 9))

    const u = bodyMaterial.uniforms
    u['uPointer']!.value.copy(smoothed.current)
    u['uTime']!.value = state.clock.elapsedTime

    // Pixels per world unit at unit depth, from the ACTUAL drawing buffer and
    // the camera's current field of view. Recomputed every frame because both
    // change — on resize, on a different display density, on any device that
    // is not the one this was written on.
    const camera = state.camera as THREE.PerspectiveCamera
    if (camera.isPerspectiveCamera) {
      const height = state.size.height * state.viewport.dpr
      u['uAttenuation']!.value = height / (2 * Math.tan((camera.fov * Math.PI) / 360))
    }
  })

  return (
    <group ref={group}>
      <points ref={bodyRef} geometry={bodyGeometry} material={bodyMaterial} />

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
      // pointerEvents MUST be none here, not only on the wrapper.
      // react-three-fiber sets `pointer-events: auto` on its own container, so
      // a `pointer-events-none` parent does not stop it — the canvas then sits
      // over the hero and silently eats the click on Sign in. The Entry's
      // figure is decoration and is never interactive, so it should never be a
      // hit target at all.
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <CameraRig progressRef={progressRef} />
      <AnatomyPoints progressRef={progressRef} tier={tier} />
      {tier === 'full' && <Atmosphere />}
    </Canvas>
  )
}
