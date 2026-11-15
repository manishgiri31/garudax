import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Stars } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CONTROLS } from '@/lib/cockpitCurriculum';
import type { ControlId, CockpitView } from '@/lib/cockpitCurriculum';
import { SPACE_IMAGES } from '@/ui/spaceImages';

export interface Cockpit3DProps {
  view: CockpitView;
  recenterToken: number;
  alarm: boolean;
  shake: boolean;
  target: ControlId | null;
  done: Set<ControlId>;
  onPress: (id: ControlId) => void;
}

function Window({ view, shake }: { view: CockpitView; shake: boolean }) {
  const tex = useLoader(THREE.TextureLoader, SPACE_IMAGES[view]);
  tex.colorSpace = THREE.SRGBColorSpace;
  const ref = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    // The scenery drifts past the windows, slowly while cruising and faster under power.
    // Sine-based motion (no UV scrolling) so the photo never shows a seam.
    const t = s.clock.elapsedTime;
    const f = shake ? 0.6 : 0.14;
    if (ref.current) {
      ref.current.position.x = Math.sin(t * f) * 0.7;
      ref.current.position.y = 1.6 + Math.sin(t * f * 0.6) * 0.12;
      ref.current.scale.setScalar(1 + Math.sin(t * f * 0.4) * 0.025);
    }
  });
  return (
    <mesh ref={ref} position={[0, 1.6, -6]}>
      <planeGeometry args={[12, 9]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

function Frame() {
  const m = <meshStandardMaterial color="#2a2f38" metalness={0.6} roughness={0.5} />;
  return (
    <group position={[0, 1.5, -2.2]}>
      {([[0, 1.35, 4.4, 0.25], [0, -1.15, 4.4, 0.25]] as const).map(([x, y, w, h], i) => (
        <mesh key={i} position={[x, y, 0]}><boxGeometry args={[w, h, 0.3]} />{m}</mesh>
      ))}
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.1, 0]}><boxGeometry args={[0.12, 2.4, 0.3]} />{m}</mesh>
      ))}
      {[-2.15, 2.15].map((x) => (
        <mesh key={x} position={[x, 0.1, 0]}><boxGeometry args={[0.25, 2.7, 0.3]} />{m}</mesh>
      ))}
      <mesh position={[0, 2.2, 1.5]} rotation={[Math.PI / 2.3, 0, 0]}>
        <boxGeometry args={[6, 3.5, 0.1]} />
        <meshStandardMaterial color="#d8d6cf" roughness={0.8} />
      </mesh>
      {[-2.9, 2.9].map((x) => (
        <mesh key={x} position={[x, 0, 1.5]} rotation={[0, x > 0 ? -0.5 : 0.5, 0]}>
          <boxGeometry args={[0.1, 4, 4]} />
          <meshStandardMaterial color="#cfccc3" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function Switch({
  id, label, pos, active, done, onPress,
}: {
  id: ControlId; label: string; pos: [number, number, number]; active: boolean; done: boolean; onPress: (id: ControlId) => void;
}) {
  const ref = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((s) => {
    if (ref.current) {
      ref.current.emissiveIntensity = active
        ? 1.2 + Math.sin(s.clock.elapsedTime * 6) * 0.8
        : done ? 0.8 : 0.15;
    }
  });

  // Clear the pointer cursor if the switch unmounts while hovered.
  useEffect(() => () => { document.body.style.cursor = ''; }, []);

  const color = id === 'abort' ? '#ff3030' : done ? '#3dff7a' : active ? '#ffb020' : '#5a8cff';
  return (
    <group position={pos}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onPress(id); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = ''; }}
      >
        <boxGeometry args={[0.32, 0.08, 0.22]} />
        <meshStandardMaterial ref={ref} color={color} emissive={color} emissiveIntensity={0.2} metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.07, done ? -0.03 : 0.03]} rotation={[done ? -0.5 : 0.5, 0, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.12]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.9} roughness={0.2} />
      </mesh>
      {active && (
        <Html position={[0, 0.22, 0]} center distanceFactor={4} style={{ pointerEvents: 'none' }}>
          <div className="animate-bounce whitespace-nowrap font-mono text-[11px] font-bold text-amber-300 drop-shadow-[0_0_6px_rgba(0,0,0,0.9)]">
            ▼ PRESS
          </div>
        </Html>
      )}
      <Html position={[0, 0.02, 0.17]} center distanceFactor={4} style={{ pointerEvents: 'none' }}>
        <div className={`whitespace-nowrap font-mono text-[9px] tracking-wider ${active ? 'text-amber-300' : 'text-slate-200/80'}`}>
          {label}
        </div>
      </Html>
    </group>
  );
}

function Console(p: Cockpit3DProps & { alarm: boolean }) {
  const groups = { left: -1.25, center: 0, right: 1.25 } as const;
  const count = { left: 0, center: 0, right: 0 };
  return (
    <group position={[0, 0.35, -1.1]} rotation={[0.6, 0, 0]}>
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[4.2, 0.1, 1.4]} />
        <meshStandardMaterial color="#1b1f26" metalness={0.5} roughness={0.6} />
      </mesh>
      {[-1.25, 0, 1.25].map((x, i) => (
        <mesh key={x} position={[x, 0.01, -0.45]}>
          <boxGeometry args={[0.95, 0.02, 0.38]} />
          <meshStandardMaterial
            color={p.alarm && i === 1 ? '#ff2020' : '#0c3a5a'}
            emissive={p.alarm && i === 1 ? '#ff2020' : '#1a7ab0'}
            emissiveIntensity={0.7}
          />
        </mesh>
      ))}
      {CONTROLS.map((c) => {
        const k = count[c.group]++;
        const x = groups[c.group] + (k % 2 ? 0.22 : -0.22);
        const z = 0.05 + Math.floor(k / 2) * 0.33;
        return (
          <Switch
            key={c.id}
            id={c.id}
            label={c.label}
            pos={[x, 0.04, z]}
            active={p.target === c.id}
            done={p.done.has(c.id)}
            onPress={p.onPress}
          />
        );
      })}
    </group>
  );
}

function Rig({ alarm, shake }: { alarm: boolean; shake: boolean }) {
  const light = useRef<THREE.PointLight>(null);
  // Jitter is applied as an offset that is removed again next frame, so the
  // camera keeps whatever pose OrbitControls gave it.
  const jitter = useRef(new THREE.Vector3());
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (light.current) light.current.intensity = alarm ? 6 + Math.sin(t * 8) * 6 : 0;
    const cam = s.camera;
    cam.position.sub(jitter.current);
    if (shake) {
      jitter.current.set((Math.random() - 0.5) * 0.012, (Math.random() - 0.5) * 0.012, 0);
    } else {
      jitter.current.set(0, 0, 0);
    }
    cam.position.add(jitter.current);
  });
  return <pointLight ref={light} position={[0, 2.6, 0]} color="#ff1a1a" distance={8} />;
}

// Returns the camera to the default commander's-seat view (button or R key).
function Recenter({ token }: { token: number }) {
  const { camera, controls, size } = useThree();
  useEffect(() => {
    if (token === 0) return;
    const portrait = size.width < size.height;
    camera.position.set(0, portrait ? 1.9 : 1.25, portrait ? 2.6 : 1.4);
    const orbit = controls as unknown as { target?: THREE.Vector3; update?: () => void } | null;
    orbit?.target?.set(0, 0.6, -1.3);
    orbit?.update?.();
  }, [token, camera, controls, size.width, size.height]);
  return null;
}

function Fit() {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const portrait = size.width < size.height;
    cam.fov = portrait ? 100 : 70;
    cam.position.set(0, portrait ? 1.9 : 1.25, portrait ? 2.6 : 1.4);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

export default function Cockpit3D(p: Cockpit3DProps) {
  return (
    <div className="absolute inset-0" data-scene-ready>
      <Canvas camera={{ position: [0, 1.25, 1.4], fov: 70 }} dpr={[1, 2]}>
        <color attach="background" args={['#020308']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[2, 4, -3]} intensity={1.6} color="#fff4e0" />
        <pointLight position={[0, 1, 0]} intensity={2} color="#7ab8ff" distance={4} />
        <Stars radius={60} depth={20} count={1500} factor={3} fade />
        <Suspense fallback={null}>
          <Window view={p.view} shake={p.shake} />
        </Suspense>
        <Frame />
        <Console {...p} />
        <mesh position={[0, -0.75, -0.6]}>
          <boxGeometry args={[6, 1.8, 1.2]} />
          <meshStandardMaterial color="#14171d" metalness={0.4} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.3, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[8, 4]} />
          <meshStandardMaterial color="#20242c" roughness={0.9} />
        </mesh>
        <Fit />
        <Recenter token={p.recenterToken} />
        <Rig alarm={p.alarm} shake={p.shake} />
        <OrbitControls
          makeDefault
          target={[0, 0.6, -1.3]}
          enableDamping
          dampingFactor={0.08}
          enablePan={false}
          enableZoom
          minDistance={1.1}
          maxDistance={2.8}
          minAzimuthAngle={-1.25}
          maxAzimuthAngle={1.25}
          minPolarAngle={0.7}
          maxPolarAngle={2.2}
          rotateSpeed={0.6}
          zoomSpeed={0.8}
        />
      </Canvas>
    </div>
  );
}
