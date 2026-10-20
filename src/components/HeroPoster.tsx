import { useEffect, useRef } from "react";
import { hex, paintDither, smooth } from "../lib/dither";
import { COLORS } from "../content";

const CELL = 3;

/**
 * Still, dithered stand-in for the hero shader: same layout as heroGL's `layout()` (blob right on wide screens,
 * top on narrow ones) and the same three tones. Shown until WebGL renders its first frame, and kept as the
 * fallback when WebGL2 is missing or fails.
 */
export function HeroPoster() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let t = 0;
    const draw = () => {
      const cols = Math.max(24, Math.round(c.clientWidth / CELL));
      const rows = Math.max(24, Math.round(c.clientHeight / CELL));
      if (cols === c.width && rows === c.height) return;
      const a = c.clientWidth / Math.max(1, c.clientHeight);
      const wide = a >= 0.9;
      const cx = wide ? a * 0.38 : 0;
      const cy = wide ? 0.08 : 0.52;
      const s = (wide ? Math.min(0.8, a * 0.5) : Math.min(0.56, a)) / 2.5;
      const balls = [
        [0, 0, 0.9],
        [0.95, 0.55, 0.42],
        [-0.85, 0.35, 0.36],
        [0.45, -0.85, 0.4],
        [-0.55, -0.7, 0.3],
        [0.1, 0.95, 0.28],
      ].map(([x, y, r]) => [cx + x * s, cy + y * s, r * s] as const);
      paintDither(
        c,
        cols,
        rows,
        (u, v) => {
          let f = 0;
          for (const [x, y, r] of balls) f += (r * r) / ((u - x) ** 2 + (v - y) ** 2 + 1e-4);
          const body = smooth(0.7, 1.25, f);
          const light = smooth(1.3 * s * 2.5, 0, Math.hypot(u - cx + 0.35 * s * 2.5, v - cy - 0.4 * s * 2.5));
          const glow = smooth(0.15, 0.7, f) * 0.28;
          return Math.max(body * (0.32 + 0.7 * light), glow);
        },
        hex(COLORS.accent),
        hex(COLORS.ink),
      );
    };
    draw();
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = window.setTimeout(draw, 150);
    });
    ro.observe(c);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, []);
  return <canvas ref={ref} className="hero-poster" aria-hidden />;
}
