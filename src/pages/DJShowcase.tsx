import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useInView, useIsMobile, usePrefersReducedMotion } from "../lib/hooks";
import { ARTIST, EPK_TEXT, MIX, PRESS, RELEASES, STEMS, TOUR, type StemId } from "./dj/data";
import { FLUX_BPM, getFluxAudio, type FluxAudio } from "./dj/audio";
import "../styles/dj-showcase.css";

const FieldCanvas = lazy(() => import("./dj/FieldCanvas").then((m) => ({ default: m.FieldCanvas })));

export function DJShowcase() {
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile(768);
  const [entered, setEntered] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [stems, setStems] = useState<Record<StemId, boolean>>({ kick: true, hat: true, bass: true, pad: true });
  const [openTicket, setOpenTicket] = useState<number | null>(null);
  const [focus, setFocus] = useState(0);
  const [rot, setRot] = useState(0);
  const [form, setForm] = useState<"idle" | "sending" | "sent">("idle");
  const [clock, setClock] = useState("--:--");
  const audio = useMemo(() => getFluxAudio(), []);
  const drag = useRef<{ x: number; rot: number } | null>(null);
  const [stageRef, stageIn] = useInView<HTMLElement>("80px");

  useEffect(() => {
    document.title = `${ARTIST} — enter the field`;
    document.documentElement.classList.add("dj-world");
    void import("./dj/signalField");
    return () => {
      document.documentElement.classList.remove("dj-world");
      document.title = "Senai Technology";
      audio.pause();
    };
  }, [audio]);

  useEffect(() => {
    const tick = () => {
      const t = new Date();
      const hh = String(t.getHours()).padStart(2, "0");
      const mm = String(t.getMinutes()).padStart(2, "0");
      setClock(`${hh}:${mm}`);
    };
    tick();
    const id = window.setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (reduced || !entered || mobile) return;
    let raf = 0;
    let last = performance.now();
    const spin = (now: number) => {
      if (!drag.current) setRot((r) => r + ((now - last) / 1000) * 8);
      last = now;
      raf = requestAnimationFrame(spin);
    };
    raf = requestAnimationFrame(spin);
    return () => cancelAnimationFrame(raf);
  }, [reduced, entered, mobile]);

  const enter = async (withSound: boolean) => {
    audio?.click();
    setEntered(true);
    setSoundOn(withSound);
    await audio?.enter(withSound);
    setPlaying(Boolean(withSound));
  };

  const toggleSound = async () => {
    const next = !soundOn;
    setSoundOn(next);
    await audio?.setEnabled(next);
    setPlaying(next);
    audio?.click();
  };

  const togglePlay = () => {
    if (!soundOn) {
      void toggleSound();
      return;
    }
    if (playing) audio?.pause();
    else audio?.play();
    setPlaying(!playing);
    audio?.click();
  };

  const onStem = (id: StemId) => {
    const on = audio?.toggleStem(id) ?? !stems[id];
    setStems((s) => ({ ...s, [id]: on }));
    audio?.click();
  };

  const downloadEPK = () => {
    audio?.click();
    const blob = new Blob([EPK_TEXT], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "NORA-FLUX-EPK.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    audio?.click();
    setForm("sending");
    window.setTimeout(() => setForm("sent"), 900);
  };

  return (
    <div className={`dj-showcase ${entered ? "is-in" : "is-gated"} ${soundOn ? "is-hot" : ""}`}>
      <a className="dj-skip" href="#mix">Skip to mix</a>
      {!entered && <Gate reduced={reduced} onEnter={enter} hover={(id) => audio?.hover(id)} />}

      <header className="dj-hud">
        <Link className="dj-hud-mark" to="/" onMouseEnter={() => audio?.hover("studio")}>
          <span>NF</span>
          <em>{ARTIST}</em>
        </Link>
        <nav className="dj-hud-nav" aria-label="On this page">
          <a href="#mix" onMouseEnter={() => audio?.hover("mix")}>Mix</a>
          <a href="#dates" onMouseEnter={() => audio?.hover("dates")}>Dates</a>
          <a href="#vault" onMouseEnter={() => audio?.hover("vault")}>Vault</a>
          <a href="#line" onMouseEnter={() => audio?.hover("line")}>Book</a>
          <Link to="/lab" onMouseEnter={() => audio?.hover("studio")}>Lab</Link>
        </nav>
        <div className="dj-hud-meta">
          <span>{clock} local</span>
          <span>{FLUX_BPM} BPM</span>
          <button
            type="button"
            className={`dj-sound ${soundOn ? "on" : ""}`}
            onClick={() => void toggleSound()}
            aria-pressed={soundOn}
          >
            {soundOn ? "Sound on" : "Sound off"}
          </button>
        </div>
      </header>

      <section ref={stageRef} className="dj-stage" id="mix" aria-label="Signal field">
        <div className="dj-stage-world">
          {!reduced && entered && (
            <Suspense fallback={<div className="dj-field-ph" aria-hidden />}>
              <FieldCanvas active={stageIn} soundOn={soundOn} mobile={mobile} audio={audio} />
            </Suspense>
          )}
          {(reduced || !entered) && <div className="dj-field-ph" aria-hidden />}
          <div className="dj-stage-copy">
            <p className="dj-kicker">Signal locked · warehouse tools</p>
            <h1 className="dj-word">
              <span>NORA</span>
              <span>FLUX</span>
            </h1>
            <p className="dj-lede">
              You do not press play on a picture of a DJ. You step into the field — or you stay outside.
            </p>
          </div>
        </div>

        <div className="dj-deck">
          <div className="dj-deck-top">
            <p className="dj-deck-cat">Latest mix</p>
            <h2 className="dj-deck-title">
              {MIX.title} <em>{MIX.subtitle}</em>
            </h2>
          </div>
          <Wave playing={playing && soundOn} reduced={reduced} audio={audio} />
          <div className="dj-deck-row">
            <button type="button" className="dj-play" onClick={togglePlay} aria-pressed={playing}>
              {playing ? "Hold" : "Run"}
            </button>
            <div className="dj-stems" role="group" aria-label="Stems">
              {STEMS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={stems[s.id] ? "on" : ""}
                  aria-pressed={stems[s.id]}
                  onClick={() => onStem(s.id)}
                  onMouseEnter={() => audio?.hover(s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <p className="dj-deck-note">Synthesized in the browser. Nothing autoplays.</p>
          </div>
        </div>
      </section>

      <section id="dates" className="dj-dates" aria-labelledby="dates-title">
        <div className="dj-dates-head">
          <p className="dj-kicker">Tour · peel a stub</p>
          <h2 id="dates-title" className="dj-sec-title">The room <em>changes cities.</em></h2>
        </div>
        <ol className="dj-tickets">
          {TOUR.map((show, i) => {
            const open = openTicket === i;
            return (
              <li key={show.date}>
                <div className={`dj-ticket ${open ? "is-open" : ""}`}>
                  <button
                    type="button"
                    className="dj-ticket-face"
                    onClick={() => {
                      setOpenTicket(open ? null : i);
                      audio?.peel();
                    }}
                    onMouseEnter={() => audio?.hover(`t${i}`)}
                    aria-expanded={open}
                  >
                    <span className="dj-ticket-date">
                      {show.date} <small>{show.year}</small>
                    </span>
                    <span className="dj-ticket-venue">{show.venue}</span>
                    <span className="dj-ticket-city">{show.city}</span>
                    <span className="dj-ticket-zone">{show.zone}</span>
                  </button>
                  <div className="dj-ticket-under">
                    <span>{show.note}</span>
                    <a href="#line">Request the list →</a>
                  </div>
                  <span className="dj-ticket-curl" aria-hidden />
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <section id="vault" className="dj-vault" aria-labelledby="vault-title">
        <div className="dj-vault-head">
          <p className="dj-kicker">Vault · drag the orbit</p>
          <h2 id="vault-title" className="dj-sec-title">Mixes as <em>objects.</em></h2>
        </div>
        <div
          className="dj-orbit"
          style={{ ["--rot" as string]: `${rot}deg`, ["--n" as string]: RELEASES.length }}
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, rot };
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setRot(drag.current.rot + (e.clientX - drag.current.x) * 0.45);
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          {RELEASES.map((r, i) => (
            <button
              key={r.cat}
              type="button"
              className={`dj-orbit-card ${focus === i ? "is-focus" : ""}`}
              style={{ ["--i" as string]: i }}
              onClick={() => {
                setFocus(i);
                audio?.click();
              }}
              onMouseEnter={() => audio?.hover(r.cat)}
            >
              <span className={`dj-sleeve is-${r.art}`} aria-hidden>
                <span>{r.cat}</span>
              </span>
              <strong>{r.title}</strong>
              <em>{r.kind} · {r.year}</em>
            </button>
          ))}
        </div>
        <aside className="dj-liner">
          <p className="dj-liner-cat">{RELEASES[focus].cat}</p>
          <h3>{RELEASES[focus].title}</h3>
          <p>{RELEASES[focus].note}</p>
        </aside>
      </section>

      <section id="press" className="dj-press" aria-labelledby="press-title">
        <div className="dj-press-mast">
          <p>Field notes · issue 04</p>
          <p>For promotional use</p>
        </div>
        <h2 id="press-title" className="dj-press-lede">{PRESS.lede}</h2>
        <div className="dj-press-grid">
          <div className="dj-press-bio">
            {PRESS.bio.map((p) => <p key={p}>{p}</p>)}
            <div className="dj-press-files">
              <button type="button" onClick={downloadEPK} onMouseEnter={() => audio?.hover("epk")}>
                Download EPK ↓
              </button>
              <a href="#line" onMouseEnter={() => audio?.hover("photos")}>Request photos</a>
            </div>
          </div>
          <ul className="dj-press-facts">
            {PRESS.facts.map((f) => (
              <li key={f.v}>
                <strong>{f.k}</strong>
                <span>{f.v}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="line" className="dj-line" aria-labelledby="line-title">
        <p className="dj-kicker">Booking · open a line</p>
        <h2 id="line-title" className="dj-sec-title">Transmit <em>the date.</em></h2>
        <form className="dj-form" onSubmit={submit}>
          <label>
            <span>Station / name</span>
            <input name="name" required autoComplete="name" />
          </label>
          <label>
            <span>Return frequency</span>
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            <span>Room</span>
            <input name="venue" required placeholder="Venue, city, date" />
          </label>
          <label>
            <span>Traffic</span>
            <select name="type" required defaultValue="booking">
              <option value="booking">Booking</option>
              <option value="press">Press</option>
              <option value="collab">Collaboration</option>
            </select>
          </label>
          <label className="dj-form-wide">
            <span>Message</span>
            <textarea name="message" rows={5} required placeholder="Hours, atmosphere, fee band." />
          </label>
          <button type="submit" className="dj-send" disabled={form !== "idle"}>
            {form === "sending" ? "Sending…" : form === "sent" ? "Line open" : "Send the transmission"}
          </button>
          {form === "sent" && <p className="dj-form-ok">Logged. A human answers within two days.</p>}
        </form>
      </section>

      <aside className="dj-senai">
        <p>
          <span>Built by</span> Senai Technology
        </p>
        <div>
          <Link to="/">The studio</Link>
          <Link to="/#contact">Start your project →</Link>
        </div>
      </aside>

      <footer className="dj-foot">
        <p>{ARTIST} is a fictional artist. The page is a Signature-tier sample — not a real booking.</p>
        <p>© 2026 Senai Technology · audio never autoplays · reduced motion is honoured · <Link to="/lab">Lab</Link></p>
      </footer>
    </div>
  );
}

function Gate({
  reduced,
  onEnter,
  hover,
}: {
  reduced: boolean;
  onEnter: (sound: boolean) => void;
  hover: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let px = 0;
    let py = 0;
    let tx = 0.3;
    let ty = 0.4;
    let ghost = true;
    const trail: { x: number; y: number; a: number }[] = [];

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();

    const move = (e: PointerEvent) => {
      ghost = false;
      const r = canvas.getBoundingClientRect();
      px = e.clientX - r.left;
      py = e.clientY - r.top;
    };
    canvas.addEventListener("pointermove", move);

    const draw = (t: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (ghost) {
        px += ((0.5 + Math.sin(t * 0.0004) * 0.28) * w - px) * 0.03;
        py += ((0.48 + Math.cos(t * 0.00031) * 0.2) * h - py) * 0.03;
      }
      tx += (px - tx) * 0.18;
      ty += (py - ty) * 0.18;
      trail.push({ x: tx, y: ty, a: 1 });
      if (trail.length > 48) trail.shift();

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(10,11,8,0.88)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "destination-out";
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        p.a *= 0.94;
        ctx.beginPath();
        ctx.fillStyle = `rgba(0,0,0,${p.a * 0.55})`;
        ctx.arc(p.x, p.y, 46 + (i / trail.length) * 28, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", size);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", move);
      window.removeEventListener("resize", size);
    };
  }, [reduced]);

  return (
    <div className="dj-gate" role="dialog" aria-label="Enter NORA FLUX">
      <div className="dj-gate-field" aria-hidden />
      <canvas ref={canvasRef} className="dj-gate-wipe" aria-hidden />
      <div className="dj-gate-inner">
        <p className="dj-gate-cat">Overworld protocol · sound first</p>
        <p className="dj-gate-mark" aria-hidden>
          NORA<br />FLUX
        </p>
        <h2 className="dj-gate-ask">Enter the field?</h2>
        <div className="dj-gate-actions">
          <button type="button" className="dj-gate-hot" onClick={() => onEnter(true)} onMouseEnter={() => hover("in")}>
            Enter with sound
          </button>
          <button type="button" className="dj-gate-cold" onClick={() => onEnter(false)} onMouseEnter={() => hover("quiet")}>
            Enter silent
          </button>
        </div>
        <p className="dj-gate-note">A loop is synthesized in this tab. Nothing starts until you choose.</p>
      </div>
    </div>
  );
}

function Wave({
  playing,
  reduced,
  audio,
}: {
  playing: boolean;
  reduced: boolean;
  audio: FluxAudio | null;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const bars = useMemo(() => new Array(48).fill(0.12), []);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      const l = audio?.getLevels();
      ctx.clearRect(0, 0, w, h);
      const n = bars.length;
      const gap = 2;
      const bw = (w - gap * n) / n;
      for (let i = 0; i < n; i++) {
        const target = playing && l ? 0.08 + (l.bands[i % 32] || 0) * 0.9 : 0.08 + Math.sin(i * 0.4) * 0.04;
        bars[i] += (target - bars[i]) * 0.22;
        const bh = bars[i] * h;
        ctx.fillStyle = i % 4 === 0 ? "#D6FF3D" : "#E8E2D4";
        ctx.globalAlpha = 0.35 + bars[i] * 0.65;
        ctx.fillRect(i * (bw + gap), h - bh, bw, bh);
      }
      ctx.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [audio, bars, playing, reduced]);

  return <canvas ref={ref} className="dj-wave" aria-hidden />;
}
