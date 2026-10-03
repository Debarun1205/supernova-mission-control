import React from 'react';
import { GlobalHeader } from '../../components/GlobalHeader';
import { CELESTIAL_TARGETS, DEEP_SPACE_PROBES, SPACE_CENTERS } from '../../../../shared/space/index';
import { useMissionStore } from '../../store/useMissionStore';
import { CelestialTravelModal } from './CelestialTravelModal';
import { DeepSpaceProbeModal } from './DeepSpaceProbeModal';

export function CosmicUniverseExplorerPage() {
  const { setActiveCelestialTarget, setSelectedProbe } = useMissionStore();

  return (
    <div className="min-h-screen bg-abyss text-starlight font-sans select-none">
      <GlobalHeader />

      <main className="max-w-6xl mx-auto p-6 space-y-8 font-mono">
        <div>
          <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest border border-cyan-500/40 px-2 py-0.5 rounded bg-cyan-950/60">
            Deep Space & Interstellar Exploration
          </span>
          <h1 className="text-3xl font-display font-bold text-ion uppercase tracking-wide mt-2">
            Cosmic Universe Explorer
          </h1>
          <p className="text-xs text-dust">
            Travel across the galaxy to black holes, supernovae, and spinning pulsars, or inspect interplanetary space probes.
          </p>
        </div>

        {/* Section 1: Interstellar Celestial Bodies (Travel to Black Hole / Supernova) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
            🌌 Interstellar Phenomena & Deep Space Objects (Travel Available)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CELESTIAL_TARGETS.map((target) => (
              <div
                key={target.id}
                className="bg-black/60 backdrop-blur border border-cyan-500/30 rounded-2xl p-5 space-y-3 hover:border-cyan-400 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">
                      {target.type}
                    </span>
                    <span className="text-[10px] text-white/40">{target.constellation}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{target.name}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{target.description}</p>
                </div>

                <button
                  onClick={() => setActiveCelestialTarget(target)}
                  className="w-full py-2 bg-gradient-to-r from-cyan-500/20 to-nova/20 hover:from-cyan-500/40 hover:to-nova/40 border border-cyan-500/40 text-cyan-300 font-bold text-xs rounded-xl transition-colors mt-2"
                >
                  🚀 Warp Travel to {target.name.split(' (')[0]} →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Solar System & Interstellar Deep Space Probes */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
            🔭 Deep Space Probes & Telescopes (Sun, Moon, Mars, JWST & Voyagers)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DEEP_SPACE_PROBES.map((probe) => (
              <div
                key={probe.id}
                className="bg-black/60 backdrop-blur border border-white/10 rounded-2xl p-5 space-y-3 hover:border-white/30 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-cyan-400 uppercase font-bold">{probe.target} Mission</span>
                    <span className="text-[10px] text-white/40">{probe.agency}</span>
                  </div>
                  <h3 className="font-bold text-white text-base">{probe.name}</h3>
                  <p className="text-xs text-white/60 leading-relaxed">{probe.description}</p>
                </div>

                <button
                  onClick={() => setSelectedProbe(probe.id)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/20 text-white font-bold text-xs rounded-xl transition-colors mt-2"
                >
                  📸 View Real Captured Photos ({probe.capturedPhotos.length})
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Space Centers & Hackathon Venue */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/10 pb-2">
            🚀 Global Spaceports & Hackathon Host Venue
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SPACE_CENTERS.map((sc) => (
              <div key={sc.id} className="bg-black/60 border border-white/10 p-4 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{sc.icon}</span>
                  <span className="font-bold text-white text-xs">{sc.name}</span>
                </div>
                <div className="text-[10px] text-white/50">{sc.agency} · {sc.country}</div>
                <div className="text-[11px] text-white/70">{sc.description}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
      <CelestialTravelModal />
      <DeepSpaceProbeModal />
    </div>
  );
}
