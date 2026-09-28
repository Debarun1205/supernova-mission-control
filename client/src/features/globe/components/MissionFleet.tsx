import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import { useMissionStore } from '../../../store/useMissionStore';
import * as satellite from 'satellite.js';

interface FleetSat {
  noradId: number;
  name: string;
  health: string;
  tle1: string;
  tle2: string;
  satrec: satellite.SatRec;
}

// ---- individual marker ----
function FleetMarker({
  sat,
  isSelected,
  onClick,
}: {
  sat: FleetSat;
  isSelected: boolean;
  onClick: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const date = new Date(useMissionStore.getState().simulationTime);
    const pv = satellite.propagate(sat.satrec, date);
    if (pv.position && typeof pv.position !== 'boolean') {
      const scale = 10 / 6371;
      groupRef.current.position.set(
        pv.position.x * scale,
        pv.position.z * scale,
        -pv.position.y * scale,
      );
    }
  });

  const color =
    sat.health === 'critical' ? '#FF4D6D' : sat.health === 'warning' ? '#FFB347' : '#48E5A8';

  const labelCls = isSelected
    ? 'px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap cursor-pointer bg-cyan-400/20 text-cyan-300 border border-cyan-400/50'
    : 'px-2 py-0.5 rounded text-xs font-mono whitespace-nowrap cursor-pointer bg-black/60 text-white/80 hover:bg-white/10';

  return (
    <group ref={groupRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.15, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      <Html distanceFactor={15} zIndexRange={[100, 0]} transform={false} center>
        <div className={labelCls}>{sat.name}</div>
      </Html>
    </group>
  );
}

// ---- fleet group ----
export function MissionFleet() {
  const [fleet, setFleet] = React.useState<FleetSat[]>([]);
  const selectedSatelliteId = useMissionStore((s) => s.selectedSatelliteId);
  const setSelectedSatellite = useMissionStore((s) => s.setSelectedSatellite);

  useEffect(() => {
    axios
      .get('http://localhost:3000/api/satellites?tier=fleet')
      .then((res) => {
        setFleet(
          res.data
            .filter((s: any) => s.tle1 && s.tle2)
            .map((s: any) => ({
              ...s,
              satrec: satellite.twoline2satrec(s.tle1, s.tle2),
            })),
        );
      })
      .catch(() => {/* server not ready yet, graceful skip */});
  }, []);

  return (
    <group>
      {fleet.map((sat) => (
        <FleetMarker
          key={sat.noradId}
          sat={sat}
          isSelected={selectedSatelliteId === sat.noradId}
          onClick={() => setSelectedSatellite(sat.noradId)}
        />
      ))}
    </group>
  );
}
