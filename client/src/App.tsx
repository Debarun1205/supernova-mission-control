import React, { useEffect } from 'react';
import { Globe } from './features/globe/Globe';
import { SatellitePanel } from './features/satellite/SatellitePanel';
import { useMissionStore } from './store/useMissionStore';

function App() {
  const { isLive, timeSpeed } = useMissionStore();

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
      {/* 3D Globe */}
      <Globe />

      {/* Top-left branding + clock */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
        <h1 className="text-2xl font-display font-bold text-ion tracking-widest uppercase">
          Mission Control
        </h1>
        <p className="text-xs font-mono text-dust mt-1 flex items-center gap-2">
          {new Date(useMissionStore((s) => s.simulationTime)).toUTCString()}
          {isLive && (
            <span className="text-nova border border-nova/60 px-1 rounded text-[10px] animate-pulse">
              LIVE
            </span>
          )}
        </p>
      </div>

      {/* Satellite panel (Part 3) */}
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
          const cls = active
            ? 'font-mono text-sm px-2 py-1 text-green-400 underline underline-offset-2'
            : 'font-mono text-sm px-2 py-1 text-white/40 hover:text-white transition-colors';
          return (
            <button
              key={speed}
              className={cls}
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
