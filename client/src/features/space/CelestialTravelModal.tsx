import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useMissionStore } from '../../store/useMissionStore';

// ── Warp particle field ───────────────────────────────────────────────────────
const PARTICLE_COUNT = 3000;

interface WarpFieldProps {
  progress: number; // 0 → 1
  targetColor: string;
}

function WarpField({ progress, targetColor }: WarpFieldProps) {
  const geoRef = useRef<THREE.BufferGeometry>(null!);
  const pointsRef = useRef<THREE.Points>(null!);

  const initialPositions = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 200;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 200;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 400 - 100; // mostly in front
    }
    return arr;
  }, []);

  const posRef = useRef<Float32Array>(initialPositions.slice());

  // Reset positions on mount
  useEffect(() => {
    posRef.current.set(initialPositions);
  }, [initialPositions]);

  useFrame((_, delta) => {
    if (!geoRef.current) return;
    const pos = posRef.current;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const z = pos[i * 3 + 2];
      // Rush particles toward camera
      const speed = (1 + progress * 6) * delta * 60;
      pos[i * 3 + 2] += speed * 0.5;
      // Tunnel shrink X/Y toward center
      pos[i * 3]     *= (1 - progress * 0.012);
      pos[i * 3 + 1] *= (1 - progress * 0.012);
      // Reset if past camera
      if (pos[i * 3 + 2] > 50) {
        pos[i * 3]     = (Math.random() - 0.5) * (200 - progress * 160);
        pos[i * 3 + 1] = (Math.random() - 0.5) * (200 - progress * 160);
        pos[i * 3 + 2] = -400 - Math.random() * 100;
      }
    }
    geoRef.current.attributes.position.needsUpdate = true;
    // Scale points with progress for streak effect
    if (pointsRef.current) {
      (pointsRef.current.material as THREE.PointsMaterial).size = 0.3 + progress * 2.5;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute
          attach="attributes-position"
          args={[posRef.current, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.3}
        sizeAttenuation
        transparent
        opacity={0.7 + progress * 0.3}
        fog={false}
      />
    </points>
  );
}

interface ArrivalSphereProps {
  color: string;
  progress: number; // arrival 0→1
}

function ArrivalSphere({ color, progress }: ArrivalSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  const scale = 0.2 + progress * 3;

  return (
    <mesh ref={meshRef} position={[0, 0, -30]} scale={[scale, scale, scale]}>
      <sphereGeometry args={[3, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.6 + progress * 0.4}
        roughness={0.7}
        transparent
        opacity={Math.min(1, progress * 2)}
      />
    </mesh>
  );
}

// ── Web Audio warp whine ──────────────────────────────────────────────────────
function useWarpAudio(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!active) {
      oscRef.current?.stop();
      ctxRef.current?.close();
      ctxRef.current = null;
      oscRef.current = null;
      gainRef.current = null;
      return;
    }
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 8);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 6);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 10);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 10.5);
      ctxRef.current = ctx;
      oscRef.current = osc;
      gainRef.current = gain;
    } catch {
      // Audio not supported / blocked — silently ignore
    }
    return () => {
      oscRef.current?.stop();
      ctxRef.current?.close().catch(() => {});
    };
  }, [active]);
}

// ── Distance counter ──────────────────────────────────────────────────────────
function DistanceCounter({ progress }: { progress: number }) {
  const MAX_DIST = 24_300_000_000;
  const current = Math.round(MAX_DIST * (1 - progress));
  return (
    <div style={{
      fontFamily: 'monospace', fontSize: '13px', color: '#00e5ff',
      textAlign: 'center', letterSpacing: '1px',
    }}>
      <span style={{ color: '#ffffff55', fontSize: '10px', display: 'block', marginBottom: '2px' }}>DISTANCE TO TARGET</span>
      {current.toLocaleString()} km
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function CelestialTravelModal() {
  const { activeCelestialTarget, setActiveCelestialTarget } = useMissionStore();
  const [warpProgress, setWarpProgress] = useState(0);
  const [phase, setPhase] = useState<'warp' | 'arrival'>('warp');
  const [arrivalProgress, setArrivalProgress] = useState(0);
  const startTimeRef = useRef<number>(0);

  useWarpAudio(!!activeCelestialTarget && phase === 'warp');

  useEffect(() => {
    if (!activeCelestialTarget) {
      setWarpProgress(0);
      setPhase('warp');
      setArrivalProgress(0);
      return;
    }

    setWarpProgress(0);
    setPhase('warp');
    setArrivalProgress(0);
    startTimeRef.current = Date.now();

    // Warp: 10 seconds
    const warpDuration = 10_000;
    const arrivalDuration = 3_000;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed < warpDuration) {
        setWarpProgress(Math.min(elapsed / warpDuration, 1));
        rafId = requestAnimationFrame(tick);
      } else if (elapsed < warpDuration + arrivalDuration) {
        setWarpProgress(1);
        setPhase('arrival');
        const arrElapsed = elapsed - warpDuration;
        setArrivalProgress(Math.min(arrElapsed / arrivalDuration, 1));
        rafId = requestAnimationFrame(tick);
      } else {
        setPhase('arrival');
        setArrivalProgress(1);
      }
    };

    let rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [activeCelestialTarget]);

  if (!activeCelestialTarget) return null;

  // Pick planet color based on type or use a fallback
  const targetColor = '#4fa3e0';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#000005',
      fontFamily: 'monospace',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* R3F warp scene */}
      <Canvas
        camera={{ position: [0, 0, 30], fov: 70 }}
        style={{ position: 'absolute', inset: 0 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.1} />
        <pointLight position={[0, 0, 10]} intensity={1} color="#ffffff" />

        {/* Warp streaks */}
        <WarpField progress={warpProgress} targetColor={targetColor} />

        {/* Destination sphere */}
        {phase === 'arrival' && (
          <ArrivalSphere color={targetColor} progress={arrivalProgress} />
        )}
      </Canvas>

      {/* Overlay UI */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 10,
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', alignItems: 'center',
        padding: '40px 32px',
        pointerEvents: 'none',
      }}>
        {/* Top: destination name */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '11px', color: '#00e5ff', textTransform: 'uppercase',
            letterSpacing: '3px', marginBottom: '8px',
          }}>
            {phase === 'warp' ? '⚡ WARP DRIVE ENGAGED' : '✅ ARRIVAL COMPLETE'}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff' }}>
            {activeCelestialTarget.name}
          </div>
          <div style={{ fontSize: '12px', color: '#ffffff55', marginTop: '4px' }}>
            {activeCelestialTarget.constellation && `Constellation: ${activeCelestialTarget.constellation} · `}
            {activeCelestialTarget.distanceLy}
          </div>
        </div>

        {/* Center: distance counter */}
        <div style={{ textAlign: 'center' }}>
          {phase === 'warp' && <DistanceCounter progress={warpProgress} />}

          {/* Warp progress bar */}
          {phase === 'warp' && (
            <div style={{ marginTop: '16px', width: '320px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '4px',
                background: 'linear-gradient(90deg, #00e5ff, #0050ff)',
                width: `${warpProgress * 100}%`,
                transition: 'width 0.1s',
                boxShadow: '0 0 12px #00e5ff',
              }} />
            </div>
          )}
        </div>

        {/* Bottom: info + button */}
        <div style={{ textAlign: 'center', maxWidth: '520px', pointerEvents: 'auto' }}>
          {phase === 'arrival' && (
            <>
              <div style={{
                background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '14px', padding: '16px 24px', marginBottom: '16px',
                color: '#ffffffcc', fontSize: '13px', lineHeight: '1.6',
              }}>
                {activeCelestialTarget.description}
              </div>
              <button
                onClick={() => setActiveCelestialTarget(null)}
                style={{
                  padding: '12px 32px', background: 'rgba(0,229,255,0.15)',
                  border: '1px solid rgba(0,229,255,0.5)', borderRadius: '10px',
                  color: '#00e5ff', fontFamily: 'monospace', fontWeight: 'bold',
                  fontSize: '13px', cursor: 'pointer',
                }}
              >
                ← Return to Solar System
              </button>
            </>
          )}

          {phase === 'warp' && (
            <button
              onClick={() => setActiveCelestialTarget(null)}
              style={{
                padding: '8px 20px', background: 'rgba(255,50,50,0.1)',
                border: '1px solid rgba(255,100,100,0.3)', borderRadius: '8px',
                color: '#ff6666', fontFamily: 'monospace', fontSize: '11px',
                cursor: 'pointer', pointerEvents: 'auto',
              }}
            >
              ✕ Abort Warp
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
