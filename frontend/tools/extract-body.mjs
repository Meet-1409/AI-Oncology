import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { MeshoptSimplifier } from 'meshoptimizer';

globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = `data:${blob.type || 'application/octet-stream'};base64,${Buffer.from(buf).toString('base64')}`;
      this.onload?.({ target: this });
      this.onloadend?.({ target: this });
    });
  }
};

const SCRATCH = process.argv[2];
const SOURCE = process.argv[3] || 'RegionsOfBody100.glb';
const OUT = process.argv[4] || 'body-male-extracted.glb';
const TARGET_TRIANGLES = Number(process.argv[5] || 60000);
// 'female' reshapes the trunk on the way through — see reshapeToFemale below.
const FORM = process.argv[6] || 'male';

await MeshoptSimplifier.ready;

// meshopt's simplify() only shrinks the index list — the output still points
// into the ORIGINAL (pre-simplification) vertex buffer, so a 99%-reduced mesh
// still ships 100% of its source vertices unless they're compacted away here.
function compact(positions32, indices) {
  const remap = new Map();
  const newPositions = [];
  const newIndices = new Uint32Array(indices.length);
  let next = 0;
  for (let i = 0; i < indices.length; i++) {
    const old = indices[i];
    let mapped = remap.get(old);
    if (mapped === undefined) {
      mapped = next++;
      remap.set(old, mapped);
      newPositions.push(positions32[old * 3], positions32[old * 3 + 1], positions32[old * 3 + 2]);
    }
    newIndices[i] = mapped;
  }
  return { positions: new Float32Array(newPositions), indices: newIndices };
}

function simplify(geometry, targetTriangles) {
  const indexed = mergeVertices(geometry);
  const positions = indexed.getAttribute('position').array;
  const sourceIndex = indexed.getIndex().array;
  const currentTriangles = sourceIndex.length / 3;
  if (currentTriangles <= targetTriangles) return indexed;

  const indices32 = sourceIndex instanceof Uint32Array ? sourceIndex : Uint32Array.from(sourceIndex);
  const positions32 = positions instanceof Float32Array ? positions : Float32Array.from(positions);

  const [newIndices] = MeshoptSimplifier.simplify(
    indices32,
    positions32,
    3,
    targetTriangles * 3,
    0.06,
    ['Sparse'],
  );

  const { positions: compactPositions, indices: compactIndices } = compact(positions32, newIndices);

  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.Float32BufferAttribute(compactPositions, 3));
  result.setIndex(new THREE.BufferAttribute(compactIndices, 1));
  result.computeVertexNormals();
  return result;
}

// Z-Anatomy's body surface is ~278 independently-authored region patches
// (arm, forearm, chest...) stitched edge to edge. Where two patches' borders
// don't line up exactly — a near-universal reality of hand-authored adjacent
// meshes — the border loop can include needle-thin triangles that reach past
// the real surface into empty space. Invisible on a matte material, but the
// shell's fresnel rim shader lights up anything seen edge-on, so every one of
// those slivers reads as a bright stray line jutting off the silhouette.
// Anatomically real geometry is never this thin relative to its size, so
// triangles far outside a normal aspect ratio are dropped as seam artifacts,
// not real anatomy.
const a3 = new THREE.Vector3();
const b3 = new THREE.Vector3();
const c3 = new THREE.Vector3();
function isSliver(pa, pb, pc) {
  const ab = b3.subVectors(pb, pa).length();
  const bc = c3.subVectors(pc, pb).length();
  const ca = a3.subVectors(pa, pc).length();
  const longest = Math.max(ab, bc, ca);
  if (longest < 1e-6) return true;
  // Heron's formula, guarded against tiny negative values from fp error.
  const s = (ab + bc + ca) / 2;
  const areaSq = Math.max(0, s * (s - ab) * (s - bc) * (s - ca));
  const area = Math.sqrt(areaSq);
  // Ratio of area to the square of the longest edge — near-constant for any
  // reasonably-shaped triangle regardless of scale, and collapses toward 0
  // only for slivers. 0.02 sits well below an equilateral triangle's ~0.43
  // but comfortably above genuine degenerate geometry.
  return area / (longest * longest) < 0.02;
}

function bake(root) {
  root.updateMatrixWorld(true);
  const positions = [];
  const normals = [];
  const normalMatrix = new THREE.Matrix3();
  const vertex = new THREE.Vector3();
  const p0 = new THREE.Vector3();
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  let triCount = 0;
  let sliverCount = 0;

  root.traverse((node) => {
    if (!node.isMesh) return;
    const geometry = node.geometry;
    const position = geometry.getAttribute('position');
    if (!position) return;
    const index = geometry.getIndex();
    const count = index ? index.count : position.count;
    normalMatrix.getNormalMatrix(node.matrixWorld);
    const normalAttr = geometry.getAttribute('normal');

    for (let i = 0; i < count; i += 3) {
      const tri = [i, i + 1, i + 2].map((k) => (index ? index.getX(k) : k));
      p0.fromBufferAttribute(position, tri[0]).applyMatrix4(node.matrixWorld);
      p1.fromBufferAttribute(position, tri[1]).applyMatrix4(node.matrixWorld);
      p2.fromBufferAttribute(position, tri[2]).applyMatrix4(node.matrixWorld);
      triCount++;
      if (isSliver(p0, p1, p2)) {
        sliverCount++;
        continue;
      }
      for (const v of tri) {
        vertex.fromBufferAttribute(position, v).applyMatrix4(node.matrixWorld);
        positions.push(vertex.x, vertex.y, vertex.z);
        if (normalAttr) {
          vertex.fromBufferAttribute(normalAttr, v).applyMatrix3(normalMatrix).normalize();
          normals.push(vertex.x, vertex.y, vertex.z);
        }
      }
    }
  });

  console.log('Dropped', sliverCount, 'sliver triangles of', triCount);
  if (positions.length < 9) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length === positions.length) {
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  } else {
    geo.computeVertexNormals();
  }
  return { geometry: geo, triCount: Math.round(triCount - sliverCount) };
}

async function loadGLB(path) {
  const buf = readFileSync(path);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const gltf = await new GLTFLoader().parseAsync(ab, '');
  return gltf.scene;
}

// Z-Anatomy's "Regions of body" export bundles non-anatomy scene helpers
// alongside the real skin-region meshes: cross-section slicing planes (used
// by the interactive viewer, not part of the body) and hair/eyelash strand
// geometry (thin curve-based meshes that decimate into long spike triangles
// and read as stray radiating lines once baked into one surface).
const EXCLUDE_NAME = /hair|cross[ _]?section|eyelash/i;

function pruneNonAnatomical(root) {
  const toRemove = [];
  root.traverse((node) => {
    if (EXCLUDE_NAME.test(node.name)) toRemove.push(node);
  });
  for (const node of toRemove) node.parent?.remove(node);
  return toRemove.map((n) => n.name);
}

/**
 * Derives a female body shell from the male one.
 *
 * WHY THIS EXISTS. Every openly-licensed anatomical atlas available is
 * male-only — BodyParts3D, Z-Anatomy and Open3DModel alike; the last has
 * female organs on its roadmap and has not shipped them. Without this, a female
 * patient fell back to the crude generated figure while a male patient got the
 * sculpted mesh, so the quality of a patient's own body depended on their sex.
 * That is the worse outcome.
 *
 * WHAT IT IS AND IS NOT. This is a proportional reshape of a male scan, not a
 * female scan. It is honest for what the Body actually claims to be — a
 * representation of body structure, explicitly not a physical replica of any
 * person [00 §6.4] — and it is exactly the transformation figure.ts already
 * applies to the generated figure, using the SAME multipliers, so the sculpted
 * and generated paths cannot disagree about what a female form looks like.
 *
 * The multipliers come from features/body/figure.ts FORM_RATIOS.female. The
 * shoulder-to-hip ratio is the cue that actually reads (~1.18 male, ~1.03
 * female); the rest is supporting detail.
 *
 * Vertical landmarks are in the shared figure frame — floor -0.51, crown 1.31 —
 * and the reshape never moves a vertex vertically, so both forms keep one
 * vertical frame and one organ coordinate set stays correct in each.
 */
function reshapeToFemale(geometry) {
  const position = geometry.getAttribute('position');
  // Landmarks are FRACTIONS OF STATURE, so they must be resolved against this
  // mesh's own frame — not against figure.ts's. The reshape runs on raw source
  // coordinates, before normalizeFigure maps them into the figure frame, and
  // hardcoding the figure frame's floor of -0.51 here put every landmark half a
  // metre below where it belonged: the hips were "reshaped" at knee height and
  // the measured hip width came out slightly NARROWER instead of 10% wider.
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  const FLOOR = box.min.y;
  const HEIGHT = box.max.y - box.min.y;
  // Landmark fractions of stature, from figure.ts's own table.
  const at = (fraction) => FLOOR + fraction * HEIGHT;
  const SHOULDER = at(0.818);
  const CHEST = at(0.720);
  const WAIST = at(0.640);
  const HIP = at(0.520);
  const HEAD = at(0.900);

  // FORM_RATIOS.female, verbatim.
  const R = { shoulder: 0.88, chest: 1.06, waist: 0.90, hip: 1.10, head: 0.95 };

  // Smooth blend between landmarks so no band edge shows as a crease.
  function ratioAt(y) {
    const band = (a, b, ra, rb) => {
      const t = Math.min(1, Math.max(0, (y - a) / (b - a)));
      const eased = t * t * (3 - 2 * t);
      return ra + (rb - ra) * eased;
    };
    if (y >= HEAD) return R.head;
    if (y >= SHOULDER) return band(SHOULDER, HEAD, R.shoulder, R.head);
    if (y >= CHEST) return band(CHEST, SHOULDER, R.chest, R.shoulder);
    if (y >= WAIST) return band(WAIST, CHEST, R.waist, R.chest);
    if (y >= HIP) return band(HIP, WAIST, R.hip, R.waist);
    // Below the hips the legs taper back toward neutral rather than staying
    // flared, which would read as a costume rather than a body.
    return band(FLOOR, HIP, 1.0, R.hip);
  }

  // The reshape is the TRUNK's, and the arms hang beside it. Scaling purely by
  // distance from the body axis pushed the hands outward at hip level — the
  // female form came out with a WIDER arm span than the male one, which is
  // both wrong and the opposite of the narrower-shouldered silhouette
  // intended. So the effect falls off with radius: full strength through the
  // trunk, nothing at all by the time it reaches a limb.
  const TRUNK = 0.30;
  const LIMB = 0.42;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const radius = Math.hypot(x, z);
    const falloff =
      radius <= TRUNK ? 1 : radius >= LIMB ? 0 : 1 - (radius - TRUNK) / (LIMB - TRUNK);
    const eased = falloff * falloff * (3 - 2 * falloff);
    const r = 1 + (ratioAt(y) - 1) * eased;
    // Radial about the body's own vertical axis; y is never touched, so the
    // shared vertical frame and every organ coordinate stay valid.
    position.setXYZ(i, x * r, y, z * r);
  }
  position.needsUpdate = true;
  // Deliberately NOT recomputing normals here. mergeVertices welds on position
  // AND normal, so freshly computed per-face normals stop coincident seam
  // vertices from merging — meshopt then finds no shared edges to collapse and
  // the decimation silently does nothing (113,927 triangles out of a 60,000
  // target, observed). simplify() recomputes normals after decimating anyway,
  // which is the better source for them.
  return geometry;
}

async function main() {
  console.log('Loading', SOURCE, '...');
  const scene = await loadGLB(`${SCRATCH}/${SOURCE}`);

  const pruned = pruneNonAnatomical(scene);
  console.log('Pruned non-anatomical nodes:', pruned);

  console.log('Baking whole scene to world-space geometry...');
  const result = bake(scene);
  if (!result) throw new Error('bake produced no geometry');

  result.geometry.computeBoundingBox();
  const box = result.geometry.boundingBox;
  const size = new THREE.Vector3();
  box.getSize(size);
  console.log('Raw triangles:', result.triCount);
  console.log('Bounding box size (x,y,z):', size.x.toFixed(3), size.y.toFixed(3), size.z.toFixed(3));
  console.log('Bounding box min/max Y:', box.min.y.toFixed(3), box.max.y.toFixed(3));

  if (FORM === 'female') {
    console.log('Reshaping trunk to the female form (figure.ts FORM_RATIOS)...');
    reshapeToFemale(result.geometry);
  }

  console.log('Simplifying to', TARGET_TRIANGLES, 'triangles...');
  const simplified = simplify(result.geometry, TARGET_TRIANGLES);
  const finalTris = (simplified.getIndex()?.count ?? simplified.getAttribute('position').count) / 3;
  console.log('Final triangles:', Math.round(finalTris));

  const mesh = new THREE.Mesh(simplified, new THREE.MeshStandardMaterial());
  mesh.name = 'body-surface';
  const outputScene = new THREE.Group();
  outputScene.add(mesh);

  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(outputScene, { binary: true });
  writeFileSync(`${SCRATCH}/${OUT}`, Buffer.from(glb));
  console.log('Wrote', OUT);
}

main();
