import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  FLOORS,
  STATUS_HEX,
  floorStatus,
  type Availability,
  type CameraPreset,
  type LightMode,
} from "./data";

export type TowerHandle = {
  setFloor: (n: number) => void;
  setPaused: (paused: boolean) => void;
  setPreset: (p: CameraPreset) => void;
  setLight: (m: LightMode) => void;
  setHumans: (on: boolean) => void;
  resize: () => void;
  pick: (cssX: number, cssY: number) => number | null;
  dispose: () => void;
};

/** 1 world unit ≈ 5 m. Floor-to-floor 3.4 m. Adult figure 1.78 m. */
const M = 0.2;
const F2F = 3.4 * M;
const HUMAN = 1.78 * M;
const PODIUM_H = 1.46;
const SLAB_T = 0.055;
const GLASS_H = F2F - SLAB_T - 0.04;
const CORNER = 0.42;

const OBSIDIAN = 0x0b0b0d;
const PAPER = 0xf4f1ea;
const GOLD = 0xffd400;
const BRONZE = 0x6a4a28;
const CHAMPAGNE = 0xb8924a;
const GLASS_TINT = 0x15222c;
const POOL = 0x1ec8c0;

function hexNum(hex: string): number {
  return parseInt(hex.slice(1), 16);
}

function floorBase(n: number): number {
  return PODIUM_H + (n - 1) * F2F;
}

function plateSize(n: number): { w: number; d: number; r: number } {
  if (n >= 12) return { w: 3.05, d: 2.28, r: 0.5 };
  if (n >= 8) return { w: 3.28, d: 2.48, r: 0.46 };
  return { w: 3.52, d: 2.68, r: CORNER };
}

function roundedRectShape(w: number, d: number, r: number): THREE.Shape {
  const hw = w / 2;
  const hd = d / 2;
  const cr = Math.min(r, hw - 0.02, hd - 0.02);
  const s = new THREE.Shape();
  s.moveTo(-hw + cr, -hd);
  s.lineTo(hw - cr, -hd);
  s.absarc(hw - cr, -hd + cr, cr, -Math.PI / 2, 0, false);
  s.lineTo(hw, hd - cr);
  s.absarc(hw - cr, hd - cr, cr, 0, Math.PI / 2, false);
  s.lineTo(-hw + cr, hd);
  s.absarc(-hw + cr, hd - cr, cr, Math.PI / 2, Math.PI, false);
  s.lineTo(-hw, -hd + cr);
  s.absarc(-hw + cr, -hd + cr, cr, Math.PI, Math.PI * 1.5, false);
  return s;
}

function makePlate(w: number, d: number, r: number, t: number, segs: number): THREE.ExtrudeGeometry {
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w, d, r), {
    depth: t,
    bevelEnabled: false,
    curveSegments: segs,
  });
  geo.rotateX(Math.PI / 2);
  geo.translate(0, t, 0);
  geo.computeVertexNormals();
  return geo;
}

function roundedLoop(w: number, d: number, r: number, y: number, segs: number): THREE.CatmullRomCurve3 {
  const hw = w / 2;
  const hd = d / 2;
  const cr = Math.min(r, hw - 0.02, hd - 0.02);
  const corners = [
    { x: hw - cr, z: -hd + cr, a0: -Math.PI / 2, a1: 0 },
    { x: hw - cr, z: hd - cr, a0: 0, a1: Math.PI / 2 },
    { x: -hw + cr, z: hd - cr, a0: Math.PI / 2, a1: Math.PI },
    { x: -hw + cr, z: -hd + cr, a0: Math.PI, a1: Math.PI * 1.5 },
  ];
  const pts: THREE.Vector3[] = [];
  for (const c of corners) {
    for (let i = 0; i <= segs; i++) {
      const a = c.a0 + ((c.a1 - c.a0) * i) / segs;
      pts.push(new THREE.Vector3(c.x + Math.cos(a) * cr, y, c.z + Math.sin(a) * cr));
    }
  }
  return new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.02);
}

function facadeMap(seed: number, night: boolean): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = night ? "#071016" : "#121c22";
  ctx.fillRect(0, 0, 512, 256);
  let s = seed + 31;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0xffff) / 0xffff;
  };
  const cols = 12;
  const rows = 2;
  const gw = 512 / cols;
  const gh = 256 / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const lit = night ? rnd() > 0.28 : rnd() > 0.7;
      if (lit) {
        const warm = 0.55 + rnd() * 0.4;
        ctx.fillStyle = `rgba(255, ${Math.round(176 + rnd() * 36)}, ${Math.round(88 + rnd() * 36)}, ${warm})`;
      } else {
        ctx.fillStyle = night ? "rgba(28, 72, 88, 0.55)" : "rgba(70, 110, 124, 0.35)";
      }
      ctx.fillRect(x * gw + 3, y * gh + 8, gw - 6, gh - 16);
    }
  }
  ctx.fillStyle = night ? "rgba(12, 10, 8, 0.85)" : "rgba(18, 16, 14, 0.55)";
  for (let x = 0; x <= cols; x++) ctx.fillRect(x * gw - 1, 0, 2, 256);
  ctx.fillRect(0, 126, 512, 4);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function makeHuman(): THREE.Group {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xc4a07a, roughness: 0.62, metalness: 0.04 });
  const suit = new THREE.MeshStandardMaterial({ color: 0x16141a, roughness: 0.38, metalness: 0.22 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0xe8dcc8, roughness: 0.5, metalness: 0.05 });
  const U = M;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.11 * U, 12, 10), skin);
  head.position.y = 1.67 * U;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.4 * U, 0.58 * U, 0.22 * U), suit);
  torso.position.y = 1.22 * U;
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.22 * U, 0.12 * U, 0.08 * U), shirt);
  collar.position.set(0, 1.46 * U, 0.08 * U);
  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.34 * U, 0.16 * U, 0.2 * U), suit);
  pelvis.position.y = 0.88 * U;
  const legG = new THREE.CapsuleGeometry(0.055 * U, 0.62 * U, 3, 8);
  const legL = new THREE.Mesh(legG, suit);
  legL.position.set(-0.09 * U, 0.42 * U, 0);
  const legR = new THREE.Mesh(legG, suit);
  legR.position.set(0.09 * U, 0.42 * U, 0.01 * U);
  const armG = new THREE.CapsuleGeometry(0.04 * U, 0.5 * U, 3, 8);
  const armL = new THREE.Mesh(armG, suit);
  armL.position.set(-0.26 * U, 1.18 * U, 0);
  armL.rotation.z = 0.12;
  const armR = new THREE.Mesh(armG, suit);
  armR.position.set(0.26 * U, 1.18 * U, 0.02 * U);
  armR.rotation.z = -0.18;
  g.add(head, torso, collar, pelvis, legL, legR, armL, armR);
  g.userData.height = HUMAN;
  return g;
}

function makeCar(paint: number): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: paint, metalness: 0.82, roughness: 0.18 });
  const glass = new THREE.MeshStandardMaterial({
    color: 0x102028,
    metalness: 0.4,
    roughness: 0.06,
    transparent: true,
    opacity: 0.72,
  });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.7, metalness: 0.1 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.16, 0.42), body);
  hull.position.y = 0.2;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.14, 0.36), glass);
  cabin.position.set(-0.06, 0.32, 0);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.4), body);
  nose.position.set(0.4, 0.18, 0);
  const wheelG = new THREE.CylinderGeometry(0.09, 0.09, 0.07, 12);
  const spots: Array<[number, number]> = [
    [-0.28, 0.2],
    [0.28, 0.2],
    [-0.28, -0.2],
    [0.28, -0.2],
  ];
  spots.forEach(([x, z]) => {
    const w = new THREE.Mesh(wheelG, rubber);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.09, z);
    g.add(w);
  });
  g.add(hull, cabin, nose);
  return g;
}

function makePalm(): THREE.Group {
  const g = new THREE.Group();
  const trunkM = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.82, metalness: 0.04 });
  const leafM = new THREE.MeshStandardMaterial({ color: 0x1f6a48, roughness: 0.55, metalness: 0.05 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.04, 0.72, 7), trunkM);
  trunk.position.y = 0.36;
  g.add(trunk);
  for (let i = 0; i < 6; i++) {
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.42, 5), leafM);
    frond.position.y = 0.78;
    frond.rotation.z = 0.85;
    frond.rotation.y = (i / 6) * Math.PI * 2;
    g.add(frond);
  }
  return g;
}

function makeCabana(): THREE.Group {
  const g = new THREE.Group();
  const postM = new THREE.MeshStandardMaterial({ color: 0xd8c4a0, roughness: 0.5, metalness: 0.12 });
  const roofM = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.45, metalness: 0.08 });
  const deckM = new THREE.MeshStandardMaterial({ color: 0x6a4a2a, roughness: 0.7, metalness: 0.08 });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.52), deckM);
  deck.position.y = 0.015;
  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.58), roofM);
  roof.position.y = 0.42;
  g.add(deck, roof);
  [
    [-0.26, -0.2],
    [0.26, -0.2],
    [-0.26, 0.2],
    [0.26, 0.2],
  ].forEach(([x, z]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.4, 0.025), postM);
    p.position.set(x, 0.22, z);
    g.add(p);
  });
  return g;
}

type FloorRig = {
  n: number;
  group: THREE.Group;
  pick: THREE.Object3D;
  interiors: THREE.Group;
  glass: THREE.MeshStandardMaterial;
  edge: THREE.MeshStandardMaterial;
  led: THREE.MeshStandardMaterial;
  core: THREE.MeshStandardMaterial;
};

export function createTower(
  canvas: HTMLCanvasElement,
  opts: { mobile: boolean; reduced: boolean; onSelect: (floor: number) => void },
): TowerHandle {
  const mobile = opts.mobile;
  const reduced = opts.reduced;
  const segs = mobile ? 5 : 8;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: false,
    powerPreference: mobile ? "low-power" : "high-performance",
  });
  renderer.setClearColor(OBSIDIAN, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  if (!mobile) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
  }

  const scene = new THREE.Scene();
  const fog = new THREE.FogExp2(OBSIDIAN, 0.038);
  scene.fog = fog;

  const camera = new THREE.PerspectiveCamera(36, 1, 0.08, 140);
  camera.position.set(9.2, 6.4, 10.4);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = !mobile;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.55;
  controls.minDistance = 4.2;
  controls.maxDistance = 26;
  controls.minPolarAngle = 0.28;
  controls.maxPolarAngle = 1.42;
  controls.target.set(0, 4.4, 0);
  controls.update();

  const hemi = new THREE.HemisphereLight(0x7a8aaa, 0x1a1410, 0.48);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff1d0, 1.15);
  key.position.set(10, 16, 7);
  if (!mobile) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 2;
    key.shadow.camera.far = 46;
    key.shadow.camera.left = -14;
    key.shadow.camera.right = 14;
    key.shadow.camera.top = 16;
    key.shadow.camera.bottom = -8;
  }
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x3a5a78, 0.55);
  rim.position.set(-10, 5, -12);
  scene.add(rim);
  const lobby = new THREE.PointLight(0xffc56a, 7, 6, 2);
  lobby.position.set(0, 1.05, 2.4);
  scene.add(lobby);
  const poolL = new THREE.PointLight(0x2ad4c8, 6, 5, 2);
  poolL.position.set(2.4, 0.4, 1.1);
  scene.add(poolL);
  const porte = new THREE.PointLight(0xffd08a, 5, 5, 2);
  porte.position.set(0, 1.55, 3.4);
  scene.add(porte);

  const plaza = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 0.38, metalness: 0.28 });
  const bronze = new THREE.MeshStandardMaterial({
    color: 0x2a2118,
    emissive: CHAMPAGNE,
    emissiveIntensity: 0.16,
    metalness: 0.72,
    roughness: 0.32,
  });
  const champagne = new THREE.MeshStandardMaterial({
    color: 0x1c1812,
    emissive: CHAMPAGNE,
    emissiveIntensity: 0.22,
    metalness: 0.55,
    roughness: 0.38,
  });
  const water = new THREE.MeshBasicMaterial({
    color: POOL,
    transparent: true,
    opacity: 0.92,
  });
  const railGlass = new THREE.MeshStandardMaterial({
    color: 0x9ad4dc,
    transparent: true,
    opacity: 0.18,
    roughness: 0.06,
    metalness: 0.2,
  });
  const edgeGlow = new THREE.MeshStandardMaterial({
    color: BRONZE,
    emissive: CHAMPAGNE,
    emissiveIntensity: 0.85,
    metalness: 0.7,
    roughness: 0.24,
  });
  const leafPlanter = new THREE.MeshStandardMaterial({ color: 0x1a4a32, roughness: 0.7, metalness: 0.04 });

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(28, 72),
    new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: 0.82, metalness: 0.08 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const drive = new THREE.Mesh(new THREE.CircleGeometry(4.6, 64), plaza);
  drive.rotation.x = -Math.PI / 2;
  drive.position.y = 0.012;
  scene.add(drive);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(3.55, 3.66, 80),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.32, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  scene.add(ring);

  const cityMat = new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.7, metalness: 0.22 });
  const cityGlass = new THREE.MeshStandardMaterial({
    color: 0x1a3040,
    emissive: 0x1a3048,
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.4,
  });
  const cityN = mobile ? 8 : 14;
  for (let i = 0; i < cityN; i++) {
    const a = (i / cityN) * Math.PI * 2 + 0.35;
    const r = 11 + (i % 5) * 1.15;
    const h = 1.4 + (i % 7) * 0.85;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.7 + (i % 3) * 0.18, h, 0.55), i % 2 ? cityGlass : cityMat);
    tower.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
    scene.add(tower);
  }
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(22, 1.1, 3.2), new THREE.MeshStandardMaterial({ color: 0x121016, roughness: 0.95 }));
  ridge.position.set(-2, 0.4, -16);
  ridge.rotation.y = 0.18;
  scene.add(ridge);

  const podium = new THREE.Mesh(
    makePlate(5.4, 3.55, 0.42, PODIUM_H, segs),
    new THREE.MeshBasicMaterial({ color: 0x141210 }),
  );
  podium.position.set(0, 0, -0.55);
  podium.castShadow = true;
  podium.receiveShadow = true;
  scene.add(podium);

  const lobbyGlass = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 1.05, 0.1),
    new THREE.MeshStandardMaterial({
      color: 0x3a2a16,
      emissive: 0xffb347,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.62,
      roughness: 0.16,
      metalness: 0.28,
    }),
  );
  lobbyGlass.position.set(0, 0.78, 2.38);
  scene.add(lobbyGlass);

  const colG = new THREE.CylinderGeometry(0.09, 0.11, 1.62, 12);
  const colL = new THREE.Mesh(colG, bronze);
  colL.position.set(-1.55, 0.81, 3.15);
  const colR = colL.clone();
  colR.position.x = 1.55;
  scene.add(colL, colR);

  const canopy = new THREE.Mesh(
    makePlate(3.9, 1.85, 0.22, 0.05, segs),
    new THREE.MeshStandardMaterial({ color: 0x1a1612, metalness: 0.62, roughness: 0.35 }),
  );
  canopy.position.set(0, 1.62, 3.15);
  scene.add(canopy);
  const canopyLip = new THREE.Mesh(
    new THREE.BoxGeometry(4.1, 0.02, 0.06),
    new THREE.MeshStandardMaterial({ color: CHAMPAGNE, emissive: CHAMPAGNE, emissiveIntensity: 1.1, roughness: 0.2 }),
  );
  canopyLip.position.set(0, 1.6, 4.05);
  scene.add(canopyLip);

  const steps = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.1, 0.7), champagne);
  steps.position.set(0, 0.05, 2.75);
  scene.add(steps);

  const car1 = makeCar(0x0e1014);
  car1.scale.setScalar(1.15);
  car1.position.set(-0.85, 0, 3.55);
  car1.rotation.y = 0.18;
  const car2 = makeCar(0xc4a36a);
  car2.scale.setScalar(1.15);
  car2.position.set(1.15, 0, 3.85);
  car2.rotation.y = -0.35;
  scene.add(car1, car2);

  const lagoon = new THREE.Mesh(makePlate(2.6, 1.55, 0.62, 0.07, segs), water);
  lagoon.position.set(2.85, 0.05, 0.55);
  scene.add(lagoon);
  const lagoonDeck = new THREE.Mesh(makePlate(3.05, 1.95, 0.66, 0.03, segs), champagne);
  lagoonDeck.position.set(2.85, 0.01, 0.55);
  scene.add(lagoonDeck);

  const cabanaA = makeCabana();
  cabanaA.position.set(3.35, 0.04, -0.85);
  const cabanaB = makeCabana();
  cabanaB.position.set(2.05, 0.04, -1.05);
  cabanaB.rotation.y = 0.4;
  scene.add(cabanaA, cabanaB);

  const palmSpots: Array<[number, number, number]> = [
    [3.55, 0, 1.15],
    [2.05, 0, 1.25],
    [-2.85, 0, 1.9],
    [-3.15, 0, -1.55],
    [3.2, 0, -1.65],
    [1.55, PODIUM_H, -1.85],
  ];
  palmSpots.forEach(([x, y, z]) => {
    const p = makePalm();
    p.scale.setScalar(1.35);
    p.position.set(x, y, z);
    scene.add(p);
  });

  const humans = new THREE.Group();
  const guyLobby = makeHuman();
  guyLobby.position.set(0.55, 0, 2.55);
  guyLobby.rotation.y = Math.PI * 0.15;
  const guySky = makeHuman();
  humans.add(guyLobby, guySky);
  scene.add(humans);

  const floors: FloorRig[] = [];
  const pickables: THREE.Object3D[] = [];
  const glassMats: THREE.MeshStandardMaterial[] = [];

  for (let n = 1; n <= FLOORS; n++) {
    const group = new THREE.Group();
    const { w, d, r } = plateSize(n);
    const status = floorStatus(n);
    const accent = hexNum(STATUS_HEX[status]);
    const y = floorBase(n);

    const edge = new THREE.MeshStandardMaterial({
      color: 0x1a1612,
      emissive: CHAMPAGNE,
      emissiveIntensity: 0.12,
      metalness: 0.48,
      roughness: 0.42,
    });
    const deck = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.52, metalness: 0.2 });
    const tex = facadeMap(n * 97, true);
    const glass = new THREE.MeshStandardMaterial({
      map: tex,
      color: GLASS_TINT,
      emissive: 0xffb060,
      emissiveMap: tex,
      emissiveIntensity: 0.72,
      roughness: 0.1,
      metalness: 0.46,
      transparent: true,
      opacity: 0.94,
    });
    glassMats.push(glass);

    const bodyW = w * 0.93;
    const bodyD = d * 0.9;
    const slab = new THREE.Mesh(makePlate(w + 0.3, d + 0.3, r + 0.05, 0.03, segs), edge);
    slab.position.y = 0;
    slab.castShadow = true;
    group.add(slab);

    const inner = new THREE.Mesh(makePlate(bodyW + 0.04, bodyD + 0.04, r * 0.7, 0.02, segs), deck);
    inner.position.y = 0.01;
    group.add(inner);

    const darkGlass = new THREE.MeshStandardMaterial({
      color: 0x0c161c,
      metalness: 0.58,
      roughness: 0.08,
      transparent: true,
      opacity: 0.82,
    });
    const shell = new THREE.Mesh(new RoundedBoxGeometry(bodyW, GLASS_H, bodyD, 3, r * 0.5), darkGlass);
    shell.position.y = 0.03 + GLASS_H / 2;
    group.add(shell);
    const faceH = GLASS_H * 0.9;
    const faceY = 0.03 + GLASS_H / 2;
    const facades: Array<[number, number, number, number]> = [
      [0, bodyD / 2 + 0.012, 0, bodyW * 0.86],
      [0, -(bodyD / 2 + 0.012), Math.PI, bodyW * 0.86],
      [bodyW / 2 + 0.012, 0, Math.PI / 2, bodyD * 0.86],
      [-(bodyW / 2 + 0.012), 0, -Math.PI / 2, bodyD * 0.86],
    ];
    facades.forEach(([x, z, rot, width]) => {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(width, faceH), glass);
      pane.position.set(x, faceY, z);
      pane.rotation.y = rot;
      pane.userData.floor = n;
      group.add(pane);
      pickables.push(pane);
    });

    const loop = roundedLoop(w + 0.28, d + 0.28, r + 0.04, 0.2, segs);
    const rail = new THREE.Mesh(new THREE.TubeGeometry(loop, mobile ? 48 : 80, 0.01, 5, true), railGlass);
    group.add(rail);
    const shoe = new THREE.Mesh(
      new THREE.TubeGeometry(roundedLoop(w + 0.28, d + 0.28, r + 0.04, 0.02, segs), mobile ? 48 : 80, 0.018, 5, true),
      edgeGlow,
    );
    group.add(shoe);

    const led = new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 0.75,
      roughness: 0.22,
    });
    const pip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.36, 0.045), led);
    pip.position.set(w * 0.42, SLAB_T + 0.22, d * 0.4);
    group.add(pip);

    const interiors = new THREE.Group();
    interiors.visible = false;
    const roomM = [
      new THREE.MeshStandardMaterial({ color: 0xe8d8b8, roughness: 0.6, metalness: 0.04 }),
      new THREE.MeshStandardMaterial({ color: 0xc4b49a, roughness: 0.55, metalness: 0.06 }),
      new THREE.MeshStandardMaterial({ color: 0x8a9aaa, roughness: 0.5, metalness: 0.08 }),
      new THREE.MeshStandardMaterial({ color: 0x6a8a7a, roughness: 0.55, metalness: 0.05 }),
    ];
    const rooms: Array<[number, number, number, number, number]> = [
      [-0.35, 0.22, 0.9, 0.7, 0],
      [0.45, 0.2, 0.7, 0.55, 1],
      [-0.4, -0.28, 0.7, 0.5, 2],
      [0.4, -0.28, 0.65, 0.48, 3],
    ];
    rooms.forEach(([x, z, rw, rd, mi]) => {
      const rm = new THREE.Mesh(new THREE.BoxGeometry(rw, GLASS_H * 0.72, rd), roomM[mi]);
      rm.position.set(x, SLAB_T + GLASS_H * 0.4, z);
      interiors.add(rm);
    });
    group.add(interiors);

    if (n === 8 || n === 11) {
      const garden = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.42), leafPlanter);
      garden.position.set(w * 0.15, SLAB_T + 0.02, -d * 0.55);
      group.add(garden);
      const p = makePalm();
      p.scale.setScalar(0.55);
      p.position.set(w * 0.15, SLAB_T + 0.02, -d * 0.55);
      group.add(p);
    }

    if (n === 12) {
      const amenity = new THREE.Mesh(makePlate(w + 0.85, d + 1.05, 0.48, 0.04, segs), deck);
      amenity.position.y = F2F;
      group.add(amenity);
      const skyPool = new THREE.Mesh(makePlate(2.55, 1.15, 0.36, 0.06, segs), water);
      skyPool.position.set(0.15, F2F + 0.06, 0.12);
      group.add(skyPool);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.025, 0.08), new THREE.MeshBasicMaterial({ color: 0x5cffee }));
      lip.position.set(0.15, F2F + 0.08, 0.7);
      group.add(lip);
      const pergola = new THREE.MeshStandardMaterial({ color: PAPER, metalness: 0.45, roughness: 0.28 });
      for (let i = 0; i < 5; i++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.02, 0.045), pergola);
        slat.position.set(-0.55, F2F + 0.42, -0.45 + i * 0.12);
        group.add(slat);
      }
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.4, 0.04), bronze);
      post.position.set(-1.2, F2F + 0.22, -0.22);
      group.add(post, post.clone().translateX(1.3));
      const skyPalm = makePalm();
      skyPalm.scale.setScalar(0.7);
      skyPalm.position.set(-0.95, F2F, 0.45);
      group.add(skyPalm);
      guySky.position.set(0.55, y + F2F, 0.55);
      guySky.rotation.y = -0.7;
    }

    group.position.y = y;
    group.userData.floor = n;
    slab.userData.floor = n;
    shell.userData.floor = n;
    scene.add(group);
    pickables.push(slab, shell);
    floors.push({ n, group, pick: slab, interiors, glass, edge, led, core: darkGlass });
  }

  const skyPoolLight = new THREE.PointLight(0x2ad4c8, 18, 6, 2);
  skyPoolLight.position.set(0.3, floorBase(12) + F2F + 0.3, 0.2);
  scene.add(skyPoolLight);

  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let selected = 10;
  let paused = false;
  let preset: CameraPreset = "orbit";
  let lightMode: LightMode = "night";
  let raf = 0;
  let hover: number | null = null;
  let pointerDown = false;
  let drag = 0;
  let lastX = 0;
  let lastY = 0;

  const camFrom = new THREE.Vector3();
  const camTo = new THREE.Vector3();
  const tgtFrom = new THREE.Vector3();
  const tgtTo = new THREE.Vector3();
  let fly = 1;

  const presetPose = (p: CameraPreset, floor: number) => {
    const y = floorBase(floor) + F2F * 0.45;
    const { d } = plateSize(floor);
    if (p === "street") return { pos: new THREE.Vector3(4.2, 1.55, 6.6), tgt: new THREE.Vector3(0, 1.15, 1.4) };
    if (p === "sky") return { pos: new THREE.Vector3(4.4, floorBase(12) + 2.8, 4.6), tgt: new THREE.Vector3(0.2, floorBase(12) + F2F + 0.04, 0.1) };
    if (p === "cutaway") return { pos: new THREE.Vector3(5.6, y + 0.55, 4.4), tgt: new THREE.Vector3(0, y + 0.2, 0) };
    if (p === "balcony") return { pos: new THREE.Vector3(-0.1, y + 0.16, d / 2 + 0.55), tgt: new THREE.Vector3(-2.4, y + 0.02, 3.8) };
    return { pos: new THREE.Vector3(8.4, 5.8, 9.6), tgt: new THREE.Vector3(0, 4.6, 0) };
  };

  const flyTo = (p: CameraPreset, floor: number) => {
    const pose = presetPose(p, floor);
    camFrom.copy(camera.position);
    tgtFrom.copy(controls.target);
    camTo.copy(pose.pos);
    tgtTo.copy(pose.tgt);
    fly = 0;
    controls.enabled = false;
    controls.autoRotate = false;
    if (p === "balcony") {
      controls.minDistance = 0.7;
      controls.maxDistance = 5.5;
      controls.minPolarAngle = 0.7;
      controls.maxPolarAngle = 1.55;
    } else if (p === "street") {
      controls.minDistance = 3.4;
      controls.maxDistance = 14;
      controls.minPolarAngle = 0.85;
      controls.maxPolarAngle = 1.5;
    } else if (p === "sky") {
      controls.minDistance = 2.4;
      controls.maxDistance = 12;
      controls.minPolarAngle = 0.25;
      controls.maxPolarAngle = 1.25;
    } else {
      controls.minDistance = 4.2;
      controls.maxDistance = 26;
      controls.minPolarAngle = 0.28;
      controls.maxPolarAngle = 1.42;
    }
  };

  const applyCutaway = () => {
    const xray = preset === "cutaway";
    floors.forEach((f) => {
      const on = f.n === selected;
      const above = f.n > selected;
      f.interiors.visible = xray && on;
      if (xray) {
        f.group.visible = true;
        f.glass.opacity = on ? 0.1 : above ? 0.12 : 0.55;
        f.core.opacity = on ? 0.08 : above ? 0.1 : 0.7;
        f.glass.transparent = true;
        f.group.position.x = on ? 0.14 : 0;
        f.group.scale.setScalar(above ? 0.985 : 1);
      } else {
        f.group.visible = true;
        f.glass.opacity = 0.94;
        f.core.opacity = 0.82;
        f.group.position.x = on ? 0.04 : 0;
        f.group.scale.setScalar(1);
      }
    });
  };

  const paint = () => {
    floors.forEach((f) => {
      const on = f.n === selected;
      const hot = f.n === hover;
      f.edge.emissiveIntensity = on ? 0.28 : hot ? 0.2 : 0.12;
      f.led.emissiveIntensity = on ? 1.25 : hot ? 0.95 : 0.7;
    });
    applyCutaway();
  };

  const applyLight = (mode: LightMode) => {
    lightMode = mode;
    if (mode === "day") {
      renderer.setClearColor(0xb7cfe0, 1);
      renderer.toneMappingExposure = 1.02;
      fog.color.set(0xc5d6e4);
      fog.density = 0.012;
      hemi.color.set(0xddeeff);
      hemi.groundColor.set(0x8a7a60);
      hemi.intensity = 1.15;
      key.color.set(0xfff6e4);
      key.intensity = 2.05;
      key.position.set(12, 18, 8);
      rim.color.set(0x88aacc);
      rim.intensity = 0.7;
      lobby.intensity = 3;
      poolL.intensity = 3;
      porte.intensity = 2;
      skyPoolLight.intensity = 3;
      water.opacity = 0.8;
      champagne.emissiveIntensity = 0.08;
      bronze.emissiveIntensity = 0.06;
      edgeGlow.emissiveIntensity = 0.28;
      glassMats.forEach((m) => {
        m.emissiveIntensity = 0.12;
        m.color.set(0x1c2a32);
      });
    } else if (mode === "golden") {
      renderer.setClearColor(0x2a1a10, 1);
      renderer.toneMappingExposure = 1.16;
      fog.color.set(0x2a1a10);
      fog.density = 0.028;
      hemi.color.set(0xffc878);
      hemi.groundColor.set(0x3a2414);
      hemi.intensity = 0.7;
      key.color.set(0xff9a40);
      key.intensity = 1.7;
      key.position.set(14, 7, 4);
      rim.color.set(0x4a3058);
      rim.intensity = 0.45;
      lobby.intensity = 6;
      poolL.intensity = 5;
      porte.intensity = 5;
      skyPoolLight.intensity = 5;
      water.opacity = 0.9;
      champagne.emissiveIntensity = 0.28;
      bronze.emissiveIntensity = 0.2;
      edgeGlow.emissiveIntensity = 0.7;
      glassMats.forEach((m) => {
        m.emissiveIntensity = 0.48;
        m.color.set(0x2a2018);
      });
    } else {
      renderer.setClearColor(OBSIDIAN, 1);
      renderer.toneMappingExposure = 1.2;
      fog.color.set(OBSIDIAN);
      fog.density = 0.038;
      hemi.color.set(0x6a7a98);
      hemi.groundColor.set(0x121014);
      hemi.intensity = 0.48;
      key.color.set(0xffe8c0);
      key.intensity = 0.7;
      key.position.set(10, 16, 7);
      rim.color.set(0x3a5a78);
      rim.intensity = 0.55;
      lobby.intensity = 7;
      poolL.intensity = 6;
      porte.intensity = 5;
      skyPoolLight.intensity = 6;
      water.opacity = 0.94;
      champagne.emissiveIntensity = 0.22;
      bronze.emissiveIntensity = 0.16;
      edgeGlow.emissiveIntensity = 0.85;
      glassMats.forEach((m) => {
        m.emissiveIntensity = 0.72;
        m.color.set(GLASS_TINT);
      });
    }
  };

  paint();
  applyLight("night");

  const size = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  size();

  const ndc = (cssX: number, cssY: number) => {
    const r = canvas.getBoundingClientRect();
    ptr.x = ((cssX - r.left) / r.width) * 2 - 1;
    ptr.y = -((cssY - r.top) / r.height) * 2 + 1;
  };

  const pick = (cssX: number, cssY: number): number | null => {
    ndc(cssX, cssY);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(pickables, false)[0];
    const n = hit?.object.userData.floor;
    return typeof n === "number" ? n : null;
  };

  const onPointerDown = (e: PointerEvent) => {
    pointerDown = true;
    drag = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    if (fly < 1) {
      fly = 1;
      controls.target.copy(tgtTo);
      controls.enabled = true;
    } else {
      fly = 1;
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    if (pointerDown) {
      drag += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
      lastX = e.clientX;
      lastY = e.clientY;
      return;
    }
    const n = pick(e.clientX, e.clientY);
    if (n !== hover) {
      hover = n;
      paint();
    }
  };
  const onPointerUp = (e: PointerEvent) => {
    const was = pointerDown;
    pointerDown = false;
    if (!was || drag > 10) return;
    const n = pick(e.clientX, e.clientY);
    if (n) {
      selected = n;
      paint();
      if (preset === "cutaway" || preset === "balcony") flyTo(preset, selected);
      opts.onSelect(n);
    }
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointerleave", () => {
    pointerDown = false;
    hover = null;
    paint();
  });
  window.addEventListener("resize", size);

  const tick = (t: number) => {
    if (!paused) {
      if (fly < 1) {
        fly = Math.min(1, fly + 0.045);
        const k = 1 - (1 - fly) ** 3;
        camera.position.lerpVectors(camFrom, camTo, k);
        const look = tgtFrom.clone().lerp(tgtTo, k);
        camera.lookAt(look);
        if (fly >= 1) {
          controls.target.copy(tgtTo);
          controls.enabled = true;
          controls.autoRotate = preset === "orbit" && !reduced;
        }
      } else {
        controls.update();
      }
      const pulse = 0.82 + Math.sin(t * 0.002) * 0.18;
      if (lightMode === "night") {
        lobby.intensity = 6.5 * pulse;
        porte.intensity = 5 * pulse;
        water.opacity = 0.86 + Math.sin(t * 0.003) * 0.08;
      }
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    setFloor: (n: number) => {
      selected = n;
      paint();
      if (preset === "cutaway" || preset === "balcony" || preset === "sky") flyTo(preset, selected);
    },
    setPaused: (p: boolean) => {
      paused = p;
    },
    setPreset: (p: CameraPreset) => {
      preset = p;
      paint();
      flyTo(p, selected);
    },
    setLight: (m: LightMode) => {
      applyLight(m);
    },
    setHumans: (on: boolean) => {
      humans.visible = on;
    },
    resize: size,
    pick,
    dispose: () => {
      cancelAnimationFrame(raf);
      controls.dispose();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", size);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const m = obj.material;
          if (Array.isArray(m)) m.forEach((x) => x.dispose());
          else if (m) m.dispose();
        }
      });
    },
  };
}

export function statusForFloor(n: number): Availability {
  return floorStatus(n);
}
