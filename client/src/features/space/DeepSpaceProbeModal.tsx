import React from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { DEEP_SPACE_PROBES, type DeepSpaceProbe } from '../../../../shared/space/index';

export function DeepSpaceProbeModal() {
  const { selectedProbeId, setSelectedProbe } = useMissionStore();

  if (!selectedProbeId) return null;

  const probe = DEEP_SPACE_PROBES.find((p) => p.id === selectedProbeId);
  if (!probe) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 font-mono text-xs select-none">
      <div className="bg-black/90 border border-cyan-500/40 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex justify-between items-start border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 uppercase">
                {probe.target} Target
              </span>
              <span className="text-white/40">{probe.agency}</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-white mt-1">{probe.name}</h2>
            <p className="text-xs text-white/50">Launched {probe.launchYear} · Distance: {probe.distanceKm}</p>
          </div>
          <button
            onClick={() => setSelectedProbe(null)}
            className="text-white/40 hover:text-white text-xl font-bold px-2"
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
          <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest mb-1">Mission Overview</div>
          <p className="text-white/80 leading-relaxed">{probe.description}</p>
          <div className="mt-2 text-green-400 font-bold text-[11px]">Status: {probe.status}</div>
        </div>

        {/* Real Captured Image Gallery */}
        <div className="space-y-3">
          <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">
            📸 Real Space Imagery Captured by {probe.name}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {probe.capturedPhotos.map((photo, idx) => (
              <div key={idx} className="bg-black/60 border border-white/10 rounded-xl overflow-hidden space-y-2">
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-44 object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="p-3 space-y-1">
                  <div className="font-bold text-white text-xs">{photo.title}</div>
                  <div className="text-[10px] text-white/60 leading-tight">{photo.caption}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
