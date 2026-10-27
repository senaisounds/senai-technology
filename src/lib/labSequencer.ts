/** 4-row × 16-step Ethio-electronic pulse engine (Tizita lead, sub, kebero, hat). */

export const STEPS = 16;
export const ROWS = ["lead", "bass", "drum", "hat"] as const;
export type RowId = (typeof ROWS)[number];
export type Pattern = Record<RowId, boolean[]>;

export const TIZITA = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];

const empty = (): boolean[] => Array.from({ length: STEPS }, () => false);
const hits = (...idx: number[]) => {
  const row = empty();
  idx.forEach((i) => {
    if (i >= 0 && i < STEPS) row[i] = true;
  });
  return row;
};

export const PRESETS: { id: string; name: string; bpm: number; swing: number; pattern: Pattern }[] = [
  {
    id: "addis",
    name: "Addis Midnight",
    bpm: 108,
    swing: 0.18,
    pattern: {
      lead: hits(0, 3, 6, 10, 12, 15),
      bass: hits(0, 4, 8, 11, 14),
      drum: hits(0, 3, 6, 8, 11, 14),
      hat: hits(0, 2, 4, 5, 8, 10, 12, 13),
    },
  },
  {
    id: "brooklyn",
    name: "Brooklyn Warehouse",
    bpm: 128,
    swing: 0.08,
    pattern: {
      lead: hits(0, 4, 7, 12),
      bass: hits(0, 3, 4, 8, 11, 12),
      drum: hits(0, 4, 8, 10, 12),
      hat: hits(0, 1, 2, 3, 4, 6, 8, 9, 10, 11, 12, 14),
    },
  },
  {
    id: "minimal",
    name: "Minimal Pulse",
    bpm: 96,
    swing: 0.12,
    pattern: {
      lead: hits(0, 8, 14),
      bass: hits(0, 8),
      drum: hits(0, 6, 8, 14),
      hat: hits(2, 6, 10, 14),
    },
  },
];

function audioContext(): AudioContext {
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new Ctor();
}

export type Sequencer = {
  play: () => Promise<void>;
  stop: () => void;
  isPlaying: () => boolean;
  setBpm: (n: number) => void;
  setSwing: (n: number) => void;
  setPattern: (p: Pattern) => void;
  toggle: (row: RowId, step: number) => void;
  clear: () => void;
  loadPreset: (id: string) => Pattern | null;
  getStep: () => number;
  getLevels: () => { rms: number; bars: number[] };
  dispose: () => void;
};

export function createSequencer(initial: Pattern = PRESETS[0].pattern): Sequencer {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let analyser: AnalyserNode | null = null;
  let playing = false;
  let bpm = 108;
  let swing = 0.18;
  let pattern: Pattern = {
    lead: [...initial.lead],
    bass: [...initial.bass],
    drum: [...initial.drum],
    hat: [...initial.hat],
  };
  let nextNote = 0;
  let step = 0;
  let timer = 0;
  const freq = new Uint8Array(64);
  const time = new Uint8Array(128);
  const bars = [0, 0, 0, 0, 0, 0, 0, 0];

  const ensure = async () => {
    if (!ctx) {
      ctx = audioContext();
      master = ctx.createGain();
      master.gain.value = 0.28;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -18;
      comp.knee.value = 8;
      comp.ratio.value = 3;
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      master.connect(comp);
      comp.connect(analyser);
      analyser.connect(ctx.destination);
    }
    if (ctx.state === "suspended") await ctx.resume();
  };

  const tone = (freqHz: number, t: number, dur: number, type: OscillatorType, gain: number, cutoff: number) => {
    if (!ctx || !master) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freqHz, t);
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.setValueAtTime(cutoff, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f);
    f.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  };

  const noiseHit = (t: number, dur: number, hp: number, gain: number) => {
    if (!ctx || !master) return;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = hp;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(master);
    src.start(t);
    src.stop(t + dur + 0.01);
  };

  const trigger = (row: RowId, i: number, t: number) => {
    if (row === "lead") {
      const note = TIZITA[i % TIZITA.length];
      tone(note, t, 0.22, "triangle", 0.18, 2400);
      tone(note * 2.01, t, 0.16, "sine", 0.06, 3200);
    } else if (row === "bass") {
      const note = TIZITA[i % 5] / 4;
      if (!ctx || !master) return;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(note * 1.6, t);
      o.frequency.exponentialRampToValueAtTime(note, t + 0.08);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.42, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + 0.4);
    } else if (row === "drum") {
      tone(180, t, 0.09, "sine", 0.28, 800);
      noiseHit(t, 0.08, 900, 0.22);
    } else {
      noiseHit(t, 0.045, 4200, 0.16);
    }
  };

  const tick = () => {
    if (!ctx || !playing) return;
    const look = 0.12;
    const sixteenth = 60 / bpm / 4;
    while (nextNote < ctx.currentTime + look) {
      const i = step % STEPS;
      const swung = i % 2 === 1 ? sixteenth * swing * 0.5 : 0;
      const t = nextNote + swung;
      for (const row of ROWS) if (pattern[row][i]) trigger(row, i, t);
      nextNote += sixteenth;
      step = (step + 1) % STEPS;
    }
  };

  return {
    async play() {
      await ensure();
      if (!ctx) return;
      playing = true;
      step = 0;
      nextNote = ctx.currentTime + 0.06;
      window.clearInterval(timer);
      timer = window.setInterval(tick, 20);
      tick();
    },
    stop() {
      playing = false;
      window.clearInterval(timer);
      step = 0;
    },
    isPlaying: () => playing,
    setBpm: (n) => {
      bpm = Math.min(140, Math.max(90, n));
    },
    setSwing: (n) => {
      swing = Math.min(0.4, Math.max(0, n));
    },
    setPattern: (p) => {
      pattern = { lead: [...p.lead], bass: [...p.bass], drum: [...p.drum], hat: [...p.hat] };
    },
    toggle: (row, i) => {
      pattern[row][i] = !pattern[row][i];
    },
    clear: () => {
      pattern = { lead: empty(), bass: empty(), drum: empty(), hat: empty() };
    },
    loadPreset: (id) => {
      const p = PRESETS.find((x) => x.id === id);
      if (!p) return null;
      pattern = { lead: [...p.pattern.lead], bass: [...p.pattern.bass], drum: [...p.pattern.drum], hat: [...p.pattern.hat] };
      bpm = p.bpm;
      swing = p.swing;
      return pattern;
    },
    getStep: () => (playing ? (step + STEPS - 1) % STEPS : -1),
    getLevels: () => {
      if (!analyser) return { rms: 0, bars };
      analyser.getByteFrequencyData(freq);
      analyser.getByteTimeDomainData(time);
      let s = 0;
      for (let i = 0; i < time.length; i++) {
        const v = (time[i] - 128) / 128;
        s += v * v;
      }
      const rms = Math.sqrt(s / time.length);
      for (let i = 0; i < bars.length; i++) {
        const slice = freq.length / bars.length;
        let acc = 0;
        for (let j = 0; j < slice; j++) acc += freq[i * slice + j] || 0;
        bars[i] = acc / slice / 255;
      }
      return { rms, bars };
    },
    dispose() {
      playing = false;
      window.clearInterval(timer);
      void ctx?.close();
      ctx = null;
    },
  };
}
