/*
 * Cursor ink/fluid trail for the "Paint with us" section.
 * Condensed TypeScript port of WebGL-Fluid-Simulation by Pavel Dobryakov.
 * https://github.com/PavelDoGreat/WebGL-Fluid-Simulation
 *
 * MIT License
 *
 * Copyright (c) 2017 Pavel Dobryakov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Changes from the original: TypeScript, WebGL2-only, no GUI/bloom/sunrays/
 * screenshots/promo, splats on hover (no click needed), Senai brand palette,
 * DPR capped, start/stop API for offscreen pausing.
 */

type FBO = {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (id: number) => number;
};
type DoubleFBO = {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
};
type RGB = { r: number; g: number; b: number };

const config = {
  SIM_RESOLUTION: 128,
  DYE_RESOLUTION: 720,
  DENSITY_DISSIPATION: 1.4,
  VELOCITY_DISSIPATION: 0.3,
  PRESSURE: 0.8,
  PRESSURE_ITERATIONS: 20,
  CURL: 28,
  SPLAT_RADIUS: 0.22,
  SPLAT_FORCE: 6000,
  SHADING: true,
};

// Senai accents: electric blue, magenta, red, yellow (+ cyan for variety)
const PALETTE: RGB[] = [
  { r: 0.16, g: 0.29, b: 1.0 },
  { r: 1.0, g: 0.17, b: 0.84 },
  { r: 1.0, g: 0.23, b: 0.18 },
  { r: 1.0, g: 0.83, b: 0.0 },
  { r: 0.2, g: 0.88, b: 1.0 },
];

const baseVertex = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv; out vec2 vL; out vec2 vR; out vec2 vT; out vec2 vB;
uniform vec2 texelSize;
void main () {
  vUv = aPosition * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const fragHeader = `#version 300 es
precision highp float;
precision highp sampler2D;
in vec2 vUv; in vec2 vL; in vec2 vR; in vec2 vT; in vec2 vB;
out vec4 fragColor;
`;

const shaders = {
  clear: `${fragHeader}
uniform sampler2D uTexture; uniform float value;
void main () { fragColor = value * texture(uTexture, vUv); }`,
  display: `${fragHeader}
uniform sampler2D uTexture; uniform vec2 texelSize;
void main () {
  vec3 c = texture(uTexture, vUv).rgb;
  vec3 lc = texture(uTexture, vL).rgb;
  vec3 rc = texture(uTexture, vR).rgb;
  vec3 tc = texture(uTexture, vT).rgb;
  vec3 bc = texture(uTexture, vB).rgb;
  float dx = length(rc) - length(lc);
  float dy = length(tc) - length(bc);
  vec3 n = normalize(vec3(dx, dy, length(texelSize)));
  float diffuse = clamp(dot(n, vec3(0.0, 0.0, 1.0)) + 0.7, 0.7, 1.0);
  c *= diffuse;
  float a = max(c.r, max(c.g, c.b));
  fragColor = vec4(c, a);
}`,
  splat: `${fragHeader}
uniform sampler2D uTarget; uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;
void main () {
  vec2 p = vUv - point.xy;
  p.x *= aspectRatio;
  vec3 splat = exp(-dot(p, p) / radius) * color;
  vec3 base = texture(uTarget, vUv).xyz;
  fragColor = vec4(base + splat, 1.0);
}`,
  advection: `${fragHeader}
uniform sampler2D uVelocity; uniform sampler2D uSource; uniform vec2 texelSize; uniform float dt; uniform float dissipation;
void main () {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  vec4 result = texture(uSource, coord);
  float decay = 1.0 + dissipation * dt;
  fragColor = result / decay;
}`,
  divergence: `${fragHeader}
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) { L = -C.x; }
  if (vR.x > 1.0) { R = -C.x; }
  if (vT.y > 1.0) { T = -C.y; }
  if (vB.y < 0.0) { B = -C.y; }
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`,
  curl: `${fragHeader}
uniform sampler2D uVelocity;
void main () {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  fragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`,
  vorticity: `${fragHeader}
uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;
void main () {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity += force * dt;
  velocity = min(max(velocity, -1000.0), 1000.0);
  fragColor = vec4(velocity, 0.0, 1.0);
}`,
  pressure: `${fragHeader}
uniform sampler2D uPressure; uniform sampler2D uDivergence;
void main () {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float divergence = texture(uDivergence, vUv).x;
  fragColor = vec4((L + R + B + T - divergence) * 0.25, 0.0, 0.0, 1.0);
}`,
  gradientSubtract: `${fragHeader}
uniform sampler2D uPressure; uniform sampler2D uVelocity;
void main () {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 velocity = texture(uVelocity, vUv).xy;
  velocity.xy -= vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}`,
};

export type FluidHandle = { start: () => void; stop: () => void; destroy: () => void; burst: (n: number) => void };

export function createFluid(canvas: HTMLCanvasElement, maxDpr = 1.5): FluidHandle | null {
  const gl = canvas.getContext("webgl2", { alpha: true, depth: false, stencil: false, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: false });
  if (!gl) return null;
  gl.getExtension("EXT_color_buffer_float");
  gl.getExtension("OES_texture_float_linear");
  const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

  function supportRT(internalFormat: number, format: number, type: number) {
    const t = gl!.createTexture();
    gl!.bindTexture(gl!.TEXTURE_2D, t);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.NEAREST);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.NEAREST);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
    const f = gl!.createFramebuffer();
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, f);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, t, 0);
    const ok = gl!.checkFramebufferStatus(gl!.FRAMEBUFFER) === gl!.FRAMEBUFFER_COMPLETE;
    gl!.deleteTexture(t);
    gl!.deleteFramebuffer(f);
    return ok;
  }
  function format(internal: number, fmt: number, type: number): { internalFormat: number; format: number } | null {
    if (supportRT(internal, fmt, type)) return { internalFormat: internal, format: fmt };
    if (internal === gl!.R16F) return format(gl!.RG16F, gl!.RG, type);
    if (internal === gl!.RG16F) return format(gl!.RGBA16F, gl!.RGBA, type);
    return null;
  }
  const type = gl.HALF_FLOAT;
  const rgba = format(gl.RGBA16F, gl.RGBA, type);
  const rg = format(gl.RG16F, gl.RG, type);
  const r = format(gl.R16F, gl.RED, type);
  if (!rgba || !rg || !r) return null;

  function compile(kind: number, src: string) {
    const s = gl!.createShader(kind)!;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) console.warn(gl!.getShaderInfoLog(s));
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, baseVertex);
  function program(frag: string) {
    const p = gl!.createProgram()!;
    gl!.attachShader(p, vs);
    gl!.attachShader(p, compile(gl!.FRAGMENT_SHADER, frag));
    gl!.bindAttribLocation(p, 0, "aPosition");
    gl!.linkProgram(p);
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const n = gl!.getProgramParameter(p, gl!.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const name = gl!.getActiveUniform(p, i)!.name;
      uniforms[name] = gl!.getUniformLocation(p, name);
    }
    return { bind: () => gl!.useProgram(p), u: uniforms };
  }
  const P = Object.fromEntries(Object.entries(shaders).map(([k, v]) => [k, program(v)])) as Record<keyof typeof shaders, ReturnType<typeof program>>;

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  function blit(target: FBO | null) {
    if (!target) {
      gl!.viewport(0, 0, gl!.drawingBufferWidth, gl!.drawingBufferHeight);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    } else {
      gl!.viewport(0, 0, target.width, target.height);
      gl!.bindFramebuffer(gl!.FRAMEBUFFER, target.fbo);
    }
    gl!.drawElements(gl!.TRIANGLES, 6, gl!.UNSIGNED_SHORT, 0);
  }

  function createFBO(w: number, h: number, internalFormat: number, fmt: number, param: number): FBO {
    gl!.activeTexture(gl!.TEXTURE0);
    const texture = gl!.createTexture()!;
    gl!.bindTexture(gl!.TEXTURE_2D, texture);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, param);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, param);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
    gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
    gl!.texImage2D(gl!.TEXTURE_2D, 0, internalFormat, w, h, 0, fmt, type, null);
    const fbo = gl!.createFramebuffer()!;
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, fbo);
    gl!.framebufferTexture2D(gl!.FRAMEBUFFER, gl!.COLOR_ATTACHMENT0, gl!.TEXTURE_2D, texture, 0);
    gl!.viewport(0, 0, w, h);
    gl!.clearColor(0, 0, 0, 1);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    return {
      texture, fbo, width: w, height: h, texelSizeX: 1 / w, texelSizeY: 1 / h,
      attach(id: number) {
        gl!.activeTexture(gl!.TEXTURE0 + id);
        gl!.bindTexture(gl!.TEXTURE_2D, texture);
        return id;
      },
    };
  }
  function createDoubleFBO(w: number, h: number, internalFormat: number, fmt: number, param: number): DoubleFBO {
    let a = createFBO(w, h, internalFormat, fmt, param);
    let b = createFBO(w, h, internalFormat, fmt, param);
    return {
      width: w, height: h, texelSizeX: a.texelSizeX, texelSizeY: a.texelSizeY,
      get read() { return a; },
      set read(v) { a = v; },
      get write() { return b; },
      set write(v) { b = v; },
      swap() { const t = a; a = b; b = t; },
    };
  }
  function getResolution(res: number) {
    let ar = gl!.drawingBufferWidth / gl!.drawingBufferHeight;
    if (ar < 1) ar = 1 / ar;
    const min = Math.round(res);
    const max = Math.round(res * ar);
    return gl!.drawingBufferWidth > gl!.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
  }

  let dye: DoubleFBO, velocity: DoubleFBO, divergence: FBO, curl: FBO, pressure: DoubleFBO;
  function initFramebuffers() {
    const sim = getResolution(config.SIM_RESOLUTION);
    const dyeRes = getResolution(config.DYE_RESOLUTION);
    // half-float textures are always linearly filterable in WebGL2
    const filtering = gl!.LINEAR;
    gl!.disable(gl!.BLEND);
    dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba!.internalFormat, rgba!.format, filtering);
    velocity = createDoubleFBO(sim.width, sim.height, rg!.internalFormat, rg!.format, filtering);
    divergence = createFBO(sim.width, sim.height, r!.internalFormat, r!.format, gl!.NEAREST);
    curl = createFBO(sim.width, sim.height, r!.internalFormat, r!.format, gl!.NEAREST);
    pressure = createDoubleFBO(sim.width, sim.height, r!.internalFormat, r!.format, gl!.NEAREST);
  }
  function resizeCanvas() {
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (w && h && (canvas.width !== w || canvas.height !== h)) {
      canvas.width = w;
      canvas.height = h;
      return true;
    }
    return false;
  }
  resizeCanvas();
  initFramebuffers();

  const pointer = { x: 0, y: 0, px: 0, py: 0, dx: 0, dy: 0, moved: false, color: PALETTE[0], inside: false };
  let colorIdx = 0;
  let colorTimer = 0;
  const splatStack: number[] = [];

  function scaled(c: RGB, k: number): RGB {
    return { r: c.r * k, g: c.g * k, b: c.b * k };
  }
  function correctRadius(rad: number) {
    const ar = canvas.width / canvas.height;
    return ar > 1 ? rad * ar : rad;
  }
  function splat(x: number, y: number, dx: number, dy: number, color: RGB) {
    P.splat.bind();
    gl!.uniform1i(P.splat.u.uTarget, velocity.read.attach(0));
    gl!.uniform1f(P.splat.u.aspectRatio, canvas.width / canvas.height);
    gl!.uniform2f(P.splat.u.point, x, y);
    gl!.uniform3f(P.splat.u.color, dx, dy, 0);
    gl!.uniform1f(P.splat.u.radius, correctRadius(config.SPLAT_RADIUS / 100));
    blit(velocity.write);
    velocity.swap();
    gl!.uniform1i(P.splat.u.uTarget, dye.read.attach(0));
    gl!.uniform3f(P.splat.u.color, color.r, color.g, color.b);
    blit(dye.write);
    dye.swap();
  }
  function multipleSplats(n: number) {
    for (let i = 0; i < n; i++) {
      const c = scaled(PALETTE[Math.floor(Math.random() * PALETTE.length)], 1.2);
      splat(Math.random(), Math.random(), 1000 * (Math.random() - 0.5), 1000 * (Math.random() - 0.5), c);
    }
  }

  function step(dt: number) {
    gl!.disable(gl!.BLEND);
    P.curl.bind();
    gl!.uniform2f(P.curl.u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(P.curl.u.uVelocity, velocity.read.attach(0));
    blit(curl);

    P.vorticity.bind();
    gl!.uniform2f(P.vorticity.u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(P.vorticity.u.uVelocity, velocity.read.attach(0));
    gl!.uniform1i(P.vorticity.u.uCurl, curl.attach(1));
    gl!.uniform1f(P.vorticity.u.curl, config.CURL);
    gl!.uniform1f(P.vorticity.u.dt, dt);
    blit(velocity.write);
    velocity.swap();

    P.divergence.bind();
    gl!.uniform2f(P.divergence.u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(P.divergence.u.uVelocity, velocity.read.attach(0));
    blit(divergence);

    P.clear.bind();
    gl!.uniform1i(P.clear.u.uTexture, pressure.read.attach(0));
    gl!.uniform1f(P.clear.u.value, config.PRESSURE);
    blit(pressure.write);
    pressure.swap();

    P.pressure.bind();
    gl!.uniform2f(P.pressure.u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(P.pressure.u.uDivergence, divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl!.uniform1i(P.pressure.u.uPressure, pressure.read.attach(1));
      blit(pressure.write);
      pressure.swap();
    }

    P.gradientSubtract.bind();
    gl!.uniform2f(P.gradientSubtract.u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl!.uniform1i(P.gradientSubtract.u.uPressure, pressure.read.attach(0));
    gl!.uniform1i(P.gradientSubtract.u.uVelocity, velocity.read.attach(1));
    blit(velocity.write);
    velocity.swap();

    P.advection.bind();
    gl!.uniform2f(P.advection.u.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    const vId = velocity.read.attach(0);
    gl!.uniform1i(P.advection.u.uVelocity, vId);
    gl!.uniform1i(P.advection.u.uSource, vId);
    gl!.uniform1f(P.advection.u.dt, dt);
    gl!.uniform1f(P.advection.u.dissipation, config.VELOCITY_DISSIPATION);
    blit(velocity.write);
    velocity.swap();

    gl!.uniform1i(P.advection.u.uVelocity, velocity.read.attach(0));
    gl!.uniform1i(P.advection.u.uSource, dye.read.attach(1));
    gl!.uniform1f(P.advection.u.dissipation, config.DENSITY_DISSIPATION);
    blit(dye.write);
    dye.swap();
  }

  function render() {
    gl!.blendFunc(gl!.ONE, gl!.ONE_MINUS_SRC_ALPHA);
    gl!.enable(gl!.BLEND);
    gl!.bindFramebuffer(gl!.FRAMEBUFFER, null);
    gl!.viewport(0, 0, gl!.drawingBufferWidth, gl!.drawingBufferHeight);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    P.display.bind();
    gl!.uniform2f(P.display.u.texelSize, 1 / gl!.drawingBufferWidth, 1 / gl!.drawingBufferHeight);
    gl!.uniform1i(P.display.u.uTexture, dye.read.attach(0));
    blit(null);
  }

  let raf = 0;
  let last = performance.now();
  function frame() {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.016666);
    last = now;
    if (resizeCanvas()) initFramebuffers();
    colorTimer += dt * 1.5;
    if (colorTimer >= 1) {
      colorTimer = 0;
      colorIdx = (colorIdx + 1) % PALETTE.length;
      pointer.color = PALETTE[colorIdx];
    }
    if (splatStack.length) multipleSplats(splatStack.pop()!);
    if (pointer.moved) {
      pointer.moved = false;
      splat(pointer.x, pointer.y, pointer.dx * config.SPLAT_FORCE, pointer.dy * config.SPLAT_FORCE, scaled(pointer.color, 0.35));
    }
    step(dt);
    render();
    raf = requestAnimationFrame(frame);
  }

  // Pointer input is read from the whole section (so the form stays usable).
  const host = canvas.parentElement ?? canvas;
  function onMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    if (!pointer.inside) {
      pointer.inside = true;
      pointer.x = x; pointer.y = y;
      return;
    }
    pointer.px = pointer.x; pointer.py = pointer.y;
    pointer.x = x; pointer.y = y;
    const ar = canvas.width / canvas.height;
    pointer.dx = (x - pointer.px) * (ar < 1 ? ar : 1);
    pointer.dy = (y - pointer.py) / (ar > 1 ? ar : 1);
    pointer.moved = Math.abs(pointer.dx) > 0 || Math.abs(pointer.dy) > 0;
  }
  function onLeave() { pointer.inside = false; }
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerleave", onLeave);

  splatStack.push(Math.floor(Math.random() * 6) + 8);

  return {
    start() {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
    burst(n: number) { splatStack.push(n); },
    destroy() {
      cancelAnimationFrame(raf);
      raf = 0;
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      // Note: the context is intentionally not force-lost here — React StrictMode
      // re-mounts the effect and getContext() would hand back the lost context.
    },
  };
}
