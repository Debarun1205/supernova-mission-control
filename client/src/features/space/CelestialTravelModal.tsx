import React, { useState, useEffect } from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import type { CelestialTarget } from '../../../../shared/space/index';

export function CelestialTravelModal() {
  const { activeCelestialTarget, setActiveCelestialTarget } = useMissionStore();
  const [warpProgress, setWarpProgress] = useState(0);
  const [isWarping, setIsWarping] = useState(false);
  const [simulationState, setSimulationState] = useState<{ angle: number; scale: number }>({
    angle: 0,
    scale: 1,
  });

  useEffect(() => {
    if (activeCelestialTarget) {
      setIsWarping(true);
      setWarpProgress(0);

      // Warp drive transition timer
      const interval = setInterval(() => {
        setWarpProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsWarping(false);
            return 100;
          }
          return prev + 5;
        });
      }, 50);

      return () => clearInterval(interval);
    }
  }, [activeCelestialTarget]);

  // Continuous animation loop for neutron star rotation, accretion disk spinning, and supernova expansion
  useEffect(() => {
    if (!activeCelestialTarget || isWarping) return;

    let rafId: number;
    const animate = () => {
      setSimulationState((prev) => ({
        angle: (prev.angle + 2) % 360,
        scale: 1 + Math.sin(Date.now() / 300) * 0.05,
      }));
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [activeCelestialTarget, isWarping]);

  if (!activeCelestialTarget) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col font-mono select-none overflow-hidden text-white">
      {/* Warp drive transition screen */}
      {isWarping && (
        <div className="absolute inset-0 z-50 bg-abyss flex flex-col items-center justify-center p-6 space-y-4">
          <div className="text-4xl animate-pulse">🚀</div>
          <div className="text-xl font-bold font-display text-cyan-300 uppercase tracking-widest animate-bounce">
            Engaging Warp Drive to {activeCelestialTarget.name}...
          </div>
          <div className="w-80 h-3 bg-white/10 rounded-full overflow-hidden border border-cyan-500/40">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 via-nova to-aurora transition-all duration-75"
              style={{ width: `${warpProgress}%` }}
            />
          </div>
          <div className="text-xs text-white/50">{activeCelestialTarget.distanceLy} travel vector</div>
        </div>
      )}

      {/* Main Cosmic Inspection Environment */}
      <div className="relative flex-1 flex flex-col justify-between p-6 bg-radial from-slate-950 via-abyss to-black">
        {/* Top Header */}
        <div className="flex justify-between items-start z-10">
          <div>
            <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest border border-cyan-500/40 px-2 py-0.5 rounded bg-cyan-950/60">
              Interstellar Celestial Inspection
            </span>
            <h1 className="text-3xl font-bold font-display text-white mt-1">
              {activeCelestialTarget.name}
            </h1>
            <p className="text-xs text-white/50">
              Constellation: {activeCelestialTarget.constellation} · Distance: {activeCelestialTarget.distanceLy}
            </p>
          </div>

          <button
            onClick={() => setActiveCelestialTarget(null)}
            className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 font-bold text-xs rounded-xl transition-colors"
          >
            ← Return to Earth Orbit
          </button>
        </div>

        {/* 3D / Shader Cosmic Phenomena Visualizer */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Black Hole Simulation */}
          {activeCelestialTarget.interactiveType === 'black_hole' && (
            <div className="relative flex items-center justify-center">
              {/* Accretion Disk Glow */}
              <div
                className="w-96 h-96 rounded-full bg-gradient-to-tr from-amber-500 via-orange-600 to-purple-800 blur-xl opacity-80 animate-spin"
                style={{ transform: `rotate(${simulationState.angle}deg) scale(${simulationState.scale})` }}
              />
              {/* Photon Ring */}
              <div className="absolute w-64 h-64 rounded-full border-4 border-amber-300/80 shadow-[0_0_50px_rgba(251,191,36,0.8)]" />
              {/* Event Horizon (Black Void) */}
              <div className="absolute w-52 h-52 rounded-full bg-black shadow-[inset_0_0_40px_rgba(0,0,0,1)] border border-white/10" />
            </div>
          )}

          {/* Neutron Star / Pulsar Simulation */}
          {activeCelestialTarget.interactiveType === 'neutron_star' && (
            <div className="relative flex items-center justify-center">
              {/* Magnetic Beam Jet North */}
              <div
                className="absolute w-2 h-96 bg-gradient-to-t from-cyan-400 to-transparent blur-sm -translate-y-48"
                style={{ transform: `rotate(${simulationState.angle * 2}deg) translateY(-100px)` }}
              />
              {/* Magnetic Beam Jet South */}
              <div
                className="absolute w-2 h-96 bg-gradient-to-b from-cyan-400 to-transparent blur-sm translate-y-48"
                style={{ transform: `rotate(${simulationState.angle * 2}deg) translateY(100px)` }}
              />
              {/* Rotating Magnetosphere */}
              <div
                className="w-80 h-80 rounded-full border border-cyan-400/40 animate-pulse"
                style={{ transform: `scale(${simulationState.scale})` }}
              />
              {/* Dense Core */}
              <div className="absolute w-28 h-28 rounded-full bg-cyan-200 shadow-[0_0_60px_#5CE1FF]" />
            </div>
          )}

          {/* Supernova Explosion Simulation */}
          {activeCelestialTarget.interactiveType === 'supernova' && (
            <div className="relative flex items-center justify-center">
              {/* Plasma Shockwave */}
              <div
                className="w-96 h-96 rounded-full bg-gradient-to-r from-red-600 via-yellow-500 to-purple-600 blur-2xl opacity-70 animate-ping"
                style={{ transform: `scale(${simulationState.scale * 1.1})` }}
              />
              <div className="absolute w-40 h-40 rounded-full bg-white shadow-[0_0_100px_#FF4D6D]" />
            </div>
          )}

          {/* Wormhole Simulation */}
          {activeCelestialTarget.interactiveType === 'wormhole' && (
            <div className="relative flex items-center justify-center">
              <div
                className="w-96 h-96 rounded-full border-8 border-dashed border-cyan-400/60 animate-spin"
                style={{ transform: `rotate(${-simulationState.angle}deg)` }}
              />
              <div className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-cyan-900 to-purple-950 blur-lg" />
              <div className="absolute w-32 h-32 rounded-full bg-white blur-md animate-pulse" />
            </div>
          )}

          {/* Andromeda Galaxy Simulation */}
          {activeCelestialTarget.interactiveType === 'galaxy' && (
            <div className="relative flex items-center justify-center">
              <div
                className="w-[30rem] h-64 rounded-[100%] border border-cyan-500/30 bg-gradient-to-r from-purple-900 via-indigo-900 to-cyan-900 blur-md opacity-80"
                style={{ transform: `rotate(${simulationState.angle / 2}deg) rotateX(60deg)` }}
              />
              <div className="absolute w-24 h-24 rounded-full bg-amber-100 shadow-[0_0_80px_#FDE68A]" />
            </div>
          )}
        </div>

        {/* Bottom Information Card */}
        <div className="z-10 max-w-2xl bg-black/80 backdrop-blur-xl border border-white/20 p-6 rounded-2xl space-y-2">
          <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
            Phenomena Overview
          </div>
          <p className="text-xs text-white/90 leading-relaxed">
            {activeCelestialTarget.description}
          </p>
        </div>
      </div>
    </div>
  );
}
