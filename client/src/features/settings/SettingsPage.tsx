import React, { useState } from 'react';
import { GlobalHeader } from '../../components/GlobalHeader';

export function SettingsPage() {
  const [stationName, setStationName] = useState('Kolkata (UEM)');
  const [lat, setLat] = useState('22.5726');
  const [lon, setLon] = useState('88.3639');
  const [elevationMask, setElevationMask] = useState('5');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetDemoState = () => {
    if (confirm('Reset demo state to initial fleet baseline?')) {
      alert('Demo state reset successfully.');
    }
  };

  return (
    <div className="min-h-screen bg-abyss text-starlight font-sans">
      <GlobalHeader />

      <main className="max-w-3xl mx-auto p-6 space-y-6 font-mono text-xs">
        <div>
          <h1 className="text-2xl font-display font-bold text-ion tracking-wide uppercase">
            Platform Settings
          </h1>
          <p className="text-xs text-dust mt-1">
            Configure observer ground station coordinates, anomaly thresholds, audio alerts, and demo state.
          </p>
        </div>

        {/* Observer Station Config */}
        <div className="bg-black/60 backdrop-blur border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Primary Observer Ground Station
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white/50 mb-1 block">Station Name</label>
              <input
                type="text"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-white/50 mb-1 block">Elevation Mask (°)</label>
              <input
                type="text"
                value={elevationMask}
                onChange={(e) => setElevationMask(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-white/50 mb-1 block">Latitude (°N)</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-white/50 mb-1 block">Longitude (°E)</label>
              <input
                type="text"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 text-cyan-300 font-bold rounded transition-colors"
            >
              {saved ? '✓ Settings Saved' : 'Save Station Config'}
            </button>
          </div>
        </div>

        {/* Demo State Control */}
        <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">
            Demo Environment Controls
          </h2>
          <p className="text-white/60 text-xs">
            Clears all injected chaos faults, clears active alerts, and resets fleet telemetry to nominal baseline.
          </p>
          <button
            onClick={resetDemoState}
            className="px-4 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-500/50 text-red-300 font-bold rounded transition-colors"
          >
            Reset Demo State
          </button>
        </div>
      </main>
    </div>
  );
}
