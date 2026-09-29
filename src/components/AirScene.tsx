// "Air has a surface" — cursor-driven ripple surface (inspired by @xbh_artist).
// Classic 2D height-field wave equation on ping-pong render targets; the display
// shader refracts a typographic texture through the surface normals.
import * as THREE from "three";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, createPortal, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import { DPR } from "../lib/hooks";

const SIM_W = 320;
const SIM_H = 160;

const quadVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const simFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uState;
  uniform vec2 uTexel;
  uniform vec3 uDrop;   // xy = uv, z = strength
  uniform float uAspect;
  varying vec2 vUv;
  void main() {
    vec2 s = texture2D(uState, vUv).rg;
    float L = texture2D(uState, vUv - vec2(uTexel.x, 0.0)).r;
    float R = texture2D(uState, vUv + vec2(uTexel.x, 0.0)).r;
    float T = texture2D(uState, vUv + vec2(0.0, uTexel.y)).r;
    float B = texture2D(uState, vUv - vec2(0.0, uTexel.y)).r;
    float h = (L + R + T + B) * 0.5 - s.g;
    h *= 0.975;
    vec2 d = vUv - uDrop.xy; d.x *= uAspect;
    h += uDrop.z * exp(-dot(d, d) / 0.00025);
    gl_FragColor = vec4(h, s.r, 0.0, 1.0);
  }
`;
const displayVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const displayFrag = /* glsl */ `
  precision highp float;
  uniform sampler2D uHeight;
  uniform sampler2D uText;
  uniform vec2 uTexel;
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    float L = texture2D(uHeight, vUv - vec2(uTexel.x, 0.0)).r;
    float R = texture2D(uHeight, vUv + vec2(uTexel.x, 0.0)).r;
    float T = texture2D(uHeight, vUv + vec2(0.0, uTexel.y)).r;
    float B = texture2D(uHeight, vUv - vec2(0.0, uTexel.y)).r;
    vec3 n = normalize(vec3(L - R, B - T, 0.08));
    vec2 off = n.xy * 0.06;
    // chromatic refraction of the type layer
    float r = texture2D(uText, vUv + off * 1.1).r;
    float g = texture2D(uText, vUv + off).g;
    float b = texture2D(uText, vUv + off * 0.9).b;
    vec3 col = vec3(r, g, b);
    // deep background gradient (electric blue -> magenta)
    vec3 bg = mix(vec3(0.02, 0.03, 0.09), vec3(0.10, 0.01, 0.08), vUv.x);
    bg += 0.05 * vec3(0.16, 0.29, 1.0) * (1.0 - vUv.y);
    col = max(col, bg);
    vec3 lightDir = normalize(vec3(-0.4, 0.6, 1.0));
    float spec = pow(max(dot(reflect(-lightDir, n), vec3(0.0, 0.0, 1.0)), 0.0), 60.0);
    float rim = 1.0 - n.z;
    col += spec * vec3(0.9, 0.95, 1.0) * 1.2;
    col += min(rim * 2.2, 0.9) * mix(vec3(0.16, 0.29, 1.0), vec3(1.0, 0.17, 0.84), vUv.x);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function makeTextTexture(aspect: number) {
  const c = document.createElement("canvas");
  const tall = aspect < 1.2;
  c.width = tall ? 1024 : 2048;
  c.height = tall ? Math.round(1024 / Math.max(aspect, 0.4)) : Math.round(2048 / aspect);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = "#f4f1ea";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lines = tall ? ["AIR", "HAS A", "SURFACE"] : ["AIR HAS", "A SURFACE"];
  const fs = tall ? 190 : Math.min(250, c.height * 0.3);
  ctx.font = `800 ${fs}px 'Bricolage Grotesque Variable', system-ui, sans-serif`;
  lines.forEach((l, i) => ctx.fillText(l, c.width / 2, c.height / 2 + (i - (lines.length - 1) / 2) * fs * 1.02));
  // fine grid, like a studio cutting mat
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.lineWidth = 2;
  for (let x = 0; x <= c.width; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, c.height); ctx.stroke();
  }
  for (let y = 0; y <= c.height; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(c.width, y); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

function Surface({ reduced }: { reduced: boolean }) {
  const { viewport, size } = useThree();
  const opts = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
  const a = useFBO(SIM_W, SIM_H, opts);
  const b = useFBO(SIM_W, SIM_H, opts);
  const targets = useRef([a, b]);
  targets.current = [a, b];
  const [simScene] = useMemo(() => [new THREE.Scene()], []);
  const simCam = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  const pointer = useRef({ uv: new THREE.Vector2(0.5, 0.5), last: new THREE.Vector2(), moved: false, t: 0 });

  const aspect = Math.round((size.width / Math.max(size.height, 1)) * 4) / 4;
  const textTex = useMemo(() => makeTextTexture(aspect), [aspect]);
  useEffect(() => {
    // redraw once web fonts are ready so the display face is used
    document.fonts?.ready.then(() => {
      textTex.image = makeTextTexture(aspect).image;
      textTex.needsUpdate = true;
    });
  }, [textTex, aspect]);

  const simMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: quadVert,
        fragmentShader: simFrag,
        uniforms: {
          uState: { value: null },
          uTexel: { value: new THREE.Vector2(1 / SIM_W, 1 / SIM_H) },
          uDrop: { value: new THREE.Vector3(0.5, 0.5, 0) },
          uAspect: { value: SIM_W / SIM_H },
        },
      }),
    [],
  );
  const dispMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: displayVert,
        fragmentShader: displayFrag,
        uniforms: {
          uHeight: { value: null },
          uText: { value: textTex },
          uTexel: { value: new THREE.Vector2(1 / SIM_W, 1 / SIM_H) },
          uTime: { value: 0 },
        },
      }),
    [textTex],
  );

  useFrame((state) => {
    const gl = state.gl;
    const [read, write] = targets.current;
    const p = pointer.current;
    const drop = simMat.uniforms.uDrop.value as THREE.Vector3;
    if (p.moved) {
      drop.set(p.uv.x, p.uv.y, 0.3);
      p.moved = false;
    } else if (!reduced) {
      // ambient "breathing" drop that drifts across the strip when idle
      const t = state.clock.elapsedTime;
      p.t += 1;
      drop.set(0.5 + 0.38 * Math.sin(t * 0.45), 0.5 + 0.3 * Math.sin(t * 0.8), p.t % 4 === 0 ? 0.12 : 0);
    } else {
      drop.z = 0;
    }
    simMat.uniforms.uState.value = read.texture;
    gl.setRenderTarget(write);
    gl.render(simScene, simCam);
    gl.setRenderTarget(null);
    targets.current.reverse();
    // swap for next frame: keep refs consistent with drei FBO objects
    dispMat.uniforms.uHeight.value = write.texture;
    dispMat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!e.uv) return;
    pointer.current.uv.copy(e.uv);
    pointer.current.moved = true;
  };

  return (
    <>
      {createPortal(
        <mesh material={simMat} frustumCulled={false}>
          <planeGeometry args={[2, 2]} />
        </mesh>,
        simScene,
      )}
      <mesh scale={[viewport.width, viewport.height, 1]} material={dispMat} onPointerMove={onMove}>
        <planeGeometry args={[1, 1]} />
      </mesh>
    </>
  );
}

export function AirScene({ active, reduced }: { active: boolean; reduced: boolean }) {
  return (
    <Canvas
      frameloop={!active ? "never" : "always"}
      dpr={DPR}
      gl={{ antialias: false }}
      flat
      linear
      orthographic
      camera={{ position: [0, 0, 5], zoom: 1 }}
      aria-hidden
    >
      <Surface reduced={reduced} />
    </Canvas>
  );
}
