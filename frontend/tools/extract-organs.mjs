import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { MeshoptSimplifier } from 'meshoptimizer';

await MeshoptSimplifier.ready;

/**
 * Decimates a baked (non-indexed) geometry to roughly `targetTriangles`.
 *
 * meshopt's simplifier needs a welded, indexed mesh to find collapsible
 * shared edges — a freshly-baked geometry has none (every triangle owns its
 * own unshared vertices), so vertices are merged first. Normals are
 * recomputed after rather than carried through simplification, since a
 * decimated mesh's own face structure is a better source for them than
 * interpolating the original detailed normals onto a coarser one.
 */
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

// GLTFExporter's binary path reads Blobs via the browser FileReader API.
// Node's Blob already has .arrayBuffer(); this shim bridges the two.
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

// Same seam-artifact guard as extract-body.mjs: needle-thin triangles at
// stitched mesh boundaries catch the shell's fresnel rim light and read as
// stray glowing lines, so they're dropped by shape rather than trusted as
// real anatomy. See that file for the full rationale.
const a3 = new THREE.Vector3();
const b3 = new THREE.Vector3();
const c3 = new THREE.Vector3();
function isSliver(pa, pb, pc) {
  const ab = b3.subVectors(pb, pa).length();
  const bc = c3.subVectors(pc, pb).length();
  const ca = a3.subVectors(pa, pc).length();
  const longest = Math.max(ab, bc, ca);
  if (longest < 1e-6) return true;
  const s = (ab + bc + ca) / 2;
  const areaSq = Math.max(0, s * (s - ab) * (s - bc) * (s - ca));
  const area = Math.sqrt(areaSq);
  return area / (longest * longest) < 0.02;
}

// Identical logic to features/body/model.ts's bake() — flattens a subtree
// into one world-space geometry, dropping materials/textures (the app
// colors organs itself via organPalette, never from source materials).
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

  if (sliverCount) console.log('  dropped', sliverCount, 'sliver triangles of', triCount);
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

// (sourceFile, node name AS SANITIZED BY FBX2glTF, target OrganId, target triangles)
// FBX2glTF strips periods and turns spaces into underscores, so "Kidney.l"
// becomes "Kidneyl", "Left lung.g" becomes "Left_lungg", etc. — confirmed by
// actually loading each file and listing names, not guessed from the FBX.
// Targets keep the combined organ set well under 50k triangles total —
// still an order of magnitude more detailed than the procedural fallback,
// without being a real-time-rendering liability.
const ORGAN_MAP = [
  ['VisceralSystem100.glb', 'Kidneyl', 'left-kidney', 2000],
  ['VisceralSystem100.glb', 'Kidneyr', 'right-kidney', 2000],
  ['VisceralSystem100.glb', 'Urinary_bladder', 'bladder', 2200],
  ['VisceralSystem100.glb', 'Left_lungg', 'left-lung', 4000],
  ['VisceralSystem100.glb', 'Right_lungg', 'right-lung', 4000],
  ['VisceralSystem100.glb', 'Liver', 'liver', 5000],
  ['VisceralSystem100.glb', 'Pancreas', 'pancreas', 2200],
  ['VisceralSystem100.glb', 'Stomach', 'stomach', 3000],
  ['VisceralSystem100.glb', 'Thyroid_gland', 'thyroid', 1800],
  ['VisceralSystem100.glb', 'Colong', 'colon', 4000],
  ['VisceralSystem100.glb', 'Prostate', 'prostate', 468],
  ['LymphoidOrgans100.glb', 'Spleen', 'spleen', 1462],
  ['CardioVascular41.glb', 'Heartg', 'heart', 4000],
  ['NervousSystem100.glb', 'Braing', 'brain', 6000],
];

async function main() {
  const outputScene = new THREE.Group();
  const report = [];

  const cache = new Map();
  for (const [file, nodeName, organId, targetTriangles] of ORGAN_MAP) {
    let scene = cache.get(file);
    if (!scene) {
      scene = await loadGLB(`${SCRATCH}/${file}`);
      cache.set(file, scene);
    }
    const node = scene.getObjectByName(nodeName);
    if (!node) {
      report.push({ organId, nodeName, file, status: 'NOT FOUND' });
      continue;
    }
    const result = bake(node);
    if (!result) {
      report.push({ organId, nodeName, file, status: 'EMPTY BAKE' });
      continue;
    }
    const simplified = simplify(result.geometry, targetTriangles);
    simplified.computeBoundingBox();
    const box = simplified.boundingBox;
    const size = new THREE.Vector3();
    box.getSize(size);
    const mesh = new THREE.Mesh(simplified, new THREE.MeshStandardMaterial());
    mesh.name = organId;
    outputScene.add(mesh);
    const finalTris = (simplified.getIndex()?.count ?? simplified.getAttribute('position').count) / 3;
    report.push({
      organId,
      nodeName,
      file,
      status: 'OK',
      rawTriangles: result.triCount,
      finalTriangles: Math.round(finalTris),
      size: `${size.x.toFixed(3)} x ${size.y.toFixed(3)} x ${size.z.toFixed(3)}`,
    });
  }

  console.table(report);

  const totalRaw = report.reduce((sum, r) => sum + (r.rawTriangles || 0), 0);
  const totalFinal = report.reduce((sum, r) => sum + (r.finalTriangles || 0), 0);
  console.log('Total triangles: raw', totalRaw, '-> simplified', totalFinal);

  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(outputScene, { binary: true });
  writeFileSync(`${SCRATCH}/organs-extracted.glb`, Buffer.from(glb));
  console.log('Wrote organs-extracted.glb');
}

main();
