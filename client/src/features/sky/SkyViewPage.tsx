import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GlobalHeader } from '../../components/GlobalHeader';

const API = 'http://localhost:3000/api';

export function SkyViewPage() {
  const [passes, setPasses] = useState<any[]>([]);

  useEffect(() => {
    // Default to ISS passes over Kolkata
    axios.get(`${API}/satellites/25544/passes?hours=24`).then((res) => setPasses(res.data.passes ?? [])).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-abyss text-starlight font-sans">
      <GlobalHeader />

      <main className="max-w-4xl mx-auto p-6 space-y-6 font-mono">
        <div>
          <h1 className="text-2xl font-display font-bold text-ion tracking-wide uppercase">
            🌌 Sky Plot View
          </h1>
          <p className="text-xs text-dust mt-1">
            Polar sky plot representation of satellite passes over the observer station (Kolkata).
          </p>
        </div>

        {/* Polar Sky Plot Canvas */}
        <div className="bg-black/80 backdrop-blur border border-cyan-500/30 rounded-2xl p-8 flex flex-col items-center justify-center space-y-6">
          <div className="relative w-72 h-72 rounded-full border-2 border-cyan-500/40 flex items-center justify-center">
            {/* Concentric rings (elevation 30°, 60°) */}
            <div className="absolute w-48 h-48 rounded-full border border-white/10" />
            <div className="absolute w-24 h-24 rounded-full border border-white/10" />

            {/* Crosshairs (N-S, E-W) */}
            <div className="absolute inset-x-0 h-px bg-white/20" />
            <div className="absolute inset-y-0 w-px bg-white/20" />

            {/* Cardinal direction labels */}
            <span className="absolute -top-6 text-xs text-cyan-300 font-bold">N</span>
            <span className="absolute -bottom-6 text-xs text-cyan-300 font-bold">S</span>
            <span className="absolute -right-6 text-xs text-cyan-300 font-bold">E</span>
            <span className="absolute -left-6 text-xs text-cyan-300 font-bold">W</span>

            {/* Pass trajectory points */}
            {passes.length > 0 && (
              <div className="w-3 h-3 rounded-full bg-green-400 animate-ping shadow-lg shadow-green-400/50" />
            )}
          </div>

          <div className="text-xs text-white/60 text-center">
            Observer Station: Kolkata (22.57° N, 88.36° E) · Elevation Mask: 5°
          </div>
        </div>

        {/* Upcoming Passes List */}
        <div className="space-y-3 text-xs">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Next Passes (24 Hours)</h2>
          {passes.map((p, idx) => (
            <div key={idx} className="flex justify-between bg-black/60 p-3 rounded-xl border border-white/10">
              <div>
                <div className="font-bold text-white">AOS: {new Date(p.aos).toUTCString()}</div>
                <div className="text-white/40 text-[10px]">LOS: {new Date(p.los).toUTCString()}</div>
              </div>
              <div className="text-right">
                <div className="text-green-400 font-bold">{p.maxEl.toFixed(1)}° Max Elevation</div>
                <div className="text-white/50 text-[10px]">{Math.round(p.duration)}s Duration</div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
