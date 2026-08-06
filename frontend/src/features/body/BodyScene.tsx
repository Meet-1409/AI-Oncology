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
  receded = false,
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
  /** Something else is selected; step back so it can be read alone. */
  receded?: boolean
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
      mat.transparent = true
      mat.opacity = receded ? 0.22 : 1
      return
    }
    if (reduced) {
      mat.color.set(target)
      mat.emissive.set(emissive)
      mat.emissiveIntensity = selected ? 0.4 : 0
      mat.transparent = receded
      mat.opacity = receded ? 0.22 : 1
      return
    }
    const t = Math.min(1, delta * cameraDamping.severityLerp)
    mat.color.lerp(target, t)
    mat.emissive.lerp(emissive, t)
    mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, selected ? 0.4 : 0, t)

    // Receding is OPACITY ONLY. Colour on this body means severity [00 §6.7],
    // so an organ that steps back must never do it by changing hue — a dimmed
    // red would read as a milder finding.
    const targetOpacity = receded ? 0.22 : 1
    if (!mat.transparent && targetOpacity < 1) mat.transparent = true
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, t)
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
 * Done on the GPU, inside the shell's own material, so the displaced surface
 * and the fresnel rim computed from it can never drift apart.
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


/**
 * The body silhouette.
 *
 * ONE continuous surface. A sculpted model from public/models when one is
 * installed, otherwise the figure generated in figure.ts — never a collection of
 * primitives, and never nothing.
 *
 * ONE PASS. This used to be two — a lit skin material, then the fresnel rim
 * drawn over it as a second full-mesh mesh. Both were DoubleSide and both were
 * transparent, so a 60,000-triangle body cost four full passes of fragment work
 * over its whole silhouette. On a machine with integrated graphics that is the
 * single most expensive thing in the application, and it showed.
 *
 * The rim is now a term inside the skin material's own fragment stage, so the
 * shell draws once. Identical output, half the geometry submitted and roughly
 * half the overdraw.
 *
 * The shell is deliberately not fully opaque: organ severity, drawn opaque and
 * first, must keep reading through it. That is the one property this shell may
 * never trade away.
 */
function BodyShell({
  tier,
  geometry,
  emphasis,
}: {
  tier: RenderTier
  geometry: THREE.BufferGeometry
  emphasis?: 'skin' | 'organs' | null
}) {
  const reduced = useReducedMotion()

  const baseOpacity = tier === 'reduced' ? 0.66 : 0.6

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
    const rimColor = new THREE.Color(anatomyPalette.rim)
    const rimIntensity = tier === 'reduced' ? 0.4 : 0.55

    material.onBeforeCompile = (shader) => {
      shader.uniforms['uBreath'] = { value: 0 }
      shader.uniforms['uRimColor'] = { value: rimColor }
      shader.uniforms['uRimIntensity'] = { value: rimIntensity }

      shader.vertexShader = shader.vertexShader
        .replace(
          'void main() {',
          `${BREATH_GLSL}\nvarying vec3 vAoNormal;\nvarying vec3 vAoToEye;\nvoid main() {`,
        )
        .replace('#include <begin_vertex>', 'vec3 transformed = aoBreathe(position);')
        .replace(
          '#include <project_vertex>',
          `#include <project_vertex>
           vAoNormal = normalize(normalMatrix * objectNormal);
           vAoToEye = normalize(-mvPosition.xyz);`,
        )

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
           varying vec3 vAoNormal;
           varying vec3 vAoToEye;
           uniform vec3 uRimColor;
           uniform float uRimIntensity;`,
        )
        // Added at the very end, after the lit colour is resolved, so the rim
        // sits on top of real lighting exactly as the separate additive pass
        // did. A little base fill keeps facing surfaces from vanishing —
        // narrow parts (limbs) present a grazing angle across nearly their
        // whole visible surface, so rim strength alone turns a limb into a
        // glowing tube with no visible core.
        .replace(
          '#include <dithering_fragment>',
          `#include <dithering_fragment>
           float aoFacing = abs(dot(normalize(vAoNormal), normalize(vAoToEye)));
           float aoRim = pow(1.0 - aoFacing, 2.2) * uRimIntensity + 0.16;
           gl_FragColor.rgb += uRimColor * aoRim;
           gl_FragColor.a = clamp(gl_FragColor.a + aoRim, 0.0, 1.0);`,
        )

      material.userData['shader'] = shader
    }
    return material
  }, [tier])

  useEffect(() => () => skin.dispose(), [skin])

  useFrame((state, delta) => {
    // ~13 breaths per minute — a resting adult rate. Sine rather than a
    // sawtooth: inhalation and exhalation are close enough in length at rest
    // that the asymmetry is not what sells it, and a smooth curve never ticks.
    const phase = reduced ? 0 : Math.sin(state.clock.elapsedTime * ((Math.PI * 2) / 4.6))
    const shader = skin.userData['shader'] as
      | { uniforms: Record<string, { value: number }> }
      | undefined
    if (shader?.uniforms['uBreath']) shader.uniforms['uBreath'].value = phase

    // The shell answers what the interface is talking about: it thins so the
    // organs read through, or settles back. Eased rather than switched, so it
    // reads as the body responding rather than as a value being set.
    const target = emphasis === 'organs' ? baseOpacity * 0.45 : baseOpacity
    skin.opacity = reduced
      ? target
      : THREE.MathUtils.lerp(skin.opacity, target, Math.min(1, delta * 6))
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
    </group>
  )
}

/**
 * A slow idle turn.
 *
 * Wrapping rather than rotating the Anatomy group directly, so the rotation
 * lives outside anything that reads organ positions — a figure that turns must
 * not move where the anatomy believes itself to be.
 */
function IdleTurn({ active, children }: { active: boolean; children: ReactNode }) {
  const group = useRef<THREE.Group>(null)
  const reduced = useReducedMotion()
  useFrame((_, delta) => {
    if (!group.current) return
    if (!active || reduced) return
    // ~9 seconds per revolution. Slow enough to read as presence rather than
    // as a carousel.
    group.current.rotation.y += delta * 0.11
  })
  return <group ref={group}>{children}</group>
}

function Anatomy({
  model,
  selectedOrgan,
  onSelectOrgan,
  tier,
  form,
  emphasis,
}: {
  model: BodyViewModel
  selectedOrgan: string | null
  onSelectOrgan: (organId: string) => void
  tier: RenderTier
  form: BodyForm
  emphasis?: 'skin' | 'organs' | null
}) {
  const colorFor = (severity: SeverityLevel, fallback: string) =>
    severity > 0 ? severityScale[severity] : fallback

  // When one organ is selected the others recede rather than disappear — an
  // organ that vanishes takes its spatial context with it, and "where is this
  // relative to everything else" is most of what the Body is for. Opacity
  // only: colour on this body means severity, so dimming may never touch it.
  const recede = (organId: string) =>
    selectedOrgan !== null && selectedOrgan !== organId

  // Generated geometry immediately; a sculpted atlas replaces it if installed.
  const meshes = useBodyMeshes(form)

  const bones = model.organAt('bones')
  const lymph = model.organAt('lymph-nodes')

  return (
    <group position={[0, -0.1, 0]}>
      {/* THE ORGAN CLICK.
          Selecting an organ dissolves the body AROUND it: the shell thins so
          the selected organ becomes the only fully-read thing in the frame.
          This is the same mechanism as the sign-in preview, driven by
          selection instead of by hover — one behaviour, not two. */}
      <BodyShell
        tier={tier}
        geometry={meshes.figure}
        emphasis={selectedOrgan ? 'organs' : emphasis}
      />

      {BONES.map((bone) => (
        <AnimatedPart
          key={bone.key}
          geometry={<cylinderGeometry args={bone.args as [number, number, number, number]} />}
          position={bone.arm ? poseArmPoint(bone.position, bone.arm) : bone.position}
          rotation={bone.arm ? [0, 0, armPoseAngle(bone.arm)] : undefined}
          color={colorFor(bones?.severity ?? 0, anatomyPalette.bone)}
          selected={selectedOrgan === 'bones'}
          receded={recede('bones')}
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
          receded={recede('lymph-nodes')}
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
            receded={recede(organ.id)}
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

/**
 * Two framings, because the Body is asked to do two different jobs.
 *
 * `figure` is the portrait: the whole standing body, held at a respectful
 * distance, the way you would look at a person. It is the product's identity
 * and belongs anywhere the Body is the subject of the screen.
 *
 * `detail` moves in on the trunk, where every organ that matters actually is.
 * It is the working view — close enough to select something.
 */
const FRAMING = {
  // Far enough that the whole 1.82m figure clears the frame with air above the
  // crown and below the feet — a portrait cropped at the shins reads as a
  // mistake, not as a composition.
  figure: { position: [0.62, 0.44, 3.15] as [number, number, number], fov: 36 },
  detail: { position: [0.85, 0.5, 1.3] as [number, number, number], fov: 38 },
} as const

export type BodyFraming = keyof typeof FRAMING

export interface BodySceneProps {
  model: BodyViewModel
  selectedOrgan: string | null
  onSelectOrgan: (organId: string) => void
  tier: RenderTier
  /** Which figure to draw, from the sex recorded for this patient [09.6 §5]. */
  form: BodyForm
  /** Exposes the camera reset so the surrounding controls can drive it [09.6 §8]. */
  resetSignal: number
  /** Portrait of the whole figure, or the working view of the trunk. */
  framing?: BodyFraming
  /**
   * A slow idle turn, for presentational surfaces only.
   *
   * Never on a real patient's Body: a record that rotates on its own while an
   * oncologist is trying to read it is a toy, and it would fight the user's
   * own orbit control for authority over the view.
   */
  idleSpin?: boolean
  /**
   * Which layer the surrounding UI is currently talking about, so the figure
   * can answer. `skin` settles the shell back to opaque; `organs` fades it so
   * what is inside reads through. Anything the interface says about the body
   * should be visible ON the body.
   */
  emphasis?: 'skin' | 'organs' | null
}

/**
 * The camera settles on whatever is selected.
 *
 * Not a cut and not a fly-through: the orbit target eases from the figure's
 * centre toward the chosen organ, and the distance closes a little. The user
 * keeps full control throughout — this moves where the camera is LOOKING, never
 * takes the controls away, so an oncologist can drag at any point during the
 * move and simply be in charge again.
 *
 * Deliberately does not change what is selected, only what is framed. Camera
 * movement must never change medical information [00 §6.12].
 */
function SelectionCamera({
  selectedOrgan,
  controls,
}: {
  selectedOrgan: string | null
  controls: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>
}) {
  const reduced = useReducedMotion()
  const desired = useMemo(() => new THREE.Vector3(...ORBIT_TARGET), [])

  useMemo(() => {
    const organ = selectedOrgan
      ? ORGANS.find((entry) => entry.id === selectedOrgan)
      : undefined
    if (organ) desired.set(organ.position[0], organ.position[1], organ.position[2])
    else desired.set(...ORBIT_TARGET)
  }, [selectedOrgan, desired])

  useFrame((_, delta) => {
    const orbit = controls.current
    if (!orbit) return
    // The organ coordinates are in the figure frame; the Anatomy group is
    // offset by -0.1 in y, so the camera has to look where the organ actually
    // ends up rather than where the table says it is.
    const t = reduced ? 1 : Math.min(1, delta * cameraDamping.factor)
    orbit.target.x = THREE.MathUtils.lerp(orbit.target.x, desired.x, t)
    orbit.target.y = THREE.MathUtils.lerp(orbit.target.y, desired.y - 0.1, t)
    orbit.target.z = THREE.MathUtils.lerp(orbit.target.z, desired.z, t)
    orbit.update()
  })

  return null
}

export function BodyScene({
  model,
  selectedOrgan,
  onSelectOrgan,
  tier,
  form,
  resetSignal,
  framing = 'detail',
  idleSpin = false,
  emphasis = null,
}: BodySceneProps) {
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    controls.current?.reset()
  }, [resetSignal])

  const view = FRAMING[framing]

  return (
    <Canvas
      camera={{ position: view.position, fov: view.fov }}
      // THE BODY IS FILL-BOUND, not geometry-bound. Measured: identical scene
      // and identical triangle count at 300x150 runs at 61fps and at 662x900
      // runs at 3fps. The cost is fragments — a large, double-sided,
      // transparent shell blended over fourteen organs — so the levers that
      // matter are resolution and sample count, not mesh detail.
      //
      // Capped at 1 device pixel. A 2x display would quadruple the fragment
      // work for a translucent anatomical diagram that gains almost nothing
      // from the extra density, and hospital hardware is the target.
      dpr={[0.8, Math.min(1, maxPixelRatio(tier))]}
      // Renders on demand rather than continuously, so a static scene costs
      // nothing and the frame budget is spent only on real interaction.
      frameloop="always"
      // MSAA multiplies fragment cost by its sample count, which is exactly
      // the resource this scene has least of. The fresnel rim already keeps
      // the silhouette smooth, so the aliasing it would fix is barely visible
      // here and never worth a multiple of the frame budget.
      gl={{ antialias: false, powerPreference: 'high-performance' }}
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

      <IdleTurn active={idleSpin}>
        <Anatomy
          model={model}
          selectedOrgan={selectedOrgan}
          onSelectOrgan={onSelectOrgan}
          tier={tier}
          form={form}
          emphasis={emphasis}
        />
      </IdleTurn>

      <SelectionCamera selectedOrgan={selectedOrgan} controls={controls} />

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
        maxDistance={4}
        // Clamped so the anatomy is never viewed from a disorienting angle.
        minPolarAngle={Math.PI * 0.15}
        maxPolarAngle={Math.PI * 0.85}
        // No `target` prop. SelectionCamera owns the target now — passing one
        // here would fight it every frame and snap the view back to the
        // figure's centre the instant an organ was chosen.
      />
    </Canvas>
  )
}
