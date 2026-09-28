import React, { useRef, useMemo } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { useMissionStore } from '../../../store/useMissionStore';

export function Earth() {
  const earthRef = useRef<THREE.Mesh>(null);
  
  // Load textures
  const [dayMap, nightMap, normalMap, specularMap, cloudsMap] = useLoader(TextureLoader, [
    '/textures/earth_day.jpg',
    '/textures/earth_night.jpg',
    '/textures/earth_normal.jpg',
    '/textures/earth_specular.jpg',
    '/textures/earth_clouds.png'
  ]);

  const simulationTime = useMissionStore(state => state.simulationTime);

  // Rotate clouds slowly
  const cloudsRef = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.02;
    }
    // Earth rotation based on time (approximate GMST)
    if (earthRef.current) {
      const gmst = (simulationTime / 1000 / 86400) * Math.PI * 2;
      earthRef.current.rotation.y = gmst;
    }
  });

  return (
    <group>
      {/* Earth Sphere */}
      <mesh ref={earthRef} castShadow receiveShadow>
        <sphereGeometry args={[10, 64, 64]} />
        <meshStandardMaterial
          map={dayMap}
          normalMap={normalMap}
          roughnessMap={specularMap}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      {/* Clouds Sphere */}
      <mesh ref={cloudsRef} renderOrder={1}>
        <sphereGeometry args={[10.1, 64, 64]} />
        <meshStandardMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
