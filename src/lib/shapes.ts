// Point-cloud targets for the "What we make" morph.
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

function sampleGeometry(geo: THREE.BufferGeometry, count: number, scale = 1) {
  const mesh = new THREE.Mesh(geo.index ? geo.toNonIndexed() : geo, new THREE.MeshBasicMaterial());
  const sampler = new MeshSurfaceSampler(mesh).build();
  const out = new Float32Array(count * 3);
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    sampler.sample(p);
    p.multiplyScalar(scale).toArray(out, i * 3);
  }
  return out;
}

/** Rasterise text in a 2D canvas and pick random lit pixels -> points (a "text-ish" shape). */
function sampleText(text: string, count: number, width = 4.2) {
  const W = 512, H = 256;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.font = "900 190px 'Bricolage Grotesque Variable', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, W / 2, H / 2 + 8);
  const data = ctx.getImageData(0, 0, W, H).data;
  const lit: number[] = [];
  for (let y = 0; y < H; y += 1)
    for (let x = 0; x < W; x += 1) if (data[(y * W + x) * 4 + 3] > 128) lit.push(x, y);
  const out = new Float32Array(count * 3);
  const n = lit.length / 2;
  const s = width / W;
  for (let i = 0; i < count; i++) {
    const k = n ? Math.floor(Math.random() * n) : 0;
    out[i * 3] = ((lit[k * 2] ?? W / 2) - W / 2 + Math.random()) * s;
    out[i * 3 + 1] = -((lit[k * 2 + 1] ?? H / 2) - H / 2 + Math.random()) * s;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
  }
  return out;
}

function samplePhone(count: number) {
  // rounded phone slab + a ring of points for the "notch"/camera
  const shape = new THREE.Shape();
  const w = 1.25, h = 2.5, r = 0.28;
  shape.moveTo(-w / 2 + r, -h / 2);
  shape.lineTo(w / 2 - r, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  shape.lineTo(w / 2, h / 2 - r);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  shape.lineTo(-w / 2 + r, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  shape.lineTo(-w / 2, -h / 2 + r);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 3 });
  geo.center();
  return sampleGeometry(geo, count, 1.05);
}

/** Rippling "stage floor" grid for interactive / event experiences. */
function sampleWave(count: number) {
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 4.6;
    const z = (Math.random() - 0.5) * 3.2;
    const d = Math.hypot(x, z);
    const y = Math.sin(d * 3.2) * 0.32 * Math.exp(-d * 0.25);
    // tilt toward the camera
    out[i * 3] = x;
    out[i * 3 + 1] = y * 0.9 - z * 0.45;
    out[i * 3 + 2] = z * 0.8 + y * 0.4;
  }
  return out;
}

export type ServiceShape = { id: string; positions: Float32Array };

export function buildServiceShapes(count: number): Float32Array[] {
  return [
    sampleText("</>", count, 5.2), // AI-built websites & web apps
    samplePhone(count), // mobile apps
    sampleGeometry(new THREE.TorusKnotGeometry(0.95, 0.3, 200, 24, 2, 3), count), // brand identity
    sampleGeometry(new THREE.TorusGeometry(1.15, 0.42, 32, 96), count), // video & motion (reel)
    sampleGeometry(new THREE.IcosahedronGeometry(1.45, 1), count), // AI tools
    sampleWave(count), // interactive / event experiences
  ];
}
