// Adapted from pmndrs/examples "lusion-connectors" (MIT, © 2024 Poimandres)
// https://github.com/pmndrs/examples/tree/main/examples/lusion-connectors
// Changes: GLB connector replaced with procedural capsules/spheres/boxes/tori,
// Senai palette, bloom + grain instead of N8AO, event source = hero section.
import * as THREE from "three";
import { type ReactNode, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  MeshTransmissionMaterial,
  Environment,
  Lightformer,
  RoundedBox,
} from "@react-three/drei";
import {
  BallCollider,
  CapsuleCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { easing } from "maath";
import { DPR } from "../lib/hooks";

import { PALETTES } from "../palette";
export { PALETTES };

type Kind = "capsule" | "sphere" | "box" | "torus";
type Item = { kind: Kind; color: string; roughness: number; accent?: boolean; glass?: boolean };

const KINDS: Kind[] = ["capsule", "sphere", "box", "torus", "capsule", "capsule"];

function makeItems(accent: string, count: number): Item[] {
  const base: Omit<Item, "kind">[] = [
    { color: "#2b2b30", roughness: 0.08 },
    { color: "#2b2b30", roughness: 0.6 },
    { color: "#f2f2f2", roughness: 0.08 },
    { color: "#f2f2f2", roughness: 0.6 },
    { color: accent, roughness: 0.08, accent: true },
    { color: accent, roughness: 0.5, accent: true },
    { color: accent, roughness: 0.1, accent: true },
  ];
  return Array.from({ length: count }, (_, i) => ({
    ...base[i % base.length],
    kind: KINDS[i % KINDS.length],
  }));
}

export function HeroScene({
  accentIndex,
  eventSource,
  active,
  reduced,
  mobile,
}: {
  accentIndex: number;
  eventSource: RefObject<HTMLElement | null>;
  active: boolean;
  reduced: boolean;
  mobile: boolean;
}) {
  const accent = PALETTES[accentIndex % PALETTES.length].accent;
  const count = mobile ? 12 : 18;
  const items = useMemo(() => makeItems(accent, count), [accent, count]);
  // desktop: pile sits right of the headline; mobile: upper half
  // prefers-reduced-motion: let the pile settle briefly (off the critical path), then freeze
  // the render loop entirely (frameloop "demand" + paused physics).
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (!reduced) return;
    setSettled(false); // also re-runs after a palette click so the colour fade completes
    const t = window.setTimeout(() => setSettled(true), 1800);
    return () => window.clearTimeout(t);
  }, [reduced, accentIndex]);
  const frozen = reduced && settled;
  const center = useMemo<[number, number, number]>(() => (mobile ? [0, 1.6, 0] : [2.2, 0.45, 0]), [mobile]);

  return (
    <Canvas
      eventSource={eventSource as RefObject<HTMLElement>}
      eventPrefix="client"
      frameloop={!active ? "never" : frozen ? "demand" : "always"}
      shadows={!mobile}
      dpr={DPR}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, mobile ? 30 : 20], fov: 17.5, near: 1, far: 60 }}
      aria-hidden
    >
      <color attach="background" args={["#0b0b0d"]} />
      <ambientLight intensity={0.35 * Math.PI} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        intensity={Math.PI}
        decay={0}
        castShadow
      />
      <Physics gravity={[0, 0, 0]}>
        <Pointer />
        {items.map((p, i) => (
          <Body key={i} center={center} kind={p.kind} accent={p.accent} color={p.color}>
            <Shape kind={p.kind} color={p.color} roughness={p.roughness} />
          </Body>
        ))}
        {/* glass pieces */}
        <Body kind="capsule" position={[8, 6, 3]} center={center}>
          <Shape kind="capsule">
            <MeshTransmissionMaterial
              clearcoat={1}
              thickness={0.25}
              anisotropicBlur={0.1}
              chromaticAberration={0.15}
              samples={mobile ? 3 : 6}
              resolution={mobile ? 256 : 512}
              backside={false}
            />
          </Shape>
        </Body>
        <Body kind="sphere" position={[-8, -6, 2]} center={center}>
          <Shape kind="sphere">
            <MeshTransmissionMaterial
              clearcoat={1}
              thickness={0.4}
              chromaticAberration={0.2}
              samples={mobile ? 3 : 6}
              resolution={mobile ? 256 : 512}
            />
          </Shape>
        </Body>
      </Physics>
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom mipmapBlur luminanceThreshold={0.85} intensity={0.6} radius={0.7} />
        <Noise opacity={0.06} premultiply={false} />
        <Vignette eskil={false} offset={0.2} darkness={0.75} />
      </EffectComposer>
      <Environment resolution={256}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="circle" intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={2} />
          <Lightformer form="circle" intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={8} />
          <Lightformer form="ring" color={accent} intensity={3} rotation-y={-Math.PI / 2} position={[8, -3, 2]} scale={3} />
        </group>
      </Environment>
    </Canvas>
  );
}

function Body({
  kind,
  position,
  children,
  accent,
  color,
  center = [0, 0, 0],
}: {
  center?: [number, number, number];
  kind: Kind;
  position?: [number, number, number];
  children: ReactNode;
  accent?: boolean;
  color?: string;
}) {
  const api = useRef<RapierRigidBody>(null!);
  const vec = useMemo(() => new THREE.Vector3(), []);
  const c = useMemo(() => new THREE.Vector3(...center), [center]);
  const r = THREE.MathUtils.randFloatSpread;
  const pos = useMemo<[number, number, number]>(() => position || [r(12), r(12), r(8)], []);
  const rot = useMemo<[number, number, number]>(() => [r(6), r(6), r(6)], []);
  useFrame(() => {
    // pull every body toward the centre (same trick as the lusion example)
    if (api.current) api.current.applyImpulse(vec.copy(api.current.translation()).sub(c).negate().multiplyScalar(0.2), false);
  });
  return (
    <RigidBody
      linearDamping={4}
      angularDamping={1}
      friction={0.1}
      position={pos}
      rotation={rot}
      ref={api}
      colliders={false}
    >
      {kind === "capsule" && <CapsuleCollider args={[0.55, 0.45]} />}
      {kind === "sphere" && <BallCollider args={[0.7]} />}
      {kind === "box" && <CuboidCollider args={[0.55, 0.55, 0.55]} />}
      {kind === "torus" && <CuboidCollider args={[0.85, 0.85, 0.3]} />}
      {children}
      {accent && <pointLight intensity={3 * Math.PI} decay={0} distance={2.5} color={color} />}
    </RigidBody>
  );
}

function Pointer() {
  const ref = useRef<RapierRigidBody>(null!);
  const vec = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ pointer, viewport }) => {
    ref.current?.setNextKinematicTranslation(
      vec.set((pointer.x * viewport.width) / 2, (pointer.y * viewport.height) / 2, 0),
    );
  });
  return (
    <RigidBody position={[0, 0, 0]} type="kinematicPosition" colliders={false} ref={ref}>
      <BallCollider args={[1]} />
    </RigidBody>
  );
}

function Shape({
  kind,
  color = "white",
  roughness = 0,
  children,
}: {
  kind: Kind;
  color?: string;
  roughness?: number;
  children?: ReactNode;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    const m = ref.current?.material as THREE.MeshStandardMaterial | undefined;
    if (!children && m?.color) easing.dampC(m.color, color, 0.2, delta);
  });
  const material = children ?? (
    <meshStandardMaterial metalness={0.25} roughness={roughness} envMapIntensity={1.2} />
  );
  if (kind === "box")
    return (
      <RoundedBox ref={ref} args={[1.1, 1.1, 1.1]} radius={0.22} smoothness={4} castShadow receiveShadow>
        {material}
      </RoundedBox>
    );
  return (
    <mesh ref={ref} castShadow receiveShadow>
      {kind === "capsule" && <capsuleGeometry args={[0.45, 1.1, 8, 24]} />}
      {kind === "sphere" && <sphereGeometry args={[0.7, 48, 48]} />}
      {kind === "torus" && <torusGeometry args={[0.6, 0.26, 24, 64]} />}
      {material}
    </mesh>
  );
}
