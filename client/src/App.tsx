import React, { useEffect, useState } from 'react';
import { Globe } from './features/globe/Globe';
import { SatellitePanel } from './features/satellite/SatellitePanel';
import { SpaceWeatherWidget } from './features/weather/SpaceWeatherWidget';
import { MissionAiDrawer } from './features/ai/MissionAiDrawer';
import { GlobalHeader } from './components/GlobalHeader';
import { useTelemetrySocket } from './hooks/useTelemetrySocket';
import { useMissionStore } from './store/useMissionStore';

function App() {
  const { isLive, timeSpeed } = useMissionStore();
  const [aiOpen, setAiOpen] = useState(false);

  // Connect Socket.IO and stream telemetry into store
  useTelemetrySocket();

  // Animation loop: advance simulation time
  useEffect(() => {
    let raf: number;
    let last = Date.now();

    const loop = () => {
      const now = Date.now();
      const delta = now - last;
      last = now;
      const store = useMissionStore.getState();
      if (store.isLive) {
        store.setSimulationTime(Date.now());
      } else {
        store.setSimulationTime(store.simulationTime + delta * store.timeSpeed);
      }
      raf = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-abyss text-starlight font-sans">
      <GlobalHeader />

      {/* 3D Globe */}
      <Globe />

      {/* Top-left branding + clock + nav — starts BELOW the 40px GlobalHeader */}
      <div className="absolute top-12 left-4 z-10 select-none">
        <h1 className="text-2xl font-display font-bold text-ion tracking-widest uppercase pointer-events-none">
          Mission Control
        </h1>
        <p className="text-xs font-mono text-dust mt-1 flex items-center gap-2 pointer-events-none">
          {new Date(useMissionStore((s) => s.simulationTime)).toUTCString()}
          {isLive && (
            <span className="text-nova border border-nova/60 px-1 rounded text-[10px] animate-pulse">
              LIVE
            </span>
          )}
        </p>
        <p className="text-[10px] font-mono text-white/20 mt-0.5 pointer-events-none">⚠ Simulated telemetry</p>
        <div className="flex gap-3 mt-2 pointer-events-auto">
          <a href="/alerts" className="text-[11px] font-mono text-white/40 hover:text-cyan-400 transition-colors border border-white/10 hover:border-cyan-400/40 px-2 py-0.5 rounded">
            Alerts
          </a>
          <a href="/scenarios" className="text-[11px] font-mono text-white/40 hover:text-nova transition-colors border border-white/10 hover:border-nova/40 px-2 py-0.5 rounded">
            ⚡ Chaos
          </a>
          <button
            onClick={() => setAiOpen(true)}
            className="text-[11px] font-mono text-cyan-300 hover:text-cyan-100 bg-cyan-950/60 border border-cyan-500/40 hover:border-cyan-400 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
          >
            🛰️ Mission AI (A)
          </button>
        </div>
      </div>

      {/* Mission AI Drawer */}
      <MissionAiDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      {/* Top-right: Space Weather widget */}
      <div className="absolute top-4 right-4 z-10 pointer-events-auto">
        <SpaceWeatherWidget />
      </div>

      {/* Satellite detail panel (Part 3 + 4) */}
      <SatellitePanel />

      {/* Time Machine bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-black/80 backdrop-blur border border-white/10 px-6 py-3 rounded-xl flex items-center gap-4 pointer-events-auto select-none">
        <button
          className="text-cyan-400 hover:text-white font-mono text-sm px-2 py-1 transition-colors"
          onClick={() => useMissionStore.getState().setLive(true)}
        >
          LIVE
        </button>
        <div className="w-px h-4 bg-white/20" />
        {[1, 10, 60, 600, 3600].map((speed) => {
          const active = timeSpeed === speed && !isLive;
          return (
            <button
              key={speed}
              className={
                active
                  ? 'font-mono text-sm px-2 py-1 text-green-400 underline underline-offset-2'
                  : 'font-mono text-sm px-2 py-1 text-white/40 hover:text-white transition-colors'
              }
              onClick={() => {
                useMissionStore.getState().setLive(false);
                useMissionStore.getState().setTimeSpeed(speed);
              }}
            >
              {speed}x
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default App;
