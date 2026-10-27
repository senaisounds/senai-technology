import { useEffect, useRef, useState } from "react";
import { createSequencer, PRESETS, ROWS, STEPS, type Pattern, type RowId, type Sequencer } from "../../lib/labSequencer";

const LABELS: Record<RowId, string> = {
  lead: "Tizita Lead",
  bass: "Sub Bass",
  drum: "Kebero / Snare",
  hat: "Hi-Hat / Shaker",
};

export function PulseSequencer() {
  const engine = useRef<Sequencer | null>(null);
  const [pattern, setPattern] = useState<Pattern>(PRESETS[0].pattern);
  const [playing, setPlaying] = useState(false);
  const [bpm, setBpm] = useState(108);
  const [swing, setSwing] = useState(0.18);
  const [step, setStep] = useState(-1);
  const [preset, setPreset] = useState(PRESETS[0].id);
  const [levels, setLevels] = useState({ rms: 0, bars: [0, 0, 0, 0, 0, 0, 0, 0] });
  const waveRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    engine.current = createSequencer(PRESETS[0].pattern);
    return () => engine.current?.dispose();
  }, []);

  useEffect(() => {
    engine.current?.setBpm(bpm);
  }, [bpm]);

  useEffect(() => {
    engine.current?.setSwing(swing);
  }, [swing]);

  useEffect(() => {
    if (!playing) {
      setStep(-1);
      return;
    }
    let raf = 0;
    const loop = () => {
      setStep(engine.current?.getStep() ?? -1);
      const lv = engine.current?.getLevels() ?? { rms: 0, bars: [0, 0, 0, 0, 0, 0, 0, 0] };
      setLevels(lv);
      const c = waveRef.current;
      if (c) {
        const ctx = c.getContext("2d");
        if (ctx) {
          const w = c.width;
          const h = c.height;
          ctx.clearRect(0, 0, w, h);
          ctx.fillStyle = "#ff5a1f";
          lv.bars.forEach((b, i) => {
            const bh = Math.max(2, b * h);
            ctx.globalAlpha = 0.35 + b * 0.65;
            ctx.fillRect((i / lv.bars.length) * w + 2, h - bh, w / lv.bars.length - 4, bh);
          });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const togglePlay = async () => {
    if (playing) {
      engine.current?.stop();
      setPlaying(false);
      return;
    }
    await engine.current?.play();
    setPlaying(true);
  };

  const flip = (row: RowId, i: number) => {
    engine.current?.toggle(row, i);
    setPattern((p) => {
      const next = { ...p, [row]: [...p[row]] };
      next[row][i] = !next[row][i];
      return next;
    });
  };

  const load = (id: string) => {
    const p = engine.current?.loadPreset(id);
    const spec = PRESETS.find((x) => x.id === id);
    if (p && spec) {
      setPattern({ lead: [...p.lead], bass: [...p.bass], drum: [...p.drum], hat: [...p.hat] });
      setBpm(spec.bpm);
      setSwing(spec.swing);
      setPreset(id);
    }
  };

  const clear = () => {
    engine.current?.clear();
    setPattern({
      lead: Array(STEPS).fill(false),
      bass: Array(STEPS).fill(false),
      drum: Array(STEPS).fill(false),
      hat: Array(STEPS).fill(false),
    });
  };

  return (
    <section id="exp-seq" className="lab-exp lab-seq" aria-labelledby="exp-seq-title">
      <div className="lab-exp-head">
        <p className="lab-kicker"><span>04</span> Ascension — Pegassi</p>
        <h2 id="exp-seq-title">16-Step Ethio-Electronic Pulse</h2>
        <p className="lab-lede">Tizita Major lead, analog sub, kebero snap, metallic hat. Play it in the page. No account. No upload.</p>
      </div>

      <div className="lab-seq-board">
        <div className="lab-seq-top">
          <button type="button" className="lab-copy" onClick={() => void togglePlay()}>
            {playing ? "Stop" : "Play"}
          </button>
          <label>
            <span>BPM <b>{bpm}</b></span>
            <input type="range" min={90} max={140} value={bpm} onChange={(e) => setBpm(Number(e.target.value))} />
          </label>
          <label>
            <span>Swing <b>{swing.toFixed(2)}</b></span>
            <input type="range" min={0} max={0.4} step={0.01} value={swing} onChange={(e) => setSwing(Number(e.target.value))} />
          </label>
          <div className="lab-seq-presets">
            {PRESETS.map((p) => (
              <button key={p.id} type="button" className={preset === p.id ? "on" : ""} onClick={() => load(p.id)}>
                {p.name}
              </button>
            ))}
            <button type="button" onClick={clear}>Clear</button>
          </div>
        </div>

        <div className="lab-seq-meter" aria-hidden>
          <canvas ref={waveRef} width={320} height={48} />
          <i style={{ transform: `scaleX(${Math.min(1, levels.rms * 4)})` }} />
        </div>

        <div className="lab-seq-grid" role="grid" aria-label="16-step sequencer">
          {ROWS.map((row) => (
            <div key={row} className="lab-seq-row" role="row">
              <span>{LABELS[row]}</span>
              <div>
                {pattern[row].map((on, i) => (
                  <button
                    key={i}
                    type="button"
                    role="gridcell"
                    aria-pressed={on}
                    className={`${on ? "hit" : ""} ${step === i ? "now" : ""}`}
                    onClick={() => flip(row, i)}
                  >
                    <span className="sr">Step {i + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
