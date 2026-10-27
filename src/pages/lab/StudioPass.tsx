import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ripBurst, ripSequence } from "../../lib/labTearAudio";
import { copyText } from "../../lib/copyText";

const CODE = "SENAI-LAB-VIP";

export function StudioPass() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [progress, setProgress] = useState(0);
  const [torn, setTorn] = useState(false);
  const [stub, setStub] = useState({ x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0 });
  const [copied, setCopied] = useState(false);
  const dragging = useRef(false);
  const lastP = useRef(0);

  useEffect(() => {
    if (!torn) return;
    let raf = 0;
    const step = () => {
      setStub((s) => {
        const vy = s.vy + 0.55;
        const vx = s.vx * 0.992;
        const vr = s.vr * 0.994;
        return { x: s.x + vx, y: s.y + vy, r: s.r + vr, vx, vy, vr };
      });
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [torn]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setTilt({ x: (x - 0.5) * 16, y: (0.5 - y) * 12 });
  };

  const tearTo = (p: number) => {
    const next = Math.min(1, Math.max(0, p));
    if (next - lastP.current > 0.04) void ripSequence(lastP.current, next);
    lastP.current = next;
    setProgress(next);
    if (next >= 1) finishTear();
  };

  const finishTear = () => {
    if (torn) return;
    setTorn(true);
    setProgress(1);
    setStub({ x: 8, y: 12, r: -4, vx: 2.4, vy: -6.5, vr: 1.6 });
    void ripBurst(1, 0.28);
  };

  const onTearPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (torn) return;
    const r = e.currentTarget.getBoundingClientRect();
    tearTo((e.clientX - r.left) / r.width);
  };

  const copyCode = async () => {
    const ok = await copyText(CODE);
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const teeth = Array.from({ length: 22 }, (_, i) => {
    const pulled = Math.max(0, progress - i / 22);
    const jag = Math.sin(i * 2.3) * 3 * pulled;
    return { x: (i / 21) * 100, y: jag };
  });

  return (
    <section id="exp-pass" className="lab-exp lab-pass" aria-labelledby="exp-pass-title">
      <div className="lab-exp-head">
        <p className="lab-kicker"><span>03</span> Ticket Tear · built from scratch</p>
        <h2 id="exp-pass-title">Tactile Studio Pass</h2>
        <p className="lab-lede">Holographic foil, pointer tilt, perforated stub. Drag the tear or use the button. Web Audio paper-rip, then a priority code.</p>
      </div>

      <div className="lab-pass-stage">
        <div
          ref={cardRef}
          className={`lab-pass-card ${torn ? "is-torn" : ""}`}
          style={{
            transform: `rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
            ["--foil-x" as string]: `${50 + tilt.x * 2}%`,
            ["--foil-y" as string]: `${40 - tilt.y * 2}%`,
            ["--tear" as string]: String(progress),
          }}
          onPointerMove={onMove}
          onPointerLeave={() => setTilt({ x: 0, y: 0 })}
        >
          <div className="lab-pass-body">
            <p className="lab-pass-brand">SENAI TECHNOLOGY</p>
            <p className="lab-pass-sub">LAB PASS #049 · NEW YORK × ADDIS ABABA</p>
            <p className="lab-pass-ge" lang="am">ሰናይ</p>
            <div className="lab-pass-meta">
              <span>ADMIT ONE</span>
              <span>SIDE A</span>
              <span>92 BPM</span>
            </div>
            <div className="lab-pass-foil" aria-hidden />
          </div>

          <div
            className="lab-perf"
            onPointerDown={(e) => {
              if (torn) return;
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              onTearPointer(e);
            }}
            onPointerMove={(e) => dragging.current && onTearPointer(e)}
            onPointerUp={() => {
              dragging.current = false;
              if (progress > 0.86) finishTear();
              else if (!torn) {
                setProgress(0);
                lastP.current = 0;
              }
            }}
          >
            <span>Drag across perforation to tear stub</span>
            <svg viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden>
              <path
                d={teeth.map((pt, i) => `${i ? "L" : "M"} ${pt.x} ${4 + pt.y}`).join(" ")}
                fill="none"
                stroke="currentColor"
                strokeWidth="0.6"
              />
            </svg>
          </div>

          <div
            className={`lab-stub ${torn ? "is-off" : ""}`}
            style={torn ? { transform: `translate(${stub.x}px, ${stub.y}px) rotate(${stub.r}deg)` } : undefined}
          >
            <p>STUB</p>
            <p>KEEP THIS</p>
            <span />
          </div>
        </div>

        <div className="lab-pass-actions">
          <button type="button" className="lab-copy" onClick={finishTear} disabled={torn}>
            Tear Stub
          </button>
          {torn && (
            <div className="lab-vip">
              <p>Priority project code</p>
              <button type="button" onClick={() => void copyCode()}>
                {copied ? "Copied" : CODE}
              </button>
              <Link to="/#contact">Book a build →</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
