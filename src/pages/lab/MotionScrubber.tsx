import { useEffect, useMemo, useRef, useState } from "react";
import {
  DURATION,
  FRAMES,
  PHASES,
  clampT,
  frameToT,
  motionSpec,
  sceneAt,
  tToFrame,
  type LayerId,
} from "../../lib/labMotion";
import { copyText } from "../../lib/copyText";
import { usePrefersReducedMotion } from "../../lib/hooks";

const SPEEDS = [0.25, 0.5, 1, 2] as const;

export function MotionScrubber() {
  const reduced = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(!reduced);
  const [t, setT] = useState(0);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [layers, setLayers] = useState<Record<LayerId, boolean>>({
    grid: true,
    vectors: true,
    keyframes: true,
    telemetry: true,
  });
  const [copied, setCopied] = useState(false);
  const drag = useRef(false);
  const state = useMemo(() => sceneAt(t), [t]);

  useEffect(() => {
    if (!playing || reduced) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000) * speed;
      last = now;
      setT((prev) => clampT(prev + dt));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, reduced]);

  const seek = (next: number) => setT(clampT(next));
  const step = (dir: number) => {
    setPlaying(false);
    seek(frameToT(tToFrame(t) + dir));
  };

  const onScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    seek(x * DURATION);
  };

  const copy = async () => {
    const ok = await copyText(JSON.stringify(motionSpec(state, layers, speed), null, 2));
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const mm = String(Math.floor(state.t)).padStart(2, "0");
  const ss = ((state.t % 1) * 100).toFixed(0).padStart(2, "0");

  return (
    <section id="exp-motion" className="lab-exp lab-motion" aria-labelledby="exp-motion-title">
      <div className="lab-exp-head">
        <p className="lab-kicker"><span>02</span> Motion2Code</p>
        <h2 id="exp-motion-title">NYC ↔ ADDIS Signal Routing</h2>
        <p className="lab-lede">Deterministic 6.00s / 360f @ 60fps. play(), pause(), seek(t). Frame-by-frame, speed pills, layer breakdowns.</p>
      </div>

      <div className="lab-motion-stage">
        <svg viewBox="0 0 960 480" className="lab-motion-svg" role="img" aria-label="Signal routing choreography">
          <rect width="960" height="480" fill="#09090b" />
          {layers.grid && (
            <g className="lab-grid" stroke="rgba(244,185,97,0.14)" strokeWidth="0.6">
              {Array.from({ length: 13 }, (_, i) => (
                <line key={`v${i}`} x1={40 + i * 74} y1={24} x2={40 + i * 74} y2={456} />
              ))}
              {Array.from({ length: 8 }, (_, i) => (
                <line key={`h${i}`} x1={24} y1={24 + i * 62} x2={936} y2={24 + i * 62} />
              ))}
            </g>
          )}
          {layers.vectors && (
            <g fill="none" stroke="#ff5a1f" strokeWidth="1.4">
              <path
                d={`M ${state.nyc.x} ${state.nyc.y} C 360 120, 600 400, ${state.add.x} ${state.add.y}`}
                strokeOpacity={0.55 + state.lock * 0.4}
              />
              <circle cx={state.nyc.x} cy={state.nyc.y} r={10 + state.resolve * 4} fill="#ff5a1f" stroke="none" />
              <circle cx={state.add.x} cy={state.add.y} r={10 + state.resolve * 4} fill="#f4b961" stroke="none" />
              <text x={state.nyc.x - 28} y={state.nyc.y - 18} fill="#f2ece1" fontSize="11" fontFamily="Geist Mono Variable, monospace">NYC</text>
              <text x={state.add.x - 18} y={state.add.y - 18} fill="#f2ece1" fontSize="11" fontFamily="Geist Mono Variable, monospace">ADD</text>
              {state.packets.map((p) => (
                <circle key={p.id} cx={p.x} cy={p.y} r={3.2} fill="#f2ece1" fillOpacity={p.a} />
              ))}
              <ellipse
                cx="480"
                cy="250"
                rx={90 + state.lock * 30}
                ry={48 + state.lock * 10}
                stroke="#f4b961"
                strokeDasharray="4 6"
                transform={`rotate(${(state.orbit * 180) / Math.PI} 480 250)`}
                opacity={0.35 + state.lock * 0.4}
              />
              {state.glyphs.map((g) => (
                <text
                  key={g.ch}
                  x={g.x}
                  y={g.y}
                  fill="#f4b961"
                  fontSize={g.s}
                  opacity={g.o}
                  textAnchor="middle"
                  fontFamily="Senai Geez, Noto Sans Ethiopic, sans-serif"
                >
                  {g.ch}
                </text>
              ))}
            </g>
          )}
          {layers.keyframes &&
            state.keyframes.map((k) => (
              <g key={k.label}>
                <rect x={k.x - 5} y={k.y - 5} width="10" height="10" transform={`rotate(45 ${k.x} ${k.y})`} fill={k.on ? "#ff5a1f" : "none"} stroke="#f2ece1" strokeWidth="1" />
              </g>
            ))}
        </svg>
        {layers.telemetry && (
          <dl className="lab-tele">
            {state.telemetry.map((row) => (
              <div key={row.k}>
                <dt>{row.k}</dt>
                <dd>{row.v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="lab-transport">
        <div className="lab-transport-row">
          <button type="button" onClick={() => setPlaying((p) => !p)}>{playing ? "Pause" : "Play"}</button>
          <button type="button" onClick={() => step(-1)}>-1f</button>
          <button type="button" onClick={() => step(1)}>+1f</button>
          <span className="lab-timecode">{mm}:{ss} · f{String(state.frame).padStart(3, "0")}/{FRAMES}</span>
          <span className="lab-phase">{state.phase.id} {state.phase.label}</span>
        </div>
        <div
          className="lab-scrub"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={DURATION}
          aria-valuenow={Number(state.t.toFixed(2))}
          aria-label="Timeline"
          onPointerDown={(e) => {
            drag.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            setPlaying(false);
            onScrub(e);
          }}
          onPointerMove={(e) => drag.current && onScrub(e)}
          onPointerUp={() => {
            drag.current = false;
          }}
        >
          <i style={{ width: `${(state.t / DURATION) * 100}%` }} />
          {PHASES.map((ph) => (
            <button
              key={ph.id}
              type="button"
              className="lab-mark"
              style={{ left: `${(ph.t / DURATION) * 100}%` }}
              onClick={() => {
                setPlaying(false);
                seek(ph.t);
              }}
            >
              {ph.id} {ph.label}
            </button>
          ))}
        </div>
        <div className="lab-transport-row">
          {SPEEDS.map((s) => (
            <button key={s} type="button" className={speed === s ? "on" : ""} onClick={() => setSpeed(s)}>
              {s}×
            </button>
          ))}
          {(["grid", "vectors", "keyframes", "telemetry"] as LayerId[]).map((id) => (
            <button
              key={id}
              type="button"
              className={layers[id] ? "on" : ""}
              onClick={() => setLayers((L) => ({ ...L, [id]: !L[id] }))}
            >
              {id}
            </button>
          ))}
          <button type="button" className={copied ? "is-on" : ""} onClick={() => void copy()}>
            {copied ? "Copied spec" : "Copy Motion Spec"}
          </button>
        </div>
      </div>
    </section>
  );
}
