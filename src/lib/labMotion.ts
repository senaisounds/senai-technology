/** Deterministic 6.00s NYC ↔ ADDIS signal-routing choreography. Everything is a function of t. */

export const DURATION = 6;
export const FPS = 60;
export const FRAMES = DURATION * FPS;

export const PHASES = [
  { id: "00", t: 0, label: "Ignition" },
  { id: "01", t: 1.5, label: "Orbital Lock" },
  { id: "02", t: 3.0, label: "Ge'ez Morph" },
  { id: "03", t: 4.5, label: "Harmonic Resolve" },
] as const;

export type LayerId = "grid" | "vectors" | "keyframes" | "telemetry";

export const clampT = (t: number) => {
  const m = ((t % DURATION) + DURATION) % DURATION;
  return m;
};

export const tToFrame = (t: number) => Math.round(clampT(t) * FPS) % FRAMES;

export const frameToT = (f: number) => {
  const n = ((f % FRAMES) + FRAMES) % FRAMES;
  return n / FPS;
};

export type Phase = (typeof PHASES)[number];

export const phaseAt = (t: number): Phase => {
  const p = clampT(t);
  let cur: Phase = PHASES[0];
  for (const ph of PHASES) if (p >= ph.t) cur = ph;
  return cur;
};

const ease = (x: number) => x * x * (3 - 2 * x);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export type Packet = { id: number; x: number; y: number; a: number };
export type MotionState = {
  t: number;
  frame: number;
  phase: Phase;
  orbit: number;
  lock: number;
  morph: number;
  resolve: number;
  nyc: { x: number; y: number };
  add: { x: number; y: number };
  packets: Packet[];
  glyphs: { ch: string; x: number; y: number; s: number; o: number }[];
  keyframes: { x: number; y: number; on: boolean; label: string }[];
  telemetry: { k: string; v: string }[];
};

const NYC = { x: 180, y: 220 };
const ADD = { x: 780, y: 300 };

export function sceneAt(rawT: number): MotionState {
  const t = clampT(rawT);
  const frame = tToFrame(t);
  const phase = phaseAt(t);
  const ign = ease(clamp01(t / 1.5));
  const lock = ease(clamp01((t - 1.5) / 1.5));
  const morph = ease(clamp01((t - 3.0) / 1.5));
  const resolve = ease(clamp01((t - 4.5) / 1.5));
  const orbit = t * Math.PI * 2 * (0.35 + lock * 0.4);

  const nyc = { x: NYC.x + Math.sin(t * 1.7) * 6 * ign, y: NYC.y + Math.cos(t * 1.3) * 4 * ign };
  const add = { x: ADD.x + Math.cos(t * 1.5) * 6 * ign, y: ADD.y + Math.sin(t * 1.1) * 5 * ign };

  const packets: Packet[] = [];
  for (let i = 0; i < 7; i++) {
    const u = (t / DURATION + i / 7) % 1;
    const travel = ease(u);
    const sag = Math.sin(travel * Math.PI) * (36 + i * 4) * (0.4 + lock);
    const x = nyc.x + (add.x - nyc.x) * travel;
    const y = nyc.y + (add.y - nyc.y) * travel - sag;
    packets.push({ id: i, x, y, a: 0.25 + 0.75 * Math.sin(u * Math.PI) * ign });
  }

  const glyphs = ["ሰ", "ና", "ይ"].map((ch, i) => {
    const spin = orbit + i * 2.094;
    const r = 52 + morph * 28;
    return {
      ch,
      x: 480 + Math.cos(spin) * r,
      y: 250 + Math.sin(spin) * r * 0.62,
      s: 18 + morph * 16,
      o: 0.15 + morph * 0.85,
    };
  });

  const keyframes = PHASES.map((ph) => {
    const u = ph.t / DURATION;
    return {
      x: nyc.x + (add.x - nyc.x) * u,
      y: nyc.y + (add.y - nyc.y) * u - Math.sin(u * Math.PI) * 40,
      on: t >= ph.t,
      label: ph.label,
    };
  });

  const bpm = 92 + Math.round(lock * 18 + resolve * 8);
  const telemetry = [
    { k: "T", v: t.toFixed(2) },
    { k: "FR", v: String(frame).padStart(3, "0") },
    { k: "PH", v: `${phase.id} ${phase.label}` },
    { k: "NYC", v: `${nyc.x.toFixed(0)},${nyc.y.toFixed(0)}` },
    { k: "ADD", v: `${add.x.toFixed(0)},${add.y.toFixed(0)}` },
    { k: "LOCK", v: `${Math.round(lock * 100)}%` },
    { k: "BPM", v: String(bpm) },
    { k: "ROUTE", v: resolve > 0.8 ? "HARMONIC" : lock > 0.5 ? "ORBITAL" : "IGNITE" },
  ];

  return { t, frame, phase, orbit, lock: lock, morph, resolve, nyc, add, packets, glyphs, keyframes, telemetry };
}

export function motionSpec(state: MotionState, layers: Record<LayerId, boolean>, speed: number) {
  return {
    title: "NYC ↔ ADDIS SIGNAL ROUTING",
    duration: DURATION,
    fps: FPS,
    frames: FRAMES,
    speed,
    t: Number(state.t.toFixed(4)),
    frame: state.frame,
    phase: state.phase,
    layers,
    nodes: { nyc: state.nyc, addis: state.add },
    packets: state.packets.map((p) => ({ id: p.id, x: +p.x.toFixed(2), y: +p.y.toFixed(2) })),
    play: "play()",
    pause: "pause()",
    seek: "seek(t ∈ [0, 6])",
  };
}
