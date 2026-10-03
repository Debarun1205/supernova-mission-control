import React, { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SPACE_CENTERS, type SpaceCenter } from '../../../../../shared/space/index';
import { useMissionStore } from '../../../store/useMissionStore';

/**
 * Convert geographic lat/lon to a Three.js Vector3 on the globe surface.
 * Convention (matching Three.js SphereGeometry default UV mapping):
 *   lon=0°  (prime meridian) → +Z axis (facing camera at z=25)
 *   lon=90°E → +X axis
 *   lat=90°N → +Y axis
 */
function latLonToVector3(lat: number, lon: number, radius = 10.05): THREE.Vector3 {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const x = radius * Math.cos(latRad) * Math.sin(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.cos(lonRad);
  return new THREE.Vector3(x, y, z);
}

export function SpaceCenters() {
  const visible = useMissionStore((s) => s.layers.spaceCenters);
  const groupRef = useRef<THREE.Group>(null);

  // Mirror the Earth's GMST-driven rotation so pins stay on correct continents
  useFrame(() => {
    if (!groupRef.current) return;
    const simTime = useMissionStore.getState().simulationTime;
    groupRef.current.rotation.y = (simTime / 1000 / 86400) * Math.PI * 2;
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {SPACE_CENTERS.map((sc: SpaceCenter) => {
        const pos = latLonToVector3(sc.lat, sc.lon);
        const isVenue = sc.id === 'uem_kolkata';
        const color = isVenue ? '#FF4D6D' : '#5CE1FF';

        return (
          <group key={sc.id} position={pos}>
            {/* 3D Pin Mesh */}
            <mesh>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshBasicMaterial color={color} />
            </mesh>

            {/* Glowing ring */}
            <mesh rotation-x={Math.PI / 2}>
              <ringGeometry args={[0.1, 0.15, 16]} />
              <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.6} />
            </mesh>

            {/* Label */}
            <Html distanceFactor={15} zIndexRange={[100, 0]}>
              <div className="pointer-events-auto group relative flex items-center gap-1 font-mono select-none">
                <span className="text-base">{sc.icon}</span>
                <span
                  className={
                    isVenue
                      ? 'text-[10px] bg-red-950/80 border border-red-500/60 px-1.5 py-0.5 rounded text-red-300 font-bold whitespace-nowrap shadow-lg shadow-red-500/20'
                      : 'text-[9px] bg-black/80 border border-cyan-500/40 px-1.5 py-0.5 rounded text-cyan-200 font-bold whitespace-nowrap shadow-md'
                  }
                >
                  {sc.name.split(' (')[0]}
                </span>

                {/* Hover Tooltip */}
                <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-48 p-2 bg-black/90 border border-white/20 rounded text-[10px] text-white space-y-1 z-50">
                  <div className="font-bold text-cyan-300">{sc.name}</div>
                  <div className="text-white/60">{sc.agency} · {sc.country}</div>
                  <div className="text-white/80">{sc.description}</div>
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
