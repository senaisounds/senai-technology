import type { StemId } from "./data";

export const FLUX_BPM = 128;

export type Levels = {
  bass: number;
  mid: number;
  high: number;
  bands: Float32Array;
  progress: number;
};

const BANDS = 32;

function noiseBuffer(ctx: AudioContext, seconds = 1) {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export type FluxAudio = {
  enter: (withSound: boolean) => Promise<void>;
  setEnabled: (on: boolean) => Promise<void>;
  isEnabled: () => boolean;
  play: () => void;
  pause: () => void;
  isPlaying: () => boolean;
  toggleStem: (id: StemId) => boolean;
  stemOn: (id: StemId) => boolean;
  getLevels: () => Levels;
  hover: (id: string) => void;
  click: () => void;
  peel: () => void;
  dispose: () => void;
};

export function createFluxAudio(): FluxAudio {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let analyser: AnalyserNode | null = null;
  let noise: AudioBuffer | null = null;
  const stemGain: Partial<Record<StemId, GainNode>> = {};
  const stemState: Record<StemId, boolean> = { kick: true, hat: true, bass: true, pad: true };
  const freq = new Uint8Array(128);
  const bands = new Float32Array(BANDS);
  const levels: Levels = { bass: 0, mid: 0, high: 0, bands, progress: 0 };

  let enabled = false;
  let playing = false;
  let startedAt = 0;
  let pausedElapsed = 0;
  let step = 0;
  let nextNote = 0;
  let timer = 0;
  let lastHover = "";
  let lastHoverAt = 0;
  let uiBus: GainNode | null = null;

  const beat = 60 / FLUX_BPM;
  const sixteenth = beat / 4;
  const BASS = [55, 0, 0, 55, 0, 0, 65.41, 0, 55, 0, 0, 73.42, 0, 0, 49, 0];

  const ensure = async () => {
    if (ctx) {
      if (ctx.state === "suspended") await ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.34;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16;
    comp.knee.value = 10;
    comp.ratio.value = 3.2;
    comp.attack.value = 0.004;
    comp.release.value = 0.14;
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.72;
    master.connect(comp);
    comp.connect(analyser);
    analyser.connect(ctx.destination);

    uiBus = ctx.createGain();
    uiBus.gain.value = 0.11;
    uiBus.connect(ctx.destination);

    noise = noiseBuffer(ctx, 1.2);
    (["kick", "hat", "bass", "pad"] as StemId[]).forEach((id) => {
      const g = ctx!.createGain();
      g.gain.value = 1;
      g.connect(master!);
      stemGain[id] = g;
    });
    if (ctx.state === "suspended") await ctx.resume();
  };

  const kick = (t: number) => {
    if (!ctx || !stemGain.kick) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(168, t);
    osc.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    g.gain.setValueAtTime(0.95, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g).connect(stemGain.kick);
    osc.start(t);
    osc.stop(t + 0.22);

    const click = ctx.createOscillator();
    const cg = ctx.createGain();
    click.type = "square";
    click.frequency.value = 92;
    cg.gain.setValueAtTime(0.16, t);
    cg.gain.exponentialRampToValueAtTime(0.001, t + 0.028);
    click.connect(cg).connect(stemGain.kick);
    click.start(t);
    click.stop(t + 0.04);
  };

  const hat = (t: number, open = false) => {
    if (!ctx || !stemGain.hat || !noise) return;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const bp = ctx.createBiquadFilter();
    bp.type = "highpass";
    bp.frequency.value = open ? 5200 : 7800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(open ? 0.22 : 0.11, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.18 : 0.045));
    src.connect(bp).connect(g).connect(stemGain.hat);
    src.start(t);
    src.stop(t + 0.22);
  };

  const bass = (t: number, freqHz: number) => {
    if (!ctx || !stemGain.bass || !freqHz) return;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const fil = ctx.createBiquadFilter();
    fil.type = "lowpass";
    fil.frequency.setValueAtTime(180 + levels.bass * 420, t);
    fil.Q.value = 8;
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(freqHz, t);
    g.gain.setValueAtTime(0.001, t);
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(fil).connect(g).connect(stemGain.bass);
    osc.start(t);
    osc.stop(t + 0.3);
  };

  const pad = (t: number) => {
    if (!ctx || !stemGain.pad) return;
    if (step % 16 !== 0) return;
    const freqs = [220, 261.63, 329.63];
    for (const f of freqs) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(0.045, t + 0.4);
      g.gain.linearRampToValueAtTime(0.001, t + sixteenth * 16);
      osc.connect(g).connect(stemGain.pad);
      osc.start(t);
      osc.stop(t + sixteenth * 16 + 0.05);
    }
  };

  const schedule = (s: number, t: number) => {
    if (s % 4 === 0) kick(t);
    if (s === 15) kick(t);
    if (s % 2 === 1) hat(t, false);
    if (s === 6 || s === 14) hat(t, true);
    bass(t, BASS[s]);
    pad(t);
  };

  const tick = () => {
    if (!ctx || !playing) return;
    const now = ctx.currentTime;
    while (nextNote < now + 0.16) {
      schedule(step, nextNote);
      step = (step + 1) % 16;
      nextNote += sixteenth;
    }
    timer = window.setTimeout(tick, 25);
  };

  const blip = (kind: "hover" | "click" | "peel") => {
    if (!enabled || !ctx || !uiBus || !noise) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    if (kind === "hover") {
      f.type = "bandpass";
      f.frequency.value = 1800 + Math.random() * 2400;
      f.Q.value = 6;
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    } else if (kind === "click") {
      f.type = "bandpass";
      f.frequency.value = 280 + Math.random() * 160;
      f.Q.value = 3;
      g.gain.setValueAtTime(0.35, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    } else {
      f.type = "highpass";
      f.frequency.value = 1400;
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    }
    src.connect(f).connect(g).connect(uiBus);
    src.start(t);
    src.stop(t + 0.2);
  };

  const read = () => {
    if (analyser) {
      analyser.getByteFrequencyData(freq);
      let b = 0, m = 0, h = 0;
      for (let i = 0; i < BANDS; i++) {
        const v = freq[i * 2] / 255;
        bands[i] = v;
        if (i < 5) b += v;
        else if (i < 16) m += v;
        else h += v;
      }
      levels.bass = levels.bass * 0.62 + (b / 5) * 0.38;
      levels.mid = levels.mid * 0.7 + (m / 11) * 0.3;
      levels.high = levels.high * 0.7 + (h / 16) * 0.3;
    }
    if (ctx && playing) {
      const elapsed = (ctx.currentTime - startedAt + pausedElapsed) % 120;
      levels.progress = elapsed / 120;
    }
    return levels;
  };

  return {
    async enter(withSound) {
      enabled = withSound;
      if (!withSound) return;
      await ensure();
      playing = true;
      startedAt = ctx!.currentTime;
      pausedElapsed = 0;
      step = 0;
      nextNote = ctx!.currentTime + 0.05;
      tick();
    },
    async setEnabled(on) {
      enabled = on;
      if (on) {
        await ensure();
        if (!playing) {
          playing = true;
          startedAt = ctx!.currentTime;
          nextNote = ctx!.currentTime + 0.02;
          tick();
        }
        master?.gain.setTargetAtTime(0.34, ctx!.currentTime, 0.05);
      } else {
        playing = false;
        window.clearTimeout(timer);
        if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
      }
    },
    isEnabled: () => enabled,
    play() {
      if (!enabled || !ctx) return;
      playing = true;
      startedAt = ctx.currentTime;
      nextNote = ctx.currentTime + 0.02;
      tick();
    },
    pause() {
      playing = false;
      window.clearTimeout(timer);
      if (ctx) pausedElapsed += ctx.currentTime - startedAt;
    },
    isPlaying: () => playing,
    toggleStem(id) {
      stemState[id] = !stemState[id];
      const g = stemGain[id];
      if (g && ctx) g.gain.setTargetAtTime(stemState[id] ? 1 : 0, ctx.currentTime, 0.03);
      return stemState[id];
    },
    stemOn: (id) => stemState[id],
    getLevels: read,
    hover(id) {
      const now = performance.now();
      if (id === lastHover && now - lastHoverAt < 90) return;
      lastHover = id;
      lastHoverAt = now;
      blip("hover");
    },
    click: () => blip("click"),
    peel: () => blip("peel"),
    dispose() {
      playing = false;
      window.clearTimeout(timer);
      void ctx?.close();
      ctx = null;
    },
  };
}

let singleton: FluxAudio | null = null;
export function getFluxAudio() {
  if (!singleton) singleton = createFluxAudio();
  return singleton;
}
