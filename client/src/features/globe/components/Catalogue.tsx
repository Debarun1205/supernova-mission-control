import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as comlink from 'comlink';
import { useMissionStore } from '../../../store/useMissionStore';
import axios from 'axios';

// Initialize worker
const worker = new Worker(new URL('../../../workers/propagator.worker.ts', import.meta.url), {
  type: 'module'
});
const propagator = comlink.wrap<any>(worker);

export function Catalogue() {
  const pointsRef = useRef<THREE.Points>(null);
  const [positions, setPositions] = useState<Float32Array | null>(null);
  const simulationTime = useMissionStore(state => state.simulationTime);

  useEffect(() => {
    // Load catalogue
    axios.get('http://localhost:3000/api/satellites').then(async (res) => {
      const count = await propagator.loadCatalogue(res.data);
      console.log(Loaded  satellites in worker.);
      // Initial propagate
      const pos = await propagator.propagateAll(simulationTime);
      setPositions(pos);
    });
  }, []);

  useFrame(async () => {
    if (pointsRef.current && pointsRef.current.geometry) {
      // Fetch new positions from worker
      // (In a real high-perf app, this should be double-buffered or requestAnimationFrame synced)
      const pos = await propagator.propagateAll(useMissionStore.getState().simulationTime);
      pointsRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (!positions) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={0x5CE1FF}
        transparent={true}
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
