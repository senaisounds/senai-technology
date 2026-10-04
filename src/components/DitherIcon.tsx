import { useEffect, useRef } from "react";
import { hex, paintDither, smooth } from "../lib/dither";

const N = 24;

const circle = (u: number, v: number, x: number, y: number, r: number) => Math.hypot(u - x, v - y) - r;
const box = (u: number, v: number, x: number, y: number, bx: number, by: number, r = 0) => {
  const qx = Math.abs(u - x) - bx + r, qy = Math.abs(v - y) - by + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
};
const segment = (u: number, v: number, ax: number, ay: number, bx: number, by: number) => {
  const px = u - ax, py = v - ay, dx = bx - ax, dy = by - ay;
  const t = Math.min(Math.max((px * dx + py * dy) / (dx * dx + dy * dy), 0), 1);
  return Math.hypot(px - dx * t, py - dy * t);
};
const fill = (d: number) => smooth(0.06, -0.06, d);
const ring = (d: number, w: number) => smooth(w, w * 0.4, Math.abs(d));
/** fake top-left light so solid shapes read as volumes once dithered */
const lit = (u: number, v: number, cx = 0, cy = 0, r = 1) => 0.35 + 0.65 * smooth(1.6, -0.3, Math.hypot(u - cx + r * 0.45, v - cy - r * 0.45) / r);

export const ICONS: Record<string, (u: number, v: number) => number> = {
  motion: (u, v) =>
    Math.max(fill(circle(u, v, 0.35, 0, 0.5)) * lit(u, v, 0.35, 0, 0.5), fill(circle(u, v, -0.25, 0, 0.36)) * 0.55, fill(circle(u, v, -0.7, 0, 0.22)) * 0.3),
  mobile: (u, v) => Math.max(ring(box(u, v, 0, 0, 0.5, 0.85, 0.16), 0.09), fill(box(u, v, 0, -0.62, 0.14, 0.035, 0.03)), fill(box(u, v, 0, 0.1, 0.34, 0.5, 0.04)) * 0.4 * lit(u, v, 0, 0.1, 0.6)),
  fast: (u, v) => Math.max(fill(circle(u, v, 0.3, 0, 0.52)) * lit(u, v, 0.3, 0, 0.52), ...[-0.3, 0, 0.3].map((y, i) => fill(box(u, v, -0.55 + i * 0.05, y, 0.3 - i * 0.05, 0.035, 0.03)) * 0.55)),
  access: (u, v) => Math.max(ring(circle(u, v, 0, 0, 0.8), 0.08), fill(circle(u, v, 0, 0.36, 0.14)), fill(box(u, v, 0, -0.08, 0.42, 0.06, 0.05)), fill(box(u, v, 0, -0.2, 0.07, 0.3, 0.05))),
  search: (u, v) =>
    Math.max(
      ring(circle(u, v, -0.15, 0.15, 0.48), 0.1),
      fill(circle(u, v, -0.15, 0.15, 0.36)) * 0.35 * lit(u, v, -0.15, 0.15, 0.4),
      fill(segment(u, v, 0.22, -0.22, 0.72, -0.72) - 0.1),
    ),
  handover: (u, v) => {
    if (Math.abs(u) / 0.7 + Math.abs(v - 0.35) / 0.4 <= 1) return 1;
    const edge = -0.05 + (0.4 / 0.7) * Math.abs(u);
    if (Math.abs(u) > 0.7 || v > edge || v < edge - 0.8) return 0;
    return u < 0 ? 0.62 : 0.34;
  },
  app: (u, v) => Math.max(fill(box(u, v, 0, 0, 0.62, 0.62, 0.22)) * lit(u, v, 0, 0, 0.7), 0) * (fill(circle(u, v, 0, 0, 0.2)) > 0.5 ? 0.15 : 1),
  brand: (u, v) => {
    const r = Math.hypot(u, v), a = Math.atan2(v, u);
    const star = 0.28 + 0.52 * Math.pow(Math.abs(Math.cos(a * 2)), 6);
    return fill(r - star) * lit(u, v, 0, 0, 0.8);
  },
  film: (u, v) => Math.max(ring(box(u, v, 0, 0, 0.82, 0.58, 0.08), 0.08), ...[-0.55, -0.18, 0.18, 0.55].flatMap((x) => [fill(box(u, v, x, 0.44, 0.07, 0.05)), fill(box(u, v, x, -0.44, 0.07, 0.05))]), fill(box(u, v, 0, 0, 0.6, 0.26, 0.04)) * 0.5),
  chat: (u, v) => {
    const b = box(u, v, 0, 0.12, 0.8, 0.52, 0.28);
    const tail = fill(box(u, v, -0.35, -0.5, 0.12, 0.16, 0.02));
    const dots = Math.max(...[-0.36, 0, 0.36].map((x) => fill(circle(u, v, x, 0.12, 0.1))));
    return dots > 0.5 ? 1 : Math.max(fill(b) * 0.55 * lit(u, v, 0, 0.12, 0.8), tail * 0.55);
  },
  play: (u, v) => {
    const tri = Math.max(-u - 0.3, Math.abs(v) * 1.15 + u * 0.7 - 0.38);
    return Math.max(ring(circle(u, v, 0, 0, 0.82), 0.08), fill(tri));
  },
};

type Props = { name: keyof typeof ICONS; play?: number; reduced?: boolean; className?: string };

/** 24x24 ordered-dither icon; `play` changes retrigger a short scan-in. */
export function DitherIcon({ name, play = 0, reduced = false, className = "" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const styles = getComputedStyle(c);
    const mid = hex(styles.getPropertyValue("--icon-mid").trim() || "#ff5a1f");
    const high = hex(styles.getPropertyValue("--icon-high").trim() || "#f2ece1");
    const shape = ICONS[name];
    const draw = (p: number) =>
      paintDither(c, N, N, (u, v) => {
        const s = shape(u, v);
        if (p >= 1) return s;
        const front = p * 3.2 - 1.1 - (u - v) * 0.5;
        return s * smooth(-0.1, 0.35, front) + (Math.abs(front) < 0.14 && s > 0.05 ? 0.6 : 0);
      }, mid, high);
    if (reduced) {
      draw(1);
      return;
    }
    if (play === 0) {
      draw(0);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / 900, 1);
      draw(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [name, play, reduced]);
  return <canvas ref={ref} className={`dither-icon ${className}`} aria-hidden />;
}
