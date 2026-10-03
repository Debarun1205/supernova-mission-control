import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigate } from 'react-router-dom';

// ── Planet data ────────────────────────────────────────────────────────────────
const SOLAR_PLANETS = [
  { id: 'mercury', name: 'Mercury', radius: 0.25, orbitR: 7,  period: 0.24,  color: '#9e9e9e', type: 'Rocky',     moons: 0,   distAU: '0.39 AU', tilt: 0.034, fact: 'Smallest planet, extreme temps: -180°C to 430°C' },
  { id: 'venus',   name: 'Venus',   radius: 0.6,  orbitR: 11, period: 0.615, color: '#e8c56e', type: 'Rocky',     moons: 0,   distAU: '0.72 AU', tilt: 177.4, fact: 'Hottest planet (462°C avg) due to runaway greenhouse effect' },
  { id: 'earth',   name: 'Earth',   radius: 0.65, orbitR: 16, period: 1,     color: '#4fa3e0', type: 'Rocky',     moons: 1,   distAU: '1.00 AU', tilt: 23.5,  fact: 'Only known planet with life, liquid water oceans, and a breathable atmosphere' },
  { id: 'mars',    name: 'Mars',    radius: 0.4,  orbitR: 22, period: 1.88,  color: '#c1440e', type: 'Rocky',     moons: 2,   distAU: '1.52 AU', tilt: 25.2,  fact: 'Has the tallest volcano in the solar system: Olympus Mons (22km high)' },
  { id: 'jupiter', name: 'Jupiter', radius: 1.8,  orbitR: 35, period: 11.86, color: '#c88b3a', type: 'Gas Giant', moons: 95,  distAU: '5.20 AU', tilt: 3.1,   fact: 'Largest planet — 1300 Earths could fit inside it. Great Red Spot is a 350-year-old storm.' },
  { id: 'saturn',  name: 'Saturn',  radius: 1.5,  orbitR: 48, period: 29.46, color: '#e4d191', type: 'Gas Giant', moons: 146, distAU: '9.58 AU', tilt: 26.7,  fact: "Least dense planet — it would float on water. Rings are 90% ice.", hasRings: true },
  { id: 'uranus',  name: 'Uranus',  radius: 1.0,  orbitR: 60, period: 84,    color: '#7de8e8', type: 'Ice Giant', moons: 27,  distAU: '19.2 AU', tilt: 97.8,  fact: 'Rotates on its side — its axis is nearly horizontal.' },
  { id: 'neptune', name: 'Neptune', radius: 0.9,  orbitR: 72, period: 165,   color: '#3f54ba', type: 'Ice Giant', moons: 16,  distAU: '30.1 AU', tilt: 28.3,  fact: 'Strongest winds in solar system: 2100 km/h supersonic gusts.' },
];

const VOYAGERS = [
  { id: 'v1', name: 'Voyager 1', orbitR: 160, angle: 0.8, color: '#ffd700', status: 'Interstellar Space — 162 AU from Sun', launched: 1977 },
  { id: 'v2', name: 'Voyager 2', orbitR: 140, angle: 2.1, color: '#ff9f43', status: 'Interstellar Space — 136 AU from Sun', launched: 1977 },
];

const PLANET_EMOJI: Record<string, string> = {
  mercury: '⚫', venus: '🟡', earth: '🌍', mars: '🔴',
  jupiter: '🟠', saturn: '🪐', uranus: '🔵', neptune: '💙',
};

const BASE_SPEED = 0.1; // rad/s for Earth (period=1)

type PlanetData = typeof SOLAR_PLANETS[number] & { hasRings?: boolean };

interface PlanetMeshProps {
  planet: PlanetData;
  angleRef: React.MutableRefObject<number>;
  timeScaleRef: React.MutableRefObject<number>;
  pausedRef: React.MutableRefObject<boolean>;
  selected: boolean;
  onClick: (planet: PlanetData, pos: THREE.Vector3) => void;
}

function PlanetMesh({ planet, angleRef, timeScaleRef, pausedRef, selected, onClick }: PlanetMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ringsRef = useRef<THREE.Mesh>(null!);
  const posRef = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!pausedRef.current) {
      angleRef.current += (BASE_SPEED / planet.period) * delta * timeScaleRef.current;
    }
    const x = planet.orbitR * Math.cos(angleRef.current);
    const z = planet.orbitR * Math.sin(angleRef.current);
    posRef.current.set(x, 0, z);
    if (meshRef.current) {
      meshRef.current.position.set(x, 0, z);
      meshRef.current.rotation.y += delta * 0.5;
    }
    if (ringsRef.current) {
      ringsRef.current.position.set(x, 0, z);
    }
  });

  return (
    <>
      {/* Orbit ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[planet.orbitR, 0.04, 2, 128]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.08} />
      </mesh>

      {/* Planet sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onClick(planet, posRef.current.clone());
        }}
      >
        <sphereGeometry args={[planet.radius, 32, 32]} />
        <meshStandardMaterial
          color={planet.color}
          emissive={planet.color}
          emissiveIntensity={selected ? 0.6 : 0.15}
          roughness={0.7}
          metalness={0.1}
        />
        {/* Label */}
        <Html distanceFactor={18} center style={{ pointerEvents: 'none' }}>
          <div style={{
            color: selected ? '#00e5ff' : '#ffffff99',
            fontSize: '10px',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            transform: 'translateY(-20px)',
            textShadow: '0 0 6px #000',
          }}>
            {PLANET_EMOJI[planet.id]} {planet.name}
          </div>
        </Html>
      </mesh>

      {/* Saturn rings */}
      {planet.hasRings && (
        <mesh ref={ringsRef} rotation={[Math.PI / 2.2, 0, 0]}>
          <torusGeometry args={[planet.radius * 2.0, planet.radius * 0.7, 2, 64]} />
          <meshStandardMaterial color="#d4c060" transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
}

interface VoyagerDotProps {
  v: typeof VOYAGERS[number];
}
function VoyagerDot({ v }: VoyagerDotProps) {
  const x = v.orbitR * Math.cos(v.angle);
  const z = v.orbitR * Math.sin(v.angle);
  return (
    <mesh position={[x, 0, z]}>
      <sphereGeometry args={[0.6, 8, 8]} />
      <meshStandardMaterial color={v.color} emissive={v.color} emissiveIntensity={1} />
      <Html distanceFactor={60} center style={{ pointerEvents: 'none' }}>
        <div style={{
          color: v.color,
          fontSize: '9px',
          fontFamily: 'monospace',
          whiteSpace: 'nowrap',
          textShadow: '0 0 6px #000',
        }}>
          🛸 {v.name}<br />
          <span style={{ color: '#ffffff66', fontSize: '8px' }}>↗ Beyond Solar System</span>
        </div>
      </Html>
    </mesh>
  );
}

interface CameraLerpProps {
  target: THREE.Vector3 | null;
}
function CameraLerp({ target }: CameraLerpProps) {
  const { camera } = useThree();
  const tmpTarget = useRef(new THREE.Vector3());

  useFrame(() => {
    if (target) {
      tmpTarget.current.copy(target);
      camera.position.lerp(tmpTarget.current, 0.03);
    }
  });
  return null;
}

interface SceneProps {
  timeScaleRef: React.MutableRefObject<number>;
  pausedRef: React.MutableRefObject<boolean>;
  onPlanetClick: (planet: PlanetData, cameraTarget: THREE.Vector3) => void;
  selectedId: string | null;
}

function Scene({ timeScaleRef, pausedRef, onPlanetClick, selectedId }: SceneProps) {
  const angleRefs = useRef<number[]>(SOLAR_PLANETS.map(() => Math.random() * Math.PI * 2));
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null);

  const handlePlanetClick = (planet: PlanetData, pos: THREE.Vector3) => {
    const camTarget = pos.clone().add(
      new THREE.Vector3(0, planet.radius * 3, planet.radius * 5)
    );
    setCameraTarget(camTarget);
    onPlanetClick(planet, camTarget);
  };

  const handleBgClick = () => {
    setCameraTarget(null);
    onPlanetClick(null as any, new THREE.Vector3());
  };

  return (
    <>
      <Stars radius={300} depth={60} count={10000} factor={4} saturation={0} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[0, 10, 0]} intensity={0.5} />

      {/* Sun */}
      <mesh onClick={handleBgClick}>
        <sphereGeometry args={[3, 32, 32]} />
        <meshStandardMaterial
          color="#ffcc33"
          emissive="#ff8800"
          emissiveIntensity={1.2}
          roughness={0.4}
        />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={3} distance={250} color="#fff5cc" />

      {/* Invisible background plane for deselect */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} onClick={handleBgClick}>
        <planeGeometry args={[600, 600]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Planets */}
      {SOLAR_PLANETS.map((planet, i) => (
        <PlanetMesh
          key={planet.id}
          planet={planet}
          angleRef={{ current: angleRefs.current[i] } as React.MutableRefObject<number>}
          timeScaleRef={timeScaleRef}
          pausedRef={pausedRef}
          selected={selectedId === planet.id}
          onClick={handlePlanetClick}
        />
      ))}

      {/* Voyager probes */}
      {VOYAGERS.map((v) => <VoyagerDot key={v.id} v={v} />)}

      {/* Camera lerp */}
      <CameraLerp target={cameraTarget} />

      <OrbitControls
        minDistance={3}
        maxDistance={250}
        makeDefault
      />
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function SolarSystemPage() {
  const navigate = useNavigate();
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetData | null>(null);
  const [surfaceMsg, setSurfaceMsg] = useState('');
  const timeScaleRef = useRef(10);
  const pausedRef = useRef(false);
  const [timeScale, setTimeScale] = useState(10);
  const [paused, setPaused] = useState(false);

  const handlePlanetClick = (planet: PlanetData | null) => {
    setSelectedPlanet(planet);
    setSurfaceMsg('');
  };

  const handleEnterView = () => {
    if (!selectedPlanet) return;
    if (selectedPlanet.id === 'earth') {
      navigate('/');
    } else {
      setSurfaceMsg('🚧 Simulated surface coming soon for ' + selectedPlanet.name);
    }
  };

  const setScale = (scale: number) => {
    setTimeScale(scale);
    timeScaleRef.current = scale;
    setPaused(false);
    pausedRef.current = false;
  };

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    pausedRef.current = next;
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#020408', position: 'relative', overflow: 'hidden', fontFamily: 'monospace' }}>
      {/* R3F Canvas */}
      <Canvas
        camera={{ position: [0, 60, 80], fov: 55 }}
        style={{ width: '100%', height: '100%' }}
        gl={{ antialias: true }}
      >
        <Scene
          timeScaleRef={timeScaleRef}
          pausedRef={pausedRef}
          onPlanetClick={handlePlanetClick}
          selectedId={selectedPlanet?.id ?? null}
        />
      </Canvas>

      {/* ── Header ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 20px',
        background: 'linear-gradient(to bottom, rgba(2,4,8,0.9), transparent)',
        pointerEvents: 'none',
      }}>
        <div>
          <div style={{ color: '#00e5ff', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase' }}>
            🪐 Solar System Explorer
          </div>
          <div style={{ color: '#ffffff44', fontSize: '10px' }}>Click planets to inspect · Drag to orbit · Scroll to zoom</div>
        </div>
        <button
          onClick={() => navigate('/')}
          style={{
            pointerEvents: 'auto', background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.3)',
            color: '#00e5ff', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px',
          }}
        >
          ← Back to Earth
        </button>
      </div>

      {/* ── Planet info panel ── */}
      {selectedPlanet && (
        <div style={{
          position: 'absolute', top: '60px', right: '20px', zIndex: 50,
          width: '280px',
          background: 'rgba(2,4,8,0.92)',
          border: '1px solid rgba(0,229,255,0.3)',
          borderRadius: '16px',
          padding: '20px',
          color: '#ffffff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>{PLANET_EMOJI[selectedPlanet.id]}</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#00e5ff' }}>{selectedPlanet.name}</div>
              <div style={{ fontSize: '10px', color: '#ffffff66', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedPlanet.type}</div>
            </div>
            <button
              onClick={() => setSelectedPlanet(null)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ffffff44', cursor: 'pointer', fontSize: '16px' }}
            >×</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {[
              ['Distance', selectedPlanet.distAU],
              ['Moons', String(selectedPlanet.moons)],
              ['Axial Tilt', `${selectedPlanet.tilt}°`],
              ['Orbital Period', selectedPlanet.period < 1 ? `${Math.round(selectedPlanet.period * 365)}d` : `${selectedPlanet.period}y`],
            ].map(([k, v]) => (
              <div key={k} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '8px' }}>
                <div style={{ fontSize: '9px', color: '#00e5ff88', textTransform: 'uppercase', letterSpacing: '1px' }}>{k}</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#ffffffcc' }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '10px',
            fontSize: '11px', color: '#ffffffaa', lineHeight: '1.5', marginBottom: '14px',
          }}>
            💡 {selectedPlanet.fact}
          </div>

          {surfaceMsg && (
            <div style={{ fontSize: '11px', color: '#ffd700', marginBottom: '10px', textAlign: 'center' }}>
              {surfaceMsg}
            </div>
          )}

          <button
            onClick={handleEnterView}
            style={{
              width: '100%', padding: '10px', background: 'linear-gradient(135deg, rgba(0,229,255,0.2), rgba(0,100,200,0.2))',
              border: '1px solid rgba(0,229,255,0.5)', borderRadius: '10px',
              color: '#00e5ff', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer',
            }}
          >
            🌍 Enter Planet View
          </button>
        </div>
      )}

      {/* ── Time controls HUD ── */}
      <div style={{
        position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 40, display: 'flex', gap: '8px', alignItems: 'center',
        background: 'rgba(2,4,8,0.85)', border: '1px solid rgba(255,255,255,0.1)',
        padding: '8px 16px', borderRadius: '12px',
      }}>
        <span style={{ color: '#ffffff44', fontSize: '10px', marginRight: '4px' }}>TIME</span>
        {[
          { label: paused ? '▶ PAUSED' : '⏸ PAUSE', action: togglePause, active: paused },
          { label: '▶ 1x',   action: () => setScale(1),   active: !paused && timeScale === 1 },
          { label: '▶ 10x',  action: () => setScale(10),  active: !paused && timeScale === 10 },
          { label: '▶ 100x', action: () => setScale(100), active: !paused && timeScale === 100 },
        ].map(({ label, action, active }) => (
          <button
            key={label}
            onClick={action}
            style={{
              padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px',
              fontFamily: 'monospace', border: active ? '1px solid #00e5ff' : '1px solid rgba(255,255,255,0.15)',
              background: active ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.05)',
              color: active ? '#00e5ff' : '#ffffff88',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Legend ── */}
      <div style={{
        position: 'absolute', bottom: '24px', left: '20px', zIndex: 40,
        background: 'rgba(2,4,8,0.8)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px', padding: '10px 14px', fontSize: '10px', color: '#ffffff55',
      }}>
        {VOYAGERS.map(v => (
          <div key={v.id} style={{ color: v.color, marginBottom: '2px' }}>
            🛸 {v.name} · {v.status}
          </div>
        ))}
      </div>
    </div>
  );
}
