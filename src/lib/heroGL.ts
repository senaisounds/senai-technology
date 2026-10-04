/**
 * Hero renderer: raw WebGL2, two passes.
 *  1. Raymarch a cluster of smooth-unioned metaballs into a low-res buffer (the expensive part runs at
 *     ~1/4 of the pixels).
 *  2. Composite at screen res: 3-tone ordered dither everywhere, except inside a pointer-driven lens that
 *     shows the smooth render, slightly magnified.
 */

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const SCENE = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uPulse;
uniform vec3 uFollow;
uniform vec2 uCenter;
uniform float uScale;
uniform vec3 uAccent;
uniform vec3 uGold;
uniform vec3 uCool;
out vec4 o;

float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

float map(vec3 p) {
  vec3 q = (p - vec3(uCenter, 0.0)) / uScale;
  float t = uTime * 0.32;
  float d = length(q) - (0.9 + uPulse * 0.06);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec3 c = vec3(
      sin(t * (0.7 + fi * 0.13) + fi * 1.7) * 1.15,
      cos(t * (0.9 + fi * 0.11) + fi * 2.3) * 0.95,
      sin(t * (0.5 + fi * 0.17) + fi) * 0.6);
    d = smin(d, length(q - c) - (0.36 + 0.12 * sin(fi * 3.1)), 0.75);
  }
  d *= uScale;
  d = smin(d, length(p - uFollow) - 0.3 * uScale, 0.7 * uScale);
  d += sin(p.x * 5.0 + uTime * 1.1) * sin(p.y * 4.0 + uTime * 0.9) * sin(p.z * 5.0 + uTime * 0.7) * 0.022;
  return d;
}

vec3 normal(vec3 p) {
  const vec2 k = vec2(1.0, -1.0);
  const float h = 0.0015;
  return normalize(k.xyy * map(p + k.xyy * h) + k.yyx * map(p + k.yyx * h) +
                   k.yxy * map(p + k.yxy * h) + k.xxx * map(p + k.xxx * h));
}

vec3 env(vec3 r) {
  vec3 col = mix(vec3(0.015, 0.014, 0.02), vec3(0.06, 0.055, 0.07), r.y * 0.5 + 0.5);
  col += uAccent * smoothstep(0.45, 0.95, r.x) * 1.5;
  col += vec3(1.0, 0.95, 0.88) * smoothstep(0.7, 0.98, r.y) * 1.7;
  col += uGold * smoothstep(0.55, 0.95, -r.x) * 0.9;
  col += uCool * smoothstep(0.5, 1.0, -r.y) * 0.7;
  return col;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y * 2.0;
  vec3 ro = vec3(0.0, 0.0, 5.0);
  vec3 rd = normalize(vec3(uv * 0.5, -1.0));
  float t = 0.0;
  float glow = 1e3;
  bool hit = false;
  for (int i = 0; i < 64; i++) {
    float d = map(ro + rd * t);
    glow = min(glow, d);
    if (d < 0.002) { hit = true; break; }
    t += d * 0.85;
    if (t > 9.0) break;
  }
  if (hit) {
    vec3 p = ro + rd * t;
    vec3 n = normal(p);
    vec3 r = reflect(rd, n);
    vec3 L = normalize(vec3(0.55, 0.8, 0.6));
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    float dif = max(dot(n, L), 0.0);
    float spec = pow(max(dot(r, L), 0.0), 28.0);
    vec3 col = uAccent * (0.1 + 0.62 * dif) + env(r) * (0.3 + 0.7 * fres) + vec3(1.0, 0.96, 0.9) * spec * 1.4;
    col *= 0.9 + 0.1 * cos(6.2831 * (fres * 0.8 + vec3(0.0, 0.33, 0.67)));
    o = vec4(col, 1.0);
  } else {
    float g = exp(-max(glow, 0.0) * 11.0) * 0.32;
    o = vec4(uAccent * g, g);
  }
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uRes;
uniform float uCell;
uniform vec3 uLens;
uniform vec3 uInk;
uniform vec3 uAccent;
uniform float uFade;
out vec4 o;

float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 cell = floor(fc / uCell);
  vec4 s = texture(uScene, (cell + 0.5) * uCell / uRes);
  float lum = dot(s.rgb, vec3(0.299, 0.587, 0.114));
  float level = floor(clamp(lum * 1.7, 0.0, 1.0) * 2.0 + bayer8(cell));
  vec4 dith = level < 1.0 ? vec4(0.0) : level < 2.0 ? vec4(uAccent, 1.0) : vec4(uInk, 1.0);

  float dist = length(fc - uLens.xy);
  float m = uLens.z > 0.5 ? 1.0 - smoothstep(uLens.z - 1.5, uLens.z + 0.5, dist) : 0.0;
  vec2 luv = (uLens.xy + (fc - uLens.xy) * 0.86) / uRes;
  vec4 clean = texture(uScene, luv);
  clean.rgb = clean.rgb / (1.0 + clean.rgb * 0.35);
  vec4 col = mix(dith, clean, m);
  float ring = uLens.z > 0.5 ? (1.0 - smoothstep(0.0, 1.4, abs(dist - uLens.z))) * 0.7 : 0.0;
  col = col * (1.0 - ring) + vec4(uInk, 1.0) * ring;
  o = col * uFade;
}`;

export type HeroColors = { ink: string; accent: string; gold: string; cool: string };
export type HeroOptions = {
  colors: HeroColors;
  mobile: boolean;
  reduced: boolean;
  onProgress?: (p: number) => void;
  onFail?: () => void;
};

const rgb = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255] as const;
};

/** Queue compile + link without waiting, so KHR_parallel_shader_compile can keep it off the main thread. */
function begin(gl: WebGL2RenderingContext, frag: string) {
  const p = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, frag]] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  return p;
}

function finish(gl: WebGL2RenderingContext, p: WebGLProgram) {
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link failed");
  const u: Record<string, WebGLUniformLocation | null> = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const name = gl.getActiveUniform(p, i)!.name;
    u[name] = gl.getUniformLocation(p, name);
  }
  return { p, u };
}

type Program = ReturnType<typeof finish>;

export function createHero(canvas: HTMLCanvasElement, opts: HeroOptions) {
  const attrs = { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "high-performance" } as const;
  let gl = canvas.getContext("webgl2", { ...attrs, failIfMajorPerformanceCaveat: true });
  let software = !gl;
  if (!gl) gl = canvas.getContext("webgl2", attrs) as WebGL2RenderingContext | null;
  if (!gl) return null;
  const dbg = gl.getExtension("WEBGL_debug_renderer_info");
  if (dbg && /swiftshader|llvmpipe|softpipe|software/i.test(String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)))) software = true;
  // Software GL can't hold a frame rate, so it gets the same still frame as reduced motion (lens still follows the pointer).
  const still = opts.reduced || software;
  opts.onProgress?.(0.3);

  const parallel = gl.getExtension("KHR_parallel_shader_compile");
  const pending$ = [begin(gl, SCENE), begin(gl, COMPOSITE)];
  let scene!: Program, comp!: Program;
  let ready = false;
  let compileRaf = 0;
  const poll = () => {
    if (parallel && !pending$.every((p) => gl!.getProgramParameter(p, parallel.COMPLETION_STATUS_KHR))) {
      compileRaf = requestAnimationFrame(poll);
      return;
    }
    try {
      scene = finish(gl!, pending$[0]);
      comp = finish(gl!, pending$[1]);
    } catch (e) {
      console.warn("[hero] shader failed, falling back", e);
      opts.onFail?.();
      return;
    }
    ready = true;
    opts.onProgress?.(0.7);
    if (!running) renderOnce();
  };
  compileRaf = requestAnimationFrame(poll);

  const vao = gl.createVertexArray();
  const tex = gl.createTexture()!;
  const fbo = gl.createFramebuffer()!;
  const C = { ink: rgb(opts.colors.ink), accent: rgb(opts.colors.accent), gold: rgb(opts.colors.gold), cool: rgb(opts.colors.cool) };

  let w = 0, h = 0, sw = 0, sh = 0, dpr = 1;
  let quality = software ? 0.34 : opts.mobile ? 0.38 : 0.5;
  let raf = 0, running = false, first = true;
  let time = 2.4;
  let last = 0;
  let slowFrames = 0;
  let scroll = 0;
  const ptr = { x: 0, y: 0, active: false, lastMove: -1e9 };
  const follow = { x: 0, y: 0 };
  const lens = { x: 0, y: 0, r: 0 };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    canvas.width = w;
    canvas.height = h;
    sw = Math.max(1, Math.round(canvas.clientWidth * quality));
    sh = Math.max(1, Math.round(canvas.clientHeight * quality));
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA8, sw, sh, 0, gl!.RGBA, gl!.UNSIGNED_BYTE, null);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, tex, 0);
  }

  /** CSS px (top-left origin) -> world units on the z = 0 plane (camera half-height there is 2.5). */
  const toWorld = (x: number, y: number) => {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    return [((x - cw / 2) / ch) * 2 * 2.5, (-(y - ch / 2) / ch) * 2 * 2.5];
  };

  function layout() {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const aspect = cw / ch;
    if (aspect < 0.9) return { cx: 0, cy: 1.3, s: Math.min(0.56, aspect * 1.0) };
    return { cx: aspect * 2.5 * 0.38, cy: 0.2, s: Math.min(0.8, aspect * 0.5) };
  }

  function frame(now: number) {
    if (!ready) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    if (!still) time += dt;

    const L = layout();
    const idle = now - ptr.lastMove > 2600;
    let tx: number, ty: number;
    if (ptr.active && !idle && !still) {
      [tx, ty] = toWorld(ptr.x, ptr.y);
    } else {
      tx = L.cx + Math.cos(time * 0.6) * 1.5 * L.s;
      ty = L.cy + Math.sin(time * 0.9) * 1.1 * L.s;
    }
    const k = still ? 1 : 1 - Math.pow(0.001, dt);
    follow.x += (tx - follow.x) * k;
    follow.y += (ty - follow.y) * k;

    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    let lx: number, ly: number, lr: number;
    if (ptr.active && !idle) {
      lx = ptr.x; ly = ptr.y; lr = opts.mobile ? 92 : 150;
    } else {
      const ax = (L.cx / 2.5 / 2) * ch + cw / 2, ay = ch / 2 - (L.cy / 2.5 / 2) * ch;
      lx = ax + Math.sin(time * 0.45) * ch * 0.16 * (opts.mobile ? 0.8 : 1);
      ly = ay + Math.sin(time * 0.7 + 1) * ch * 0.1;
      lr = opts.mobile ? 72 : 110;
    }
    const lk = first || still ? 1 : 1 - Math.pow(0.0005, dt);
    lens.x += (lx - lens.x) * lk;
    lens.y += (ly - lens.y) * lk;
    lens.r += (lr - lens.r) * (still ? 1 : lk * 0.6);

    const beat = (time * 92) / 60;
    const pulse = Math.pow(0.5 + 0.5 * Math.cos(beat * Math.PI * 2), 6);

    gl!.bindVertexArray(vao);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.viewport(0, 0, sw, sh);
    gl!.useProgram(scene.p);
    gl!.uniform2f(scene.u.uRes, sw, sh);
    gl!.uniform1f(scene.u.uTime, time);
    gl!.uniform1f(scene.u.uPulse, still ? 0 : pulse);
    gl!.uniform3f(scene.u.uFollow, follow.x, follow.y, 0.4);
    gl!.uniform2f(scene.u.uCenter, L.cx, L.cy);
    gl!.uniform1f(scene.u.uScale, L.s);
    gl!.uniform3fv(scene.u.uAccent, C.accent);
    gl!.uniform3fv(scene.u.uGold, C.gold);
    gl!.uniform3fv(scene.u.uCool, C.cool);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.viewport(0, 0, w, h);
    gl!.useProgram(comp.p);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.uniform1i(comp.u.uScene, 0);
    gl!.uniform2f(comp.u.uRes, w, h);
    gl!.uniform1f(comp.u.uCell, Math.max(2, Math.round(3 * dpr * (1 + scroll * 2.5))));
    gl!.uniform3f(comp.u.uLens, lens.x * dpr, h - lens.y * dpr, lens.r * dpr * (1 - scroll));
    gl!.uniform3fv(comp.u.uInk, C.ink);
    gl!.uniform3fv(comp.u.uAccent, C.accent);
    gl!.uniform1f(comp.u.uFade, 1 - scroll * 0.85);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);

    if (first) {
      first = false;
      opts.onProgress?.(1);
    }

    if (dt > 0.028) slowFrames++;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 45 && quality > 0.26) {
      quality = Math.max(0.26, quality * 0.75);
      slowFrames = 0;
      resize();
    }
  }

  const loop = (now: number) => {
    frame(now);
    if (running) raf = requestAnimationFrame(loop);
  };
  let pending = 0;
  const renderOnce = () => {
    if (pending) return;
    pending = requestAnimationFrame((n) => {
      pending = 0;
      last = 0;
      frame(n);
    });
  };

  resize();
  const ro = new ResizeObserver(() => { resize(); if (!running) renderOnce(); });
  ro.observe(canvas);

  return {
    start() {
      if (running || still) { renderOnce(); return; }
      running = true;
      last = 0;
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    pointer(x: number, y: number, active: boolean) {
      ptr.x = x; ptr.y = y; ptr.active = active;
      if (active) ptr.lastMove = performance.now();
      if (still) renderOnce();
    },
    scroll(p: number) {
      const next = Math.min(Math.max(p, 0), 1);
      if (next === scroll) return;
      scroll = next;
      if (!running) renderOnce();
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(pending);
      cancelAnimationFrame(compileRaf);
      ro.disconnect();
      gl!.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

export type Hero = NonNullable<ReturnType<typeof createHero>>;
