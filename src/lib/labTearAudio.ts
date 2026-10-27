/** Synthesized paper-rip: noise buffer through a moving bandpass, built from scratch. */

function audioContext(): AudioContext {
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new Ctor();
}

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

const ensure = async (): Promise<AudioContext> => {
  if (!ctx) {
    ctx = audioContext();
    const n = Math.floor(ctx.sampleRate * 1.2);
    noise = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = noise.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const white = Math.random() * 2 - 1;
      last = last * 0.62 + white * 0.38;
      d[i] = last;
    }
  }
  if (ctx.state === "suspended") await ctx.resume();
  return ctx;
};

export async function ripBurst(intensity = 0.7, duration = 0.18) {
  const ac = await ensure();
  if (!noise) return;
  const now = ac.currentTime;
  const src = ac.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const bp = ac.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.setValueAtTime(1400 + intensity * 1800, now);
  bp.frequency.exponentialRampToValueAtTime(420 + intensity * 280, now + duration);
  bp.Q.value = 1.1 + intensity * 2.4;
  const hp = ac.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 380;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(0.22 * intensity, now + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  src.connect(bp);
  bp.connect(hp);
  hp.connect(g);
  g.connect(ac.destination);
  src.start(now);
  src.stop(now + duration + 0.02);
}

export async function ripSequence(progressFrom: number, progressTo: number) {
  const delta = Math.abs(progressTo - progressFrom);
  if (delta < 0.03) return;
  const n = Math.min(4, 1 + Math.floor(delta * 6));
  for (let i = 0; i < n; i++) {
    window.setTimeout(() => void ripBurst(0.45 + delta * 0.7, 0.09 + delta * 0.12), i * 28);
  }
}
