import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Earth } from './components/Earth';
import { Atmosphere } from './components/Atmosphere';
import { Catalogue } from './components/Catalogue';
import { MissionFleet } from './components/MissionFleet';
import { GroundStations } from './components/GroundStations';

export function Globe() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050912' }}>
      <Canvas camera={{ position: [0, 0, 25], fov: 45 }} gl={{ antialias: true }}>
        <color attach="background" args={['#050912']} />

        {/* Lighting */}
        <ambientLight intensity={0.05} />
        <directionalLight position={[50, 10, 20]} intensity={2} color={0xffffff} />

        <Suspense fallback={null}>
          <Earth />
          <Atmosphere />
          <Catalogue />
          <MissionFleet />
          <GroundStations />

          {/* Procedural starfield */}
          <Stars radius={100} depth={50} count={6000} factor={4} saturation={0} fade speed={0.5} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.05}
          minDistance={11}
          maxDistance={50}
        />

        {/* Post-processing */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
