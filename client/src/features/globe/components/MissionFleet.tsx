import React, { useEffect, useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import { useMissionStore } from '../../../store/useMissionStore';
import * as satellite from 'satellite.js';

export function MissionFleet() {
  const [fleet, setFleet] = useState<any[]>([]);
  const simulationTime = useMissionStore(state => state.simulationTime);
  const setSelectedSatellite = useMissionStore(state => state.setSelectedSatellite);
  const selectedSatelliteId = useMissionStore(state => state.selectedSatelliteId);

  useEffect(() => {
    axios.get('http://localhost:3000/api/satellites?tier=fleet').then(res => {
      setFleet(res.data.map((s: any) => ({
        ...s,
        satrec: satellite.twoline2satrec(s.tle1, s.tle2)
      })));
    });
  }, []);

  return (
    <group>
      {fleet.map(sat => (
        <FleetMarker 
          key={sat.noradId} 
          sat={sat} 
          simulationTime={simulationTime} 
          isSelected={selectedSatelliteId === sat.noradId}
          onClick={() => setSelectedSatellite(sat.noradId)}
        />
      ))}
    </group>
  );
}

function FleetMarker({ sat, simulationTime, isSelected, onClick }: { sat: any, simulationTime: number, isSelected: boolean, onClick: () => void }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (!meshRef.current) return;
    const date = new Date(simulationTime);
    const pv = satellite.propagate(sat.satrec, date);
    if (pv.position && typeof pv.position !== 'boolean') {
      const scale = 10 / 6371; // Earth radius scene / km
      meshRef.current.position.set(
        pv.position.x * scale,
        pv.position.z * scale,
        -pv.position.y * scale
      );
    }
  });

  const color = sat.health === 'critical' ? '#FF4D6D' : sat.health === 'warning' ? '#FFB347' : '#48E5A8';

  return (
    <group ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.12, 0.15, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Label */}
      <Html distanceFactor={15} zIndexRange={[100, 0]} transform={false} center>
        <div className={`px-2 py-1 rounded-md text-xs font-mono whitespace-nowrap cursor-pointer transition-colors backdrop-blur-sm ${isSelected ? 'bg-ion/20 text-ion border border-ion/50' : 'bg-hull/60 text-starlight hover:bg-hull-raised/80'}`}>
          {sat.name}
        </div>
      </Html>
    </group>
  );
}
