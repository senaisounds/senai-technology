// Scroll-driven particle morph. The soft round point sprite + depth fade is adapted
// from pmndrs/examples "gpgpu-curl-noise-dof" (MIT, © 2024 Poimandres); the
// multi-target morph and noise swirl are new.
import * as THREE from "three";
import { useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { buildServiceShapes } from "../lib/shapes";
import { DPR } from "../lib/hooks";

import { SERVICE_COLORS } from "../palette";

const vertex = /* glsl */ `
  attribute vec3 p0; attribute vec3 p1; attribute vec3 p2;
  attribute vec3 p3; attribute vec3 p4; attribute vec3 p5;
  attribute float aRand;
  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  uniform vec3 uColA;
  uniform vec3 uColB;
  varying float vAlpha;
  varying vec3 vColor;

  vec3 pick(float i) {
    if (i < 0.5) return p0;
    if (i < 1.5) return p1;
    if (i < 2.5) return p2;
    if (i < 3.5) return p3;
    if (i < 4.5) return p4;
    return p5;
  }

  void main() {
    float idx = floor(uProgress);
    float f = uProgress - idx;
    // stagger each particle a little so the morph feels liquid
    float t = smoothstep(0.0, 1.0, clamp((f - aRand * 0.35) / 0.65, 0.0, 1.0));
    vec3 a = pick(idx);
    vec3 b = pick(min(idx + 1.0, 5.0));
    vec3 pos = mix(a, b, t);
    float swirl = sin(3.14159 * t);
    pos += swirl * 0.9 * vec3(
      sin(uTime * 0.7 + aRand * 40.0 + pos.y * 2.0),
      cos(uTime * 0.6 + aRand * 31.0 + pos.x * 2.0),
      sin(uTime * 0.5 + aRand * 17.0));
    pos += 0.03 * vec3(sin(uTime + aRand * 90.0), cos(uTime * 1.3 + aRand * 70.0), 0.0);
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = -mv.z;
    gl_PointSize = uSize * (0.6 + aRand) * (6.0 / dist);
    vAlpha = clamp(1.4 - dist * 0.12, 0.25, 1.0);
    vColor = mix(uColA, uColB, t);
    vColor = mix(vColor, vec3(1.0), step(0.93, aRand) * 0.8);
  }
`;
const fragment = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    if (r > 1.0) discard;
    float soft = 1.0 - smoothstep(0.2, 1.0, r);
    gl_FragColor = vec4(vColor, vAlpha * soft * 0.85);
  }
`;

function Cloud({ progress, count, reduced }: { progress: MutableRefObject<number>; count: number; reduced: boolean }) {
  const ref = useRef<THREE.Points>(null!);
  const mat = useRef<THREE.ShaderMaterial>(null!);
  const colors = useMemo(() => SERVICE_COLORS.map((c) => new THREE.Color(c)), []);
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const shapes = buildServiceShapes(count);
    g.setAttribute("position", new THREE.BufferAttribute(shapes[0].slice(), 3));
    shapes.forEach((s, i) => g.setAttribute(`p${i}`, new THREE.BufferAttribute(s, 3)));
    const rand = new Float32Array(count);
    for (let i = 0; i < count; i++) rand[i] = Math.random();
    g.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 6);
    return g;
  }, [count]);
  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: 5 },
      uColA: { value: new THREE.Color() },
      uColB: { value: new THREE.Color() },
    }),
    [],
  );
  useFrame((state, delta) => {
    const u = mat.current.uniforms;
    const target = THREE.MathUtils.clamp(progress.current, 0, 5);
    u.uProgress.value = reduced ? Math.round(target) : THREE.MathUtils.damp(u.uProgress.value, target, 4, delta);
    u.uTime.value = state.clock.elapsedTime;
    u.uSize.value = 3.4 * state.viewport.dpr;
    const idx = Math.floor(u.uProgress.value);
    u.uColA.value.copy(colors[idx]);
    u.uColB.value.copy(colors[Math.min(idx + 1, 5)]);
    if (!reduced) {
      // gentle sway (not a full spin) so text-ish shapes stay readable
      const t = state.clock.elapsedTime;
      ref.current.rotation.y = Math.sin(t * 0.35) * 0.55;
      ref.current.rotation.x = Math.sin(t * 0.2) * 0.15;
    }
  });
  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function ServicesScene({
  progress,
  active,
  reduced,
  mobile,
}: {
  progress: MutableRefObject<number>;
  active: boolean;
  reduced: boolean;
  mobile: boolean;
}) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={DPR}
      gl={{ antialias: false }}
      camera={{ position: [0, 0, mobile ? 9 : 7], fov: 45 }}
      aria-hidden
    >
      <color attach="background" args={["#08080a"]} />
      <group position={[mobile ? 0 : 1.6, mobile ? 0.9 : 0, 0]}>
        <Cloud progress={progress} count={mobile ? 9000 : 18000} reduced={reduced} />
      </group>
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={0.4} intensity={0.8} radius={0.6} />
      </EffectComposer>
    </Canvas>
  );
}
