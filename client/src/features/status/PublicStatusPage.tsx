import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:3000/api';

export function PublicStatusPage() {
  const [status, setStatus] = useState<any>(null);
  const [satellites, setSatellites] = useState<any[]>([]);

  useEffect(() => {
    axios.get(`${API}/status`).then((res) => setStatus(res.data)).catch(() => {});
    axios.get(`${API}/satellites`).then((res) => setSatellites(res.data)).catch(() => {});
  }, []);

  const nominalCount = satellites.filter((s) => s.health === 'nominal').length;

  return (
    <div className="min-h-screen bg-abyss text-starlight font-sans p-8 font-mono">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div>
            <h1 className="text-2xl font-bold font-display text-ion uppercase tracking-wider">
              Supernova Constellation Status
            </h1>
            <p className="text-xs text-dust mt-1">Public operational status dashboard</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-bold">ALL SYSTEMS OPERATIONAL</span>
          </div>
        </div>

        {/* Operational Overview Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-black/60 border border-white/10 p-4 rounded-xl">
            <div className="text-[10px] text-white/40 uppercase">Fleet Operational Status</div>
            <div className="text-xl font-bold text-green-400 mt-1">
              {nominalCount} / {satellites.length} Nominal
            </div>
          </div>
          <div className="bg-black/60 border border-white/10 p-4 rounded-xl">
            <div className="text-[10px] text-white/40 uppercase">Space Weather Kp Index</div>
            <div className="text-xl font-bold text-cyan-300 mt-1">
              Kp {status?.weather?.kp?.toFixed(1) ?? '2.0'}
            </div>
          </div>
          <div className="bg-black/60 border border-white/10 p-4 rounded-xl">
            <div className="text-[10px] text-white/40 uppercase">Platform Uptime</div>
            <div className="text-xl font-bold text-white mt-1">99.98%</div>
          </div>
        </div>

        {/* Satellite Health Table */}
        <div className="bg-black/60 border border-white/10 rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Monitored Spacecraft</h2>
          <div className="space-y-2 text-xs">
            {satellites.map((s) => (
              <div key={s.noradId} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/10">
                <div>
                  <span className="font-bold text-white">{s.name}</span>
                  <span className="text-[10px] text-white/40 ml-2">NORAD {s.noradId}</span>
                </div>
                <span className="text-xs font-bold text-green-400 uppercase">● {s.health}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
