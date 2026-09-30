import { useEffect, useRef } from "react";
import { hex, paintDither, smooth } from "../lib/dither";

/** Scalar fields in [-1, 1] space (x is aspect-corrected). One per work card. */
const FIELDS: Record<string, (u: number, v: number) => number> = {
  site: (u, v) => {
    const blobs = [[0.35, 0.1, 0.55], [-0.2, -0.15, 0.4], [0.75, -0.35, 0.3], [0.05, 0.45, 0.26]];
    let f = 0;
    for (const [x, y, r] of blobs) f += (r * r) / ((u - x) ** 2 + (v - y) ** 2 + 0.001);
    const hl = smooth(1.2, 0, Math.hypot(u - 0.15, v - 0.35));
    return smooth(0.8, 1.6, f) * (0.45 + 0.6 * hl) + smooth(0.9, 0.2, f) * smooth(0.25, 0.8, f) * 0.3;
  },
  openslot: (u, v) => {
    const r = Math.hypot(u + 0.2, v + 0.1);
    const wave = 0.5 + 0.5 * Math.cos(r * 16 - Math.atan2(v, u) * 0.5);
    return wave * smooth(1.6, 0.1, r) * 0.95 + smooth(0.28, 0.2, r) * 0.9;
  },
  local: (u, v) => {
    const h1 = -0.1 + Math.sin(u * 1.4 + 0.6) * 0.35;
    const h2 = -0.45 + Math.sin(u * 2.1 - 1) * 0.22;
    const sun = smooth(0.34, 0.3, Math.hypot(u - 0.7, v - 0.45));
    return Math.max(v < h2 ? 0.95 : v < h1 ? 0.55 : 0.08 + (v + 1) * 0.06, sun);
  },
  cafe: (u, v) => {
    const cup = v < -0.1 && v > -0.78 && Math.abs(u) < 0.5 + (v + 0.1) * 0.12 ? 0.3 + 0.62 * smooth(0.55, -0.45, u) : 0;
    const handle = smooth(0.05, 0.01, Math.abs(Math.hypot(u - 0.6, v + 0.42) - 0.17)) * 0.55;
    const steam = [-0.2, 0, 0.2].reduce((a, x, i) => {
      if (v < 0 || v > 0.85) return a;
      const cx = x + Math.sin(v * 6.5 + i * 1.9) * 0.045;
      return Math.max(a, smooth(0.05, 0.015, Math.abs(u - cx)) * smooth(0.85, 0.2, v) * smooth(0, 0.12, v));
    }, 0);
    return Math.max(cup, handle, steam * 0.85, 0.03);
  },
  assistant: (u, v) => {
    const bubble = (x: number, y: number, w: number, h: number) => {
      const qx = Math.abs(u - x) - w + 0.12, qy = Math.abs(v - y) - h + 0.12;
      return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - 0.12;
    };
    const a = smooth(0.02, -0.02, bubble(-0.35, 0.4, 0.62, 0.2)) * 0.5;
    const b = smooth(0.02, -0.02, bubble(0.4, 0.0, 0.55, 0.2)) * 0.95;
    const c = smooth(0.02, -0.02, bubble(-0.25, -0.45, 0.72, 0.22)) * 0.5;
    return Math.max(a, b, c, 0.04);
  },
};

type Props = { kind: keyof typeof FIELDS; mid: string; high: string };

/** One-time dithered render at 1/3 CSS resolution, upscaled with nearest-neighbour. Redraws on resize only. */
export function DitherArt({ kind, mid, high }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let t = 0;
    const draw = () => {
      const cols = Math.max(24, Math.round(c.clientWidth / 3));
      const rows = Math.max(24, Math.round(c.clientHeight / 3));
      if (cols === c.width && rows === c.height) return;
      paintDither(c, cols, rows, FIELDS[kind], hex(mid), hex(high));
    };
    draw();
    const ro = new ResizeObserver(() => {
      clearTimeout(t);
      t = window.setTimeout(draw, 120);
    });
    ro.observe(c);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, [kind, mid, high]);
  return <canvas ref={ref} className="dither-art" aria-hidden />;
}
