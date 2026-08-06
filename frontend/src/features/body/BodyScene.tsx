import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { ReactNode } from 'react'
import { anatomyPalette, cameraDamping, organPalette, severityScale } from '@/design/theme'
import { maxPixelRatio } from '@/lib/capability'
import type { RenderTier } from '@/lib/capability'
import { useReducedMotion } from '@/components/motion'
import { BONES, LYMPH_NODES, ORGANS, organAppliesTo } from './anatomy'
import { armPoseAngle, ORGAN_SCALE, poseArmPoint } from './figure'
import { organGeometryFor } from './organ-shapes'
import { useBodyMeshes } from './use-figure-geometry'
import type { BodyForm } from './figure'
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
  beats = false,
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
  /** Only the heart. Drives the systolic contraction below. */
  beats?: boolean
}) {
  const material = useRef<THREE.MeshStandardMaterial>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const reduced = useReducedMotion()

  const target = useMemo(() => new THREE.Color(color), [color])
  const emissive = useMemo(
    () => (selected ? new THREE.Color(color) : new THREE.Color('#000000')),
    [selected, color],
  )

  const settled = useRef(false)

  const baseScale = useMemo(
    () => new THREE.Vector3(...((scale ?? [1, 1, 1]) as [number, number, number])),
    [scale],
  )

  useFrame((state, delta) => {
    // The heartbeat is a CONTRACTION, not a throb: the heart snaps inward at
    // systole and relaxes slowly back, with a smaller second beat as the
    // ventricles close. Deliberately scale only — colour on this body means
    // severity and nothing else [00 §6.7], so a beating heart may never borrow
    // it, however good a glowing pulse would look.
    if (beats && mesh.current) {
      if (reduced) {
        mesh.current.scale.copy(baseScale)
      } else {
        const cycle = (state.clock.elapsedTime % 1) / 1 // 60 bpm
        const lub = Math.exp(-(((cycle - 0.12) / 0.05) ** 2))
        const dub = Math.exp(-(((cycle - 0.34) / 0.06) ** 2)) * 0.5
        const contraction = 1 - (lub + dub) * 0.035
        mesh.current.scale.copy(baseScale).multiplyScalar(contraction)
      }
    }

    const mat = material.current
    if (!mat) return
    // The first frame snaps to the target rather than easing toward it, so
    // there is no flash of the default material on mount. Done here rather
    // than in an effect because this is the first moment the material is
    // guaranteed to exist, and it keeps emissive in step with colour.
    if (!settled.current) {
      settled.current = true
      mat.color.set(target)
      mat.emissive.set(emissive)
      mat.emissiveIntensity = selected ? 0.4 : 0
      return
    }
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
      ref={mesh}
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

/** Sculpted organ meshes are already positioned by the atlas fit. */
const ORIGIN: readonly [number, number, number] = [0, 0, 0]

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
    case 'lofted': {
      // A real organ silhouette, lofted the same way the body shell is
      // [features/body/organ-shapes.ts]. Built once and cached there, never
      // rebuilt per frame.
      const geometry = organGeometryFor(organ.id)
      return geometry ? <primitive object={geometry} attach="geometry" /> : null
    }
  }
}

/**
 * Fresnel rim material.
 *
 * Brightness rises where the surface turns away from the eye, so the silhouette
 * and every curve of the form glow while the flat facing areas stay dark. This
 * single effect is what makes a body read as a volume rather than as a
 * translucent blob — a plain transparent material gives a uniform wash with no
 * shape information in it at all.
 *
 * Additive and depth-write disabled, so it layers over the organs without ever
 * hiding one. Nothing clinical is communicated by this material; it is the
 * container the clinical colour sits inside.
 */
/**
 * The breath, as a vertex displacement.
 *
 * A living body is the whole point of this object, and a body that holds
 * perfectly still reads as a specimen. But a uniform pulse — the cheap version —
 * reads as a throb, because nothing about real breathing is uniform: the thorax
 * expands, the abdomen follows slightly, and the head, arms and legs do not move
 * at all.
 *
 * So the displacement is weighted by height with a gaussian centred on the
 * sternum, and pushes outward along the body's own radial axis rather than along
 * a world axis, so the back expands as the chest does. Amplitude is ~5mm at the
 * sternum on a 1.82m figure — the real figure for quiet breathing, and small
 * enough that it is felt before it is noticed.
 *
 * Done on the GPU, in a shader chunk shared by the skin pass and the rim pass,
 * because those two draw the SAME geometry and any drift between them would
 * separate the silhouette from its own outline.
 */
const BREATH_GLSL = /* glsl */ `
  uniform float uBreath;

  vec3 aoBreathe(vec3 p) {
    // Sternum sits at y = 0.88 in the figure frame (floor -0.51, crown 1.31).
    float t = (p.y - 0.88) / 0.30;
    float thorax = exp(-t * t);
    float r = length(p.xz);
    vec2 outward = r > 1e-4 ? p.xz / r : vec2(0.0);
    float amp = uBreath * 0.005 * thorax;
    // The chest rises as it expands; the lift fades out below the diaphragm.
    float lift = amp * 0.4 * smoothstep(0.45, 1.05, p.y);
    return vec3(p.x + outward.x * amp, p.y + lift, p.z + outward.y * amp);
  }
`

function createRimMaterial(color: string, intensity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uIntensity: { value: intensity },
      uBreath: { value: 0 },
    },
    vertexShader: /* glsl */ `
      ${BREATH_GLSL}
      varying vec3 vNormal;
      varying vec3 vToEye;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 viewPosition = modelViewMatrix * vec4(aoBreathe(position), 1.0);
        vToEye = normalize(-viewPosition.xyz);
        gl_Position = projectionMatrix * viewPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vToEye;
      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(vToEye)));
        float rim = pow(1.0 - facing, 2.2);
        // A little base fill keeps the facing surfaces from vanishing entirely,
        // which would leave the body reading as an outline rather than a solid.
        // Narrow parts (limbs) present a grazing angle across nearly their whole
        // visible surface, so the same rim strength that reads as "volume" on
        // the wide torso reads as a uniformly glowing tube on a thin cylinder —
        // the base fill term is what keeps a limb's core visible instead of
        // just its outline.
        float value = rim * uIntensity + 0.16;
        gl_FragColor = vec4(uColor * value, value);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

/**
 * The body silhouette.
 *
 * ONE continuous surface. A sculpted model from public/models when one is
 * installed, otherwise the figure generated in figure.ts — never a collection of
 * primitives, and never nothing.
 *
 * Two passes:
 *   1. A skin-toned, mostly-matte shell — lit like an actual surface, not a
 *      near-invisible outline. Revised 4 August 2026: the previous version
 *      (opacity 0.11, plus a scattered point cloud) read as a translucent
 *      point-cloud rather than a body, and a surface that thin cannot carry a
 *      future skin-level finding. This still stops short of fully opaque —
 *      organ severity, drawn opaque and first, must keep reading through it;
 *      that is the one property this shell may never trade away.
 *   2. The fresnel rim on top, which still carries the silhouette at every
 *      turn — the skin tone alone flattens out at grazing angles without it.
 */
function BodyShell({
  tier,
  geometry,
}: {
  tier: RenderTier
  geometry: THREE.BufferGeometry
}) {
  const reduced = useReducedMotion()

  const rim = useMemo(
    () => createRimMaterial(anatomyPalette.rim, tier === 'reduced' ? 0.4 : 0.55),
    [tier],
  )

  // The skin pass is a standard material so it keeps real lighting; the breath
  // is patched into its vertex stage rather than replacing it.
  const skin = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(anatomyPalette.skin),
      transparent: true,
      opacity: tier === 'reduced' ? 0.66 : 0.6,
      roughness: 0.82,
      metalness: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    material.onBeforeCompile = (shader) => {
      shader.uniforms['uBreath'] = { value: 0 }
      shader.vertexShader = shader.vertexShader
        .replace('void main() {', `${BREATH_GLSL}\nvoid main() {`)
        .replace('#include <begin_vertex>', 'vec3 transformed = aoBreathe(position);')
      material.userData['shader'] = shader
    }
    return material
  }, [tier])

  useEffect(() => {
    return () => {
      rim.dispose()
      skin.dispose()
    }
  }, [rim, skin])

  useFrame((state) => {
    // ~13 breaths per minute — a resting adult rate. Sine rather than a
    // sawtooth: inhalation and exhalation are close enough in length at rest
    // that the asymmetry is not what sells it, and a smooth curve never ticks.
    const phase = reduced ? 0 : Math.sin(state.clock.elapsedTime * ((Math.PI * 2) / 4.6))
    rim.uniforms['uBreath']!.value = phase
    const shader = skin.userData['shader'] as { uniforms: Record<string, { value: number }> } | undefined
    if (shader?.uniforms['uBreath']) shader.uniforms['uBreath'].value = phase
  })

  return (
    <group>
      {/* Skin, not glass.
          DoubleSide and depthWrite off, so the near surface, the far surface and
          every organ between them are all visible at once. The organs are opaque
          and draw first; the shell then blends over them, which is what puts them
          convincingly INSIDE the body rather than floating in front of a
          cut-out. Nothing here can hide an organ — that is the property being
          bought, and it is why the shell writes no depth. */}
      <mesh geometry={geometry} material={skin} renderOrder={2} />

      <mesh geometry={geometry} material={rim} renderOrder={3} />
    </group>
  )
}

function Anatomy({
  model,
  selectedOrgan,
  onSelectOrgan,
  tier,
  form,
}: {
  model: BodyViewModel
  selectedOrgan: string | null
  onSelectOrgan: (organId: string) => void
  tier: RenderTier
  form: BodyForm
}) {
  const colorFor = (severity: SeverityLevel, fallback: string) =>
    severity > 0 ? severityScale[severity] : fallback

  // Generated geometry immediately; a sculpted atlas replaces it if installed.
  const meshes = useBodyMeshes(form)

  const bones = model.organAt('bones')
  const lymph = model.organAt('lymph-nodes')

  return (
    <group position={[0, -0.1, 0]}>
      <BodyShell tier={tier} geometry={meshes.figure} />

      {BONES.map((bone) => (
        <AnimatedPart
          key={bone.key}
          geometry={<cylinderGeometry args={bone.args as [number, number, number, number]} />}
          position={bone.arm ? poseArmPoint(bone.position, bone.arm) : bone.position}
          rotation={bone.arm ? [0, 0, armPoseAngle(bone.arm)] : undefined}
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

      {ORGANS.filter((organ) => organAppliesTo(organ, form)).map((organ) => {
        const state = model.organAt(organ.id)
        // A sculpted mesh already carries its own position, orientation and
        // true size, registered to this body by the atlas fit. The primitive
        // needs all three supplied. Falling back per organ rather than
        // all-or-nothing means a partial atlas still shows a complete body.
        const sculpted = meshes.organs.get(organ.id)
        const baseScale = organ.scaleByForm?.[form] ?? organ.scale ?? [1, 1, 1]
        return (
          <AnimatedPart
            key={organ.id}
            geometry={sculpted ? <primitive object={sculpted} attach="geometry" /> : organGeometry(organ)}
            position={sculpted ? ORIGIN : organ.position}
            rotation={sculpted ? undefined : organ.rotation}
            scale={
              sculpted
                ? undefined
                : ([
                    baseScale[0] * ORGAN_SCALE,
                    baseScale[1] * ORGAN_SCALE,
                    baseScale[2] * ORGAN_SCALE,
                  ] as [number, number, number])
            }
            color={colorFor(state?.severity ?? 0, organPalette[organ.id] ?? anatomyPalette.organ)}
            selected={selectedOrgan === organ.id}
            onSelect={() => onSelectOrgan(organ.id)}
            label={organ.label}
            beats={organ.id === 'heart'}
          />
        )
      })}
    </group>
  )
}

/** Roughly the figure's centre of mass — where the camera orbits by default. */
const ORBIT_TARGET: [number, number, number] = [0, 0.45, 0]

export interface BodySceneProps {
  model: BodyViewModel
  selectedOrgan: string | null
  onSelectOrgan: (organId: string) => void
  tier: RenderTier
  /** Which figure to draw, from the sex recorded for this patient [09.6 §5]. */
  form: BodyForm
  /** Exposes the camera reset so the surrounding controls can drive it [09.6 §8]. */
  resetSignal: number
}

export function BodyScene({
  model,
  selectedOrgan,
  onSelectOrgan,
  tier,
  form,
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
      {/* The scene is lit for a dark volume. Ambient stays low so the fresnel
          rim does the describing; a bright ambient would flatten the form back
          into the wash it used to be. Organs are lit enough that every severity
          step stays distinguishable, which is the one lighting requirement that
          is not negotiable [00 §6.7]. */}
      <ambientLight intensity={0.75} />
      {/* Key, from the front and above */}
      <directionalLight position={[1.8, 2.4, 2.6]} intensity={0.95} castShadow={false} />
      {/* Cool fill from behind, so shadowed faces keep their colour */}
      <directionalLight position={[-2.4, 0.8, -1.6]} intensity={0.5} color="#8fbede" />
      {tier === 'full' && <pointLight position={[0, 0.9, 1.6]} intensity={0.3} color="#cfeaff" />}

      <Anatomy
        model={model}
        selectedOrgan={selectedOrgan}
        onSelectOrgan={onSelectOrgan}
        tier={tier}
        form={form}
      />

      <OrbitControls
        ref={controls}
        makeDefault
        enablePan
        enableZoom
        enableRotate
        // Zoom travels toward the pointer, not toward the figure's centre.
        // Dollying to a fixed centre means examining a shoulder or a knee
        // requires zooming past it and then panning back — the anatomy the
        // user aimed at slides out of frame exactly as they approach it.
        zoomToCursor
        // Damped and settling, never springy [09.6 §16].
        enableDamping={!reduced}
        dampingFactor={0.075}
        minDistance={0.65}
        maxDistance={3}
        // Clamped so the anatomy is never viewed from a disorienting angle.
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
        // Module-level constant, not a literal: zoomToCursor moves the target
        // itself, and a fresh array each render would keep snapping it back.
        target={ORBIT_TARGET}
      />
    </Canvas>
  )
}
