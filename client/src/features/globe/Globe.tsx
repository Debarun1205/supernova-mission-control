import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Earth } from './components/Earth';
import { Atmosphere } from './components/Atmosphere';
import { Catalogue } from './components/Catalogue';
import { MissionFleet } from './components/MissionFleet';
import { GroundStations } from './components/GroundStations';
import { SpaceCenters } from './components/SpaceCenters';
import { LayerControlLegend } from './components/LayerControlLegend';
import { SatelliteZoomBridge, SatelliteOverlayView, type SatZoomState } from './components/SatelliteZoomOverlay';
import { CelestialTravelModal } from '../space/CelestialTravelModal';
import { DeepSpaceProbeModal } from '../space/DeepSpaceProbeModal';

export function Globe() {
  const [satState, setSatState] = useState<SatZoomState>({
    visible: false,
    opacity: 0,
    lat: 0,
    lon: 0,
    zoom: 10,
  });

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#050912', position: 'relative' }}>
      <Canvas camera={{ position: [0, 0, 25], fov: 45 }} gl={{ antialias: true }}>
        <color attach="background" args={['#050912']} />

        {/* Lighting */}
        <ambientLight intensity={0.1} />
        <directionalLight position={[50, 10, 20]} intensity={2.2} color={0xffffff} />

        <Suspense fallback={null}>
          <Earth />
          <Atmosphere />
          <Catalogue />
          <MissionFleet />
          <GroundStations />
          <SpaceCenters />

          {/* Satellite zoom bridge — reads camera distance every frame */}
          <SatelliteZoomBridge onState={setSatState} />

          {/* Procedural starfield */}
          <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={0.5} />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.05}
          minDistance={10.1} // Allows close zoom to ground level spaceports & venues
          maxDistance={60}
        />

        {/* Post-processing */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.2} luminanceSmoothing={0.9} height={300} />
        </EffectComposer>
      </Canvas>

      {/* Satellite imagery overlay — appears when zoomed close */}
      <SatelliteOverlayView state={satState} />

      {/* Layer legend overlay & space travel modals */}
      <LayerControlLegend />
      <CelestialTravelModal />
      <DeepSpaceProbeModal />
    </div>
  );
}
