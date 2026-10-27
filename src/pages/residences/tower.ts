import * as THREE from "three";
import { FLOORS, floorStatus, STATUS_HEX, type Availability } from "./data";

export type TowerHandle = {
  setFloor: (n: number) => void;
  setPaused: (paused: boolean) => void;
  resize: () => void;
  pick: (cssX: number, cssY: number) => number | null;
  dispose: () => void;
};

const OBSIDIAN = 0x0b0b0d;
const PAPER = 0xf4f1ea;
const GOLD = 0xffd400;

function hexNum(hex: string): number {
  return parseInt(hex.slice(1), 16);
}

function windowMap(seed: number, lit = 0.72): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#14120f";
  ctx.fillRect(0, 0, 256, 128);
  let s = seed + 17;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0xffff) / 0xffff;
  };
  const cols = 8;
  const rows = 3;
  const gw = 256 / cols;
  const gh = 128 / rows;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (rnd() > lit) continue;
      const warm = 0.55 + rnd() * 0.45;
      ctx.fillStyle = `rgba(255, ${Math.round(176 + rnd() * 50)}, ${Math.round(90 + rnd() * 40)}, ${warm})`;
      ctx.fillRect(x * gw + 6, y * gh + 8, gw - 12, gh - 16);
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

export function createTower(
  canvas: HTMLCanvasElement,
  opts: { mobile: boolean; reduced: boolean; onSelect: (floor: number) => void },
): TowerHandle {
  const mobile = opts.mobile;
  const reduced = opts.reduced;
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
  renderer.toneMappingExposure = 1.05;
  if (!mobile) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(OBSIDIAN, 0.046);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
  const orbit = {
    az: 0.72,
    pol: 1.18,
    dist: mobile ? 16.4 : 14.2,
    target: new THREE.Vector3(0, 3.4, 0),
  };

  const applyCam = () => {
    const x = orbit.dist * Math.sin(orbit.pol) * Math.cos(orbit.az);
    const y = orbit.dist * Math.cos(orbit.pol);
    const z = orbit.dist * Math.sin(orbit.pol) * Math.sin(orbit.az);
    camera.position.set(orbit.target.x + x, orbit.target.y + y, orbit.target.z + z);
    camera.lookAt(orbit.target);
  };

  const hemi = new THREE.HemisphereLight(0x8a9bb8, 0x1a1612, 0.55);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff1d0, 1.35);
  key.position.set(8, 14, 6);
  if (!mobile) {
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 2;
    key.shadow.camera.far = 40;
    key.shadow.camera.left = -10;
    key.shadow.camera.right = 10;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -6;
  }
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x4a5a78, 0.45);
  rim.position.set(-8, 4, -10);
  scene.add(rim);
  const lobbyLight = new THREE.PointLight(0xffc56a, 18, 8, 2);
  lobbyLight.position.set(0, 1.1, 1.4);
  scene.add(lobbyLight);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(22, 64),
    new THREE.MeshStandardMaterial({ color: 0x121114, roughness: 0.92, metalness: 0.08 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(3.4, 3.48, 80),
    new THREE.MeshBasicMaterial({ color: GOLD, transparent: true, opacity: 0.35, side: THREE.DoubleSide }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  scene.add(ring);

  const cityMat = new THREE.MeshStandardMaterial({ color: 0x16151a, roughness: 0.95, metalness: 0.02 });
  for (let i = 0; i < (mobile ? 10 : 18); i++) {
    const a = (i / 18) * Math.PI * 2 + 0.2;
    const r = 9 + (i % 5) * 1.1;
    const h = 0.8 + (i % 7) * 0.55;
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.7 + (i % 3) * 0.2, h, 0.6), cityMat);
    box.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
    scene.add(box);
  }

  const stone = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 0.62, metalness: 0.18 });
  const podium = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.15, 4.1), stone);
  podium.position.set(0, 0.575, 0);
  podium.castShadow = true;
  podium.receiveShadow = true;
  scene.add(podium);

  const glassLobby = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.72, 0.12),
    new THREE.MeshStandardMaterial({
      color: 0xffe1a8,
      emissive: 0xffb347,
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.72,
      roughness: 0.12,
      metalness: 0.4,
    }),
  );
  glassLobby.position.set(0, 0.62, 2.08);
  scene.add(glassLobby);

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 1.1), new THREE.MeshStandardMaterial({ color: 0x1a1814, metalness: 0.4, roughness: 0.4 }));
  canopy.position.set(0, 1.22, 2.15);
  scene.add(canopy);

  const steps = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.7), stone);
  steps.position.set(0, 0.06, 2.35);
  scene.add(steps);

  const floors: { group: THREE.Group; mats: THREE.MeshStandardMaterial[] }[] = [];
  const pickables: THREE.Object3D[] = [];
  const concrete = new THREE.MeshStandardMaterial({ color: 0x222018, roughness: 0.55, metalness: 0.22 });
  const rail = new THREE.MeshStandardMaterial({ color: PAPER, roughness: 0.25, metalness: 0.55 });

  for (let n = 1; n <= FLOORS; n++) {
    const group = new THREE.Group();
    const y = 1.2 + (n - 0.5) * 0.52;
    const inset = n >= 12 ? 0.28 : n >= 8 ? 0.08 : 0;
    const w = 3.15 - inset;
    const d = 2.45 - inset * 0.6;
    const status = floorStatus(n);
    const accent = hexNum(STATUS_HEX[status]);

    const slab = new THREE.Mesh(new THREE.BoxGeometry(w, 0.46, d), concrete);
    slab.castShadow = true;
    slab.receiveShadow = true;
    group.add(slab);

    const tex = windowMap(n * 97, 0.62 + (n % 3) * 0.08);
    const glass = new THREE.MeshStandardMaterial({
      map: tex,
      color: 0xf2e6c8,
      emissive: 0xffb56a,
      emissiveMap: tex,
      emissiveIntensity: 0.55,
      roughness: 0.18,
      metalness: 0.35,
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.18, 0.32), glass);
    face.position.set(0, 0.02, d / 2 + 0.012);
    group.add(face);
    const faceB = face.clone();
    faceB.position.z = -(d / 2 + 0.012);
    faceB.rotation.y = Math.PI;
    group.add(faceB);

    const balcMat = new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 0.22,
      metalness: 0.45,
      roughness: 0.35,
    });
    const balc = new THREE.Mesh(new THREE.BoxGeometry(w * 0.42, 0.045, 0.42), balcMat);
    balc.position.set(-w * 0.22, -0.14, d / 2 + 0.2);
    group.add(balc);
    const balc2 = balc.clone();
    balc2.position.x = w * 0.22;
    group.add(balc2);

    const trim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.04, 0.03, d + 0.04), rail);
    trim.position.y = 0.23;
    group.add(trim);

    if (n === 12) {
      const deck = new THREE.Mesh(
        new THREE.BoxGeometry(w + 0.7, 0.05, d + 0.85),
        new THREE.MeshStandardMaterial({ color: 0x2c261c, roughness: 0.5, metalness: 0.2 }),
      );
      deck.position.y = 0.28;
      group.add(deck);
      const pool = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.04, 0.42),
        new THREE.MeshStandardMaterial({ color: 0x7ad4c8, emissive: 0x2a8f86, emissiveIntensity: 0.55, roughness: 0.1 }),
      );
      pool.position.set(0.55, 0.33, 0.15);
      group.add(pool);
      for (let i = 0; i < 5; i++) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.03, 0.06), rail);
        slat.position.set(-0.55, 0.62, -0.45 + i * 0.14);
        group.add(slat);
      }
      const postL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.4, 0.05), rail);
      postL.position.set(-1.2, 0.48, -0.2);
      const postR = postL.clone();
      postR.position.x = 0.1;
      group.add(postL, postR);
    }

    group.position.y = y;
    group.userData.floor = n;
    scene.add(group);
    pickables.push(slab);
    slab.userData.floor = n;
    floors.push({ group, mats: [balcMat] });
  }

  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  let selected = 10;
  let paused = false;
  let raf = 0;
  let dragging = false;
  let dragDist = 0;
  let lastX = 0;
  let lastY = 0;
  let pinch = 0;
  let auto = 0;
  let hover: number | null = null;

  const paint = (floor: number, hov: number | null) => {
    floors.forEach((f, i) => {
      const n = i + 1;
      const on = n === floor;
      const hot = n === hov;
      f.group.position.x = on ? 0.08 : 0;
      f.mats.forEach((m) => {
        m.emissiveIntensity = on ? 0.55 : hot ? 0.4 : 0.2;
      });
    });
    orbit.target.y = 1.2 + (floor - 0.5) * 0.52;
  };
  paint(selected, null);

  const size = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  size();
  applyCam();

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
    dragging = true;
    dragDist = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent) => {
    if (dragging) {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      dragDist += Math.abs(dx) + Math.abs(dy);
      lastX = e.clientX;
      lastY = e.clientY;
      orbit.az += dx * 0.008;
      orbit.pol = Math.min(1.45, Math.max(0.55, orbit.pol - dy * 0.006));
      auto = 0;
      return;
    }
    const n = pick(e.clientX, e.clientY);
    if (n !== hover) {
      hover = n;
      paint(selected, hover);
    }
  };
  const onPointerUp = (e: PointerEvent) => {
    const wasDrag = dragging;
    dragging = false;
    if (!wasDrag || dragDist > 10) return;
    const n = pick(e.clientX, e.clientY);
    if (n) {
      selected = n;
      paint(selected, n);
      opts.onSelect(n);
    }
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    orbit.dist = Math.min(22, Math.max(9.5, orbit.dist + e.deltaY * 0.01));
  };
  const onTouch = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      const a = e.touches[0];
      const b = e.touches[1];
      const d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (pinch) orbit.dist = Math.min(22, Math.max(9.5, orbit.dist * (pinch / d)));
      pinch = d;
    } else {
      pinch = 0;
    }
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointerleave", () => {
    dragging = false;
    hover = null;
    paint(selected, null);
  });
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("touchmove", onTouch, { passive: true });
  window.addEventListener("resize", size);

  const tick = (t: number) => {
    if (!paused) {
      if (!dragging && !reduced) {
        auto += 0.0016;
        orbit.az += 0.0016;
      }
      applyCam();
      const pulse = 0.75 + Math.sin(t * 0.002) * 0.15;
      lobbyLight.intensity = 16 * pulse;
      renderer.render(scene, camera);
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    setFloor: (n: number) => {
      selected = n;
      paint(selected, hover);
    },
    setPaused: (p: boolean) => {
      paused = p;
    },
    resize: size,
    pick,
    dispose: () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchmove", onTouch);
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
