import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { useMissionStore } from '../../../store/useMissionStore';

export function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);

  const [dayMap, normalMap, specularMap, cloudsMap] = useLoader(TextureLoader, [
    '/textures/earth_day.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_specular.jpg',
    '/textures/earth_clouds.png',
  ]);

  useFrame((_state, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.02;
    }
    if (earthRef.current) {
      const simTime = useMissionStore.getState().simulationTime;
      // Approximate GMST-driven rotation
      earthRef.current.rotation.y = (simTime / 1000 / 86400) * Math.PI * 2;
    }
  });

  return (
    <group>
      {/* Earth core sphere */}
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[10, 64, 64]} />
        <meshStandardMaterial
          map={dayMap}
          normalMap={normalMap}
          roughnessMap={specularMap}
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef} renderOrder={1}>
        <sphereGeometry args={[10.1, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
