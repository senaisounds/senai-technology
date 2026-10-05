import { useEffect, useRef } from "react";
import { hex, paintDither, smooth } from "../lib/dither";

/** Scalar fields in [-1, 1] space (x is aspect-corrected, `a` is the aspect). Energy grows with the tier. */
const FIELDS: ((u: number, v: number, a: number) => number)[] = [
  (u, v, a) => smooth(0.95, 0, Math.hypot(u - a - 0.1, v - 1.08)) * 0.95,
  (u, v, a) => {
    const d = Math.hypot(u - a - 0.1, v - 1.08);
    const bands = 0.55 + 0.45 * Math.cos(d * 15);
    return smooth(1.2, 0, d) * (0.45 + 0.5 * bands);
  },
  (u, v, a) => {
    const d = Math.hypot(u - a - 0.05, v - 1.05);
    const ripple = 0.5 + 0.5 * Math.cos(d * 11 - Math.atan2(v - 1.05, u - a) * 1.5);
    const low = smooth(0.9, 0, Math.hypot(u + a + 0.2, v + 1.15)) * 0.5;
    return Math.max(smooth(1.55, 0.05, d) * (0.4 + 0.6 * ripple), low);
  },
];

const RAMP = " .·:-=+*#%@";
const DITHER_CELL = 3;
const ASCII_CELL = 11;

type Props = { tier: number };

/**
 * Two one-time renders of the same field: an ordered dither (shown at rest) and an ASCII version
 * (revealed through the hover lens). Paints when near the viewport, then only on resize.
 */
export function TierTexture({ tier }: Props) {
  const dRef = useRef<HTMLCanvasElement>(null);
  const aRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const dc = dRef.current, ac = aRef.current;
    if (!dc || !ac) return;
    const field = FIELDS[tier % FIELDS.length];
    const styles = getComputedStyle(dc);
    const mid = hex(styles.getPropertyValue("--tex-mid").trim() || "#4a200e");
    const high = hex(styles.getPropertyValue("--tex-high").trim() || "#ff5a1f");
    let w = 0, h = 0, t = 0, idle = 0;

    const drawAscii = () => {
      const ctx = ac.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ac.width = Math.round(w * dpr);
      ac.height = Math.round(h * dpr);
      ctx.scale(dpr, dpr);
      ctx.font = `500 ${ASCII_CELL + 2}px "Geist Mono Variable", ui-monospace, monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cols = Math.ceil(w / ASCII_CELL), rows = Math.ceil(h / ASCII_CELL), a = w / h;
      for (let y = 0; y < rows; y++) {
        const v = 1 - ((y + 0.5) / rows) * 2;
        for (let x = 0; x < cols; x++) {
          const u = (((x + 0.5) / cols) * 2 - 1) * a;
          const f = 0.14 + 0.86 * Math.min(Math.max(field(u, v, a), 0), 1) ** 0.75;
          const ch = RAMP[Math.min(RAMP.length - 1, Math.floor(f * RAMP.length))];
          if (ch === " ") continue;
          ctx.fillStyle = f > 0.6 ? "#ff5a1f" : `rgba(242, 236, 225, ${(0.3 + f * 0.6).toFixed(2)})`;
          ctx.fillText(ch, (x + 0.5) * ASCII_CELL, (y + 0.5) * ASCII_CELL);
        }
      }
    };

    const draw = () => {
      const nw = dc.clientWidth, nh = dc.clientHeight;
      if (!nw || !nh || (nw === w && nh === h)) return;
      w = nw;
      h = nh;
      const cols = Math.round(w / DITHER_CELL), rows = Math.round(h / DITHER_CELL), a = cols / rows;
      paintDither(dc, cols, rows, (u, v) => field(u, v, a), mid, high);
      const ric = window.requestIdleCallback;
      if (ric) idle = ric(() => document.fonts.ready.then(drawAscii), { timeout: 1500 });
      else document.fonts.ready.then(drawAscii);
    };

    let visible = false;
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      if (visible) t = window.setTimeout(draw, 150);
    });
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        visible = true;
        io.disconnect();
        draw();
        ro.observe(dc);
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(dc);
    return () => {
      io.disconnect();
      ro.disconnect();
      clearTimeout(t);
      if (idle) window.cancelIdleCallback?.(idle);
    };
  }, [tier]);
  return (
    <div className="tier-tex" aria-hidden>
      <canvas ref={dRef} className="tier-dither" />
      <canvas ref={aRef} className="tier-ascii" />
    </div>
  );
}
