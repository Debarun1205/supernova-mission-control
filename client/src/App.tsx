import React, { useEffect } from 'react';
import { Globe } from './features/globe/Globe';
import { useMissionStore } from './store/useMissionStore';

function App() {
  const { isLive, timeSpeed, setSimulationTime } = useMissionStore();

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = Date.now();

    const loop = () => {
      const now = Date.now();
      const delta = now - lastTime;
      lastTime = now;

      if (useMissionStore.getState().isLive) {
        setSimulationTime(Date.now());
      } else {
        const currentSimTime = useMissionStore.getState().simulationTime;
        setSimulationTime(currentSimTime + delta * useMissionStore.getState().timeSpeed);
      }
      
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-abyss text-starlight font-sans">
      <Globe />
      
      {/* Absolute UI Overlays (Time Machine, etc) */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h1 className="text-2xl font-display font-bold text-ion tracking-wider uppercase">Mission Control</h1>
        <p className="text-sm font-mono text-dust mt-1">
          {new Date(useMissionStore(s => s.simulationTime)).toUTCString()}
          {isLive && <span className="ml-2 text-nova border border-nova px-1 rounded animate-pulse">LIVE</span>}
        </p>
      </div>
      
      {/* Time Machine Bar Placeholder */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-hull-raised/80 backdrop-blur border border-ion/20 px-6 py-3 rounded-xl flex items-center gap-4 pointer-events-auto">
        <button 
          className="text-ion hover:text-starlight font-mono text-sm px-2 py-1"
          onClick={() => useMissionStore.getState().setLive(true)}
        >
          LIVE
        </button>
        <div className="w-px h-4 bg-dust/30"></div>
        {[1, 10, 60, 600, 3600].map(speed => (
          <button 
            key={speed}
            className={`font-mono text-sm px-2 py-1 ${timeSpeed === speed && !useMissionStore.getState().isLive ? 'text-nominal' : 'text-dust hover:text-starlight'}`}
            onClick={() => {
              useMissionStore.getState().setLive(false);
              useMissionStore.getState().setTimeSpeed(speed);
            }}
          >
            {speed}x
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
