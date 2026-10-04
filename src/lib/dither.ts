/** 4x4 Bayer threshold in [0, 1). */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (x: number, y: number) => BAYER4[(y & 3) * 4 + (x & 3)];

export type RGB = [number, number, number];

export const hex = (h: string): RGB => {
  const n = parseInt(h.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/**
 * Ordered-dither a scalar field into up to three tones (transparent / mid / high).
 * `field(u, v)` gets normalised coords in [-1, 1] (aspect-corrected on x) and returns 0..1.
 */
export function paintDither(
  canvas: HTMLCanvasElement,
  cols: number,
  rows: number,
  field: (u: number, v: number, x: number, y: number) => number,
  mid: RGB,
  high: RGB,
) {
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = ctx.createImageData(cols, rows);
  const d = img.data;
  const aspect = cols / rows;
  for (let y = 0; y < rows; y++) {
    const v = 1 - ((y + 0.5) / rows) * 2;
    for (let x = 0; x < cols; x++) {
      const u = (((x + 0.5) / cols) * 2 - 1) * aspect;
      const f = Math.min(Math.max(field(u, v, x, y), 0), 1);
      const level = Math.floor(f * 2 + bayer(x, y));
      const i = (y * cols + x) * 4;
      if (level <= 0) continue;
      const c = level === 1 ? mid : high;
      d[i] = c[0];
      d[i + 1] = c[1];
      d[i + 2] = c[2];
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(Math.max((x - e0) / (e1 - e0), 0), 1);
  return t * t * (3 - 2 * t);
};
