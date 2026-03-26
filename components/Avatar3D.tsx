'use client';

import { useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

const MOUTH_OPEN = 'mouthOpen';
const MOUTH_SMILE = 'mouthSmile';

function AvatarMesh({ amplitude }: { amplitude: number }) {
  const { scene } = useGLTF('/model.glb');
  const morphMeshRef = useRef<THREE.Mesh | null>(null);
  const headRef = useRef<THREE.Object3D | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const ampRef = useRef(0);
  const blinkRef = useRef({ next: 3, value: 0, closing: false });

  ampRef.current = amplitude;

  useEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.morphTargetDictionary && Object.keys(mesh.morphTargetDictionary).length > 0) {
        morphMeshRef.current = mesh;
      }
      if (obj.name.toLowerCase().includes('head') || obj.name.toLowerCase().includes('face')) {
        headRef.current = obj;
      }
    });
    groupRef.current = scene as unknown as THREE.Group;
  }, [scene]);

  useFrame(({ clock }, delta) => {
    const mesh = morphMeshRef.current as THREE.Mesh & {
      morphTargetDictionary?: Record<string, number>;
      morphTargetInfluences?: number[];
    };
    if (!mesh?.morphTargetDictionary || !mesh.morphTargetInfluences) return;

    const dict = mesh.morphTargetDictionary;
    const inf = mesh.morphTargetInfluences;
    const amp = ampRef.current;
    const t = clock.elapsedTime;

    // Mouth driven by audio amplitude
    const jawIdx = dict[MOUTH_OPEN] ?? dict['jawOpen'] ?? dict['mouth_open'];
    if (jawIdx !== undefined) {
      inf[jawIdx] = THREE.MathUtils.lerp(inf[jawIdx], amp * 0.85, 0.35);
    }

    // Subtle resting smile
    const smileIdx = dict[MOUTH_SMILE] ?? dict['mouth_smile'];
    if (smileIdx !== undefined) {
      inf[smileIdx] = THREE.MathUtils.lerp(inf[smileIdx], 0.08, delta * 2);
    }

    // Auto blink every 3–6 seconds
    const blink = blinkRef.current;
    blink.next -= delta;
    if (blink.next <= 0 && !blink.closing) {
      blink.closing = true;
      blink.next = 3 + Math.random() * 3;
    }
    if (blink.closing) {
      blink.value = Math.min(1, blink.value + delta * 14);
      if (blink.value >= 1) {
        setTimeout(() => { blink.closing = false; }, 80);
      }
    } else {
      blink.value = Math.max(0, blink.value - delta * 10);
    }
    const blinkL = dict['eyeBlinkLeft'] ?? dict['eyesClosed'];
    const blinkR = dict['eyeBlinkRight'];
    if (blinkL !== undefined) inf[blinkL] = blink.value;
    if (blinkR !== undefined) inf[blinkR] = blink.value;

    // Idle head sway
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.4) * 0.05 + Math.sin(t * 0.13) * 0.02;
      headRef.current.rotation.x = Math.sin(t * 0.3) * 0.02 + Math.sin(t * 0.17) * 0.01;
      headRef.current.rotation.z = Math.sin(t * 0.2) * 0.012;
    }

    // Breathing
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 0.75) * 0.004;
      groupRef.current.rotation.z = Math.sin(t * 0.75) * 0.002;
    }
  });

  return (
    <primitive
      object={scene}
      position={[0, -1.5, 0]}
      scale={1.8}
    />
  );
}

function LoadingMesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (meshRef.current) meshRef.current.rotation.y = clock.elapsedTime * 0.5;
  });
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      <meshStandardMaterial color="#ffffff" wireframe />
    </mesh>
  );
}

export default function Avatar3D({ amplitude = 0 }: { amplitude?: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 2.8], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 4, 2]} intensity={1.2} />
      <pointLight position={[-2, 2, -2]} intensity={0.4} color="#ffffff" />

      <Suspense fallback={<LoadingMesh />}>
        <Float speed={1.2} rotationIntensity={0.04} floatIntensity={0.08}>
          <AvatarMesh amplitude={amplitude} />
        </Float>
        <Environment preset="studio" />
      </Suspense>

      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
        target={[0, 0.3, 0]}
      />
    </Canvas>
  );
}
