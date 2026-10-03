import React, { useState } from 'react';
import { useMissionStore, type LayerVisibility } from '../../../store/useMissionStore';

export function LayerControlLegend() {
  const [collapsed, setCollapsed] = useState(false);
  const { layers, toggleLayer } = useMissionStore();

  const items: Array<{ key: keyof LayerVisibility; label: string; icon: string }> = [
    { key: 'satellites', label: 'Mission Satellites', icon: '🛰️' },
    { key: 'spaceCenters', label: 'Spaceports & Hackathon Venue', icon: '🚀' },
    { key: 'groundStations', label: 'Tracking Ground Stations', icon: '📡' },
    { key: 'deepSpaceProbes', label: 'Interplanetary Probes', icon: '🔭' },
    { key: 'celestialBodies', label: 'Cosmic Targets & Black Holes', icon: '🌌' },
    { key: 'orbitTraces', label: 'Orbital Path Traces', icon: '🌐' },
  ];

  return (
    <div className="absolute bottom-6 right-6 z-20 font-mono text-xs select-none pointer-events-auto">
      <div className="bg-black/85 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden transition-all max-w-xs">
        {/* Title bar */}
        <div
          onClick={() => setCollapsed(!collapsed)}
          className="p-3 bg-cyan-950/30 border-b border-white/10 flex items-center justify-between cursor-pointer hover:bg-cyan-900/40 transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-cyan-300 uppercase tracking-widest text-[11px]">
            <span>🗺️ Layers & Legend</span>
          </div>
          <span className="text-white/40 text-xs font-bold">{collapsed ? '+' : '−'}</span>
        </div>

        {!collapsed && (
          <div className="p-3 space-y-2">
            {items.map((item) => {
              const active = layers[item.key];
              return (
                <label
                  key={String(item.key)}
                  className="flex items-center justify-between gap-3 p-1.5 rounded hover:bg-white/5 cursor-pointer text-[11px] transition-colors"
                >
                  <span className="flex items-center gap-2 text-white/80">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={() => toggleLayer(item.key)}
                    className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                  />
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
