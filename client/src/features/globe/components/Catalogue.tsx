import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import * as Comlink from 'comlink';
import { useMissionStore } from '../../../store/useMissionStore';
import axios from 'axios';

// Initialize worker
const worker = new Worker(new URL('../../../workers/propagator.worker.ts', import.meta.url), {
  type: 'module'
});
const propagator = Comlink.wrap<any>(worker);

export function Catalogue() {
  const pointsRef = useRef<THREE.Points>(null);
  const [positions, setPositions] = useState<Float32Array | null>(null);

  useEffect(() => {
    axios.get('http://localhost:3000/api/satellites').then(async (res) => {
      const count = await propagator.loadCatalogue(res.data);
      console.log(`Loaded ${count} satellites in worker.`);
      const pos = await propagator.propagateAll(Date.now());
      setPositions(new Float32Array(pos));
    }).catch(err => {
      console.warn('Could not load catalogue from server:', err.message);
      // Use empty array so globe still renders
      setPositions(new Float32Array(0));
    });
  }, []);

  useFrame(async () => {
    if (!pointsRef.current?.geometry) return;
    const pos = await propagator.propagateAll(useMissionStore.getState().simulationTime);
    const arr = new Float32Array(pos);
    pointsRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!positions) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={0x5CE1FF}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
