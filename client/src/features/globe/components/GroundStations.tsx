import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

export function GroundStations() {
  const [stations, setStations] = useState<any[]>([]);

  useEffect(() => {
    axios.get('http://localhost:3000/api/ground-stations').then(res => {
      setStations(res.data);
    });
  }, []);

  const earthRadiusScene = 10;

  return (
    <group>
      {stations.map(station => {
        // Convert Lat/Lon to 3D Cartesian coordinates on sphere
        const phi = (90 - station.lat) * (Math.PI / 180);
        const theta = (station.lon + 180) * (Math.PI / 180);

        const x = -(earthRadiusScene * Math.sin(phi) * Math.cos(theta));
        const z = (earthRadiusScene * Math.sin(phi) * Math.sin(theta));
        const y = (earthRadiusScene * Math.cos(phi));

        return (
          <group key={station._id} position={[x, y, z]}>
            <mesh>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color="#FFB347" />
            </mesh>
            <Html distanceFactor={15}>
              <div className="text-[10px] font-mono text-solar opacity-80 whitespace-nowrap ml-2">
                {station.name}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
