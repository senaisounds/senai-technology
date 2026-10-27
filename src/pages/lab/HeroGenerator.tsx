import { useEffect, useRef, useState } from "react";
import { createHero, type Hero, type HeroLiveParams } from "../../lib/heroGL";
import { contrastRatio, fmtRatio, wcagLabel } from "../../lib/contrast";
import { copyText } from "../../lib/copyText";
import { useIsMobile, usePrefersReducedMotion } from "../../lib/hooks";

export type Palette = {
  id: string;
  name: string;
  bg: string;
  ink: string;
  accent: string;
  gold: string;
  cool: string;
};

export const PALETTES: Palette[] = [
  { id: "obsidian", name: "Obsidian Vermilion", bg: "#09090b", ink: "#f2ece1", accent: "#ff5a1f", gold: "#f4b961", cool: "#3b5bff" },
  { id: "addis", name: "Addis Gold", bg: "#0c0a06", ink: "#fef08a", accent: "#eab308", gold: "#fde68a", cool: "#ca8a04" },
  { id: "cobalt", name: "Cobalt Night", bg: "#070b14", ink: "#93c5fd", accent: "#3b82f6", gold: "#bfdbfe", cool: "#60a5fa" },
  { id: "acid", name: "Acid Field", bg: "#080c08", ink: "#d9f99d", accent: "#84cc16", gold: "#ecfccb", cool: "#65a30d" },
  { id: "paper", name: "Warm Paper", bg: "#171412", ink: "#fda4af", accent: "#fb7185", gold: "#fecdd3", cool: "#fb7185" },
];

const DEFAULT: HeroLiveParams = { speed: 1, goo: 0.75, dither: 3, lens: 1, refract: 0.86, watermark: 1 };

export function HeroGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const hero = useRef<Hero | null>(null);
  const mobile = useIsMobile();
  const reduced = usePrefersReducedMotion();
  const [palette, setPalette] = useState(0);
  const [params, setParams] = useState<HeroLiveParams>(DEFAULT);
  const [headline, setHeadline] = useState("Senai");
  const [copied, setCopied] = useState(false);
  const [live, setLive] = useState(false);
  const pal = PALETTES[palette];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const h = createHero(canvas, {
      colors: { ink: pal.ink, accent: pal.accent, gold: pal.gold, cool: pal.cool },
      mobile,
      reduced,
      onProgress: (p) => p >= 1 && setLive(true),
      onFail: () => setLive(false),
    });
    if (!h) return;
    hero.current = h;
    h.start();
    return () => {
      h.destroy();
      hero.current = null;
    };
    // palette is applied via setColors — recreate only on device/motion change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mobile, reduced]);

  useEffect(() => {
    hero.current?.setColors({ ink: pal.ink, accent: pal.accent, gold: pal.gold, cool: pal.cool });
    const el = stageRef.current;
    if (el) {
      el.style.setProperty("--lab-bg", pal.bg);
      el.style.setProperty("--lab-ink", pal.ink);
      el.style.setProperty("--lab-accent", pal.accent);
      el.style.setProperty("--lab-gold", pal.gold);
    }
  }, [pal]);

  useEffect(() => {
    hero.current?.setParams(params);
  }, [params]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " && e.code !== "Space") return;
      const t = e.target as HTMLElement | null;
      if (t && /input|textarea|select/i.test(t.tagName)) return;
      const root = stageRef.current;
      if (!root) return;
      const inView = root.getBoundingClientRect().top < window.innerHeight && root.getBoundingClientRect().bottom > 0;
      if (!inView) return;
      e.preventDefault();
      setPalette((i) => (i + 1) % PALETTES.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onPointer = (e: React.PointerEvent, active: boolean) => {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    hero.current?.pointer(e.clientX - r.left, e.clientY - r.top, active);
  };

  const cycle = () => setPalette((i) => (i + 1) % PALETTES.length);

  const exportJson = async () => {
    const spec = {
      experiment: "01 Live WebGL Hero & Dither Generator",
      palette: pal,
      headline,
      watermark: "ሰናይ",
      params,
      architecture: "heroGL.ts metaball + Bayer 8x8 dither + pointer glass lens",
    };
    const ok = await copyText(JSON.stringify(spec, null, 2));
    setCopied(ok);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const inkOnBg = contrastRatio(pal.ink, pal.bg);
  const accOnBg = contrastRatio(pal.accent, pal.bg);

  return (
    <section
      id="exp-hero"
      ref={stageRef}
      className="lab-exp lab-hero-gen"
      tabIndex={0}
      onPointerMove={(e) => onPointer(e, true)}
      onPointerDown={(e) => onPointer(e, true)}
      onPointerLeave={(e) => onPointer(e, false)}
      aria-labelledby="exp-hero-title"
    >
      <div className="lab-exp-head">
        <p className="lab-kicker"><span>01</span> Atelier UI + Coolors</p>
        <h2 id="exp-hero-title">Live WebGL Hero &amp; Dither Generator</h2>
        <p className="lab-lede">Real DOM over a metaball + Bayer 8×8 dither. Space cycles palettes. Type your name on the shader.</p>
      </div>

      <div className="lab-hero-stage">
        <canvas ref={canvasRef} className="lab-hero-canvas" aria-hidden />
        <div className="lab-hero-dom">
          <p className="lab-hero-ge" lang="am">ሰናይ</p>
          <label className="lab-hero-edit">
            <span className="sr">Headline overlay</span>
            <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={32} />
          </label>
          <p className="lab-hero-hud">{live ? "LIVE · WebGL2" : "Compiling"} · pointer glass lens</p>
        </div>
      </div>

      <div className="lab-dock">
        <div className="lab-palettes">
          {PALETTES.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className={`lab-swatch ${i === palette ? "on" : ""}`}
              onClick={() => setPalette(i)}
              aria-pressed={i === palette}
              aria-label={p.name}
            >
              <span style={{ background: p.bg }} />
              <span style={{ background: p.accent }} />
              <span style={{ background: p.gold }} />
              <em>{p.name}</em>
            </button>
          ))}
          <button type="button" className="lab-space" onClick={cycle}>
            Space · next palette
          </button>
        </div>

        <div className="lab-wcag">
          <span className={`lab-badge ${wcagLabel(inkOnBg).startsWith("AA") ? "ok" : "warn"}`}>
            Ink {fmtRatio(inkOnBg)} {wcagLabel(inkOnBg)}
          </span>
          <span className={`lab-badge ${wcagLabel(accOnBg).startsWith("AA") || wcagLabel(accOnBg) === "AA large" ? "ok" : "warn"}`}>
            Accent {fmtRatio(accOnBg)} {wcagLabel(accOnBg)}
          </span>
        </div>

        <div className="lab-sliders">
          {(
            [
              ["speed", "Metaball speed", 0.15, 2.4, 0.05],
              ["goo", "Gooeyness (smin)", 0.2, 1.4, 0.02],
              ["dither", "Dither density", 1.5, 8, 0.1],
              ["lens", "Glass lens radius", 0.35, 2.2, 0.05],
              ["refract", "Refraction", 0.55, 1.15, 0.01],
              ["watermark", "Ge'ez watermark", 0, 1, 0.02],
            ] as const
          ).map(([key, label, min, max, step]) => (
            <label key={key}>
              <span>{label}<b>{params[key].toFixed(2)}</b></span>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={params[key]}
                onChange={(e) => setParams((p) => ({ ...p, [key]: Number(e.target.value) }))}
              />
            </label>
          ))}
        </div>

        <button type="button" className={`lab-copy ${copied ? "is-on" : ""}`} onClick={() => void exportJson()}>
          {copied ? "Copied · shader receipt" : "Copy Shader Config JSON"}
        </button>
      </div>
    </section>
  );
}
