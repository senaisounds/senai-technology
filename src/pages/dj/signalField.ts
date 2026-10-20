import * as THREE from "three";
import type { Levels } from "./audio";

export type FieldHandle = {
  setLevels: (l: Levels) => void;
  setPointer: (x: number, y: number) => void;
  setEnabled: (on: boolean) => void;
  setPaused: (on: boolean) => void;
  resize: () => void;
  dispose: () => void;
};

const VERT = /* glsl */ `
uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform sampler2D uBands;
varying float vH;
varying vec2 vUv;
void main() {
  vUv = uv;
  float ang = atan(position.z, position.x);
  float rad = length(position.xz);
  float bin = fract(ang / 6.2831853 + 0.5);
  float band = texture2D(uBands, vec2(bin, 0.5)).r;
  float ripple = sin(rad * 3.4 - uTime * 1.3) * 0.08 * (0.35 + uMid);
  float dome = exp(-rad * rad * 0.045) * uBass * 1.15;
  float h = band * 1.35 * smoothstep(0.4, 8.0, rad) + ripple + dome;
  vec3 p = position;
  p.y += h;
  vH = h;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const FRAG = /* glsl */ `
uniform float uTime;
varying float vH;
varying vec2 vUv;
void main() {
  float gx = abs(fract(vUv.x * 28.0) - 0.5);
  float gy = abs(fract(vUv.y * 28.0) - 0.5);
  float line = smoothstep(0.045, 0.012, min(gx, gy));
  vec3 ink = vec3(0.035, 0.036, 0.028);
  vec3 lime = vec3(0.84, 1.0, 0.24);
  vec3 heat = vec3(1.0, 0.23, 0.12);
  vec3 ice = vec3(0.49, 0.91, 0.97);
  float peak = smoothstep(0.35, 1.4, vH);
  vec3 col = ink + lime * line * 0.18 + lime * peak * 0.28 + heat * smoothstep(0.8, 1.6, vH) * 0.35;
  col += ice * smoothstep(1.1, 1.8, vH) * 0.15;
  float fog = smoothstep(0.15, 1.0, length(vUv - 0.5) * 1.45);
  col = mix(col, vec3(0.03, 0.031, 0.025), fog);
  gl_FragColor = vec4(col, 1.0);
}
`;

export function createSignalField(
  canvas: HTMLCanvasElement,
  opts: { mobile: boolean },
): FieldHandle {
  const mobile = opts.mobile;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: false,
    powerPreference: mobile ? "low-power" : "high-performance",
  });
  renderer.setClearColor(0x0a0b08, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.7));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0b08, 0.085);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  camera.position.set(0, 3.4, 11);

  const bandsTex = new THREE.DataTexture(new Uint8Array(32), 32, 1, THREE.RedFormat);
  bandsTex.magFilter = THREE.LinearFilter;
  bandsTex.minFilter = THREE.LinearFilter;
  bandsTex.needsUpdate = true;

  const uniforms = {
    uTime: { value: 0 },
    uBass: { value: 0 },
    uMid: { value: 0 },
    uBands: { value: bandsTex },
  };

  const segs = mobile ? 48 : 80;
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(22, 22, segs, segs),
    new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERT,
      fragmentShader: FRAG,
    }),
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const count = mobile ? 40 : 72;
  const geo = new THREE.BoxGeometry(0.03, 1, 0.03);
  geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: 0x1c1e14,
    emissive: 0xd6ff3d,
    emissiveIntensity: 0.28,
    metalness: 0.15,
    roughness: 0.45,
  });
  const needles = new THREE.InstancedMesh(geo, mat, count);
  needles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(needles);

  const dummy = new THREE.Object3D();
  const bases: { x: number; z: number; r: number }[] = [];
  for (let i = 0; i < count; i++) {
    const ring = i < count * 0.55 ? 5.1 : 7.4;
    const a = (i / (i < count * 0.55 ? count * 0.55 : count * 0.45)) * Math.PI * 2 + (i % 2) * 0.08;
    const x = Math.cos(a) * ring;
    const z = Math.sin(a) * ring;
    bases.push({ x, z, r: ring });
    dummy.position.set(x, 0.02, z);
    dummy.scale.set(1, 0.2, 1);
    dummy.updateMatrix();
    needles.setMatrixAt(i, dummy.matrix);
  }
  needles.instanceMatrix.needsUpdate = true;

  const disc = new THREE.Mesh(
    new THREE.RingGeometry(0.55, 1.35, 48),
    new THREE.MeshBasicMaterial({ color: 0x7dfff7, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.12;
  scene.add(disc);

  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.42, 1),
    new THREE.MeshBasicMaterial({ color: 0xff3b1f, wireframe: true }),
  );
  core.position.y = 0.7;
  scene.add(core);

  scene.add(new THREE.AmbientLight(0x9aa090, 0.35));
  const key = new THREE.PointLight(0xd6ff3d, 8, 18);
  key.position.set(2, 5, 3);
  scene.add(key);
  const rim = new THREE.PointLight(0x7dfff7, 4, 16);
  rim.position.set(-4, 3, -3);
  scene.add(rim);

  let running = true;
  let paused = false;
  let raf = 0;
  let time = 0;
  let last = performance.now();
  let ptrX = 0;
  let ptrY = 0;
  let angle = 0.4;
  let live: Levels = { bass: 0, mid: 0, high: 0, bands: new Float32Array(32), progress: 0 };
  let soundOn = false;

  const size = () => {
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  size();

  const frame = (now: number) => {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (paused) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;
    uniforms.uTime.value = time;
    uniforms.uBass.value = live.bass;
    uniforms.uMid.value = live.mid;

    const data = bandsTex.image.data as Uint8Array;
    for (let i = 0; i < 32; i++) data[i] = Math.floor((live.bands[i] ?? 0) * 255);
    bandsTex.needsUpdate = true;

    const idle = soundOn ? 0 : 0.22 + Math.sin(time * 0.7) * 0.08;
    for (let i = 0; i < count; i++) {
      const b = bases[i];
      const band = live.bands[i % 32] || 0;
      const h = 0.18 + (soundOn ? band : idle * (0.35 + (i % 7) * 0.06)) * 2.4 + live.bass * 0.45;
      dummy.position.set(b.x, 0.02, b.z);
      dummy.scale.set(1, h, 1);
      dummy.updateMatrix();
      needles.setMatrixAt(i, dummy.matrix);
    }
    needles.instanceMatrix.needsUpdate = true;
    mat.emissiveIntensity = 0.2 + live.bass * 0.85;

    disc.rotation.z = time * (0.35 + live.mid * 0.8);
    disc.scale.setScalar(1 + live.bass * 0.18);
    core.rotation.y = time * 0.7;
    core.rotation.x = time * 0.35;
    core.scale.setScalar(1 + live.bass * 0.45);
    key.intensity = 6 + live.bass * 18;
    rim.intensity = 3 + live.high * 10;

    angle += dt * (0.08 + live.mid * 0.05);
    const rad = 9.2 - live.bass * 0.55;
    const elev = 2.4 + ptrY * 0.45;
    camera.position.set(Math.sin(angle + ptrX * 0.35) * rad, elev, Math.cos(angle + ptrX * 0.35) * rad);
    camera.lookAt(0, 0.55, 0);

    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  return {
    setLevels(l) {
      live = l;
    },
    setPointer(x, y) {
      ptrX += (x - ptrX) * 0.08;
      ptrY += (y - ptrY) * 0.08;
    },
    setEnabled(on) {
      soundOn = on;
    },
    setPaused(on) {
      paused = on;
    },
    resize: size,
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      geo.dispose();
      mat.dispose();
      ground.geometry.dispose();
      (ground.material as THREE.Material).dispose();
      disc.geometry.dispose();
      (disc.material as THREE.Material).dispose();
      core.geometry.dispose();
      (core.material as THREE.Material).dispose();
      bandsTex.dispose();
      renderer.dispose();
    },
  };
}
