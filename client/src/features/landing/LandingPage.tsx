import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Globe } from '../globe/Globe';

const API = 'http://localhost:3000/api';

export function LandingPage() {
  const [bootStep, setBootStep] = useState(0);
  const [stats, setStats] = useState({ total: 3, nominal: 3, warning: 0, critical: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/satellites`).then((res) => {
      const sats = res.data;
      const nominal = sats.filter((s: any) => s.health === 'nominal').length;
      const warning = sats.filter((s: any) => s.health === 'warning').length;
      const critical = sats.filter((s: any) => s.health === 'critical').length;
      setStats({ total: sats.length, nominal, warning, critical });
    }).catch(() => {});

    // Boot sequence animation steps
    const timer1 = setTimeout(() => setBootStep(1), 500);
    const timer2 = setTimeout(() => setBootStep(2), 1200);
    const timer3 = setTimeout(() => setBootStep(3), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="w-full h-screen relative overflow-hidden bg-abyss text-starlight font-sans select-none">
      {/* Background 3D Globe */}
      <Globe />

      {/* Boot sequence overlay */}
      {bootStep < 3 && (
        <div className="absolute inset-0 bg-black z-50 flex items-center justify-center p-6 font-mono text-xs text-cyan-400">
          <div className="space-y-2 max-w-md w-full">
            <div className="text-white/40 uppercase tracking-widest text-[10px]">
              SUPERNOVA MISSION CONTROL BOOT SEQUENCE v1.0
            </div>
            {bootStep >= 0 && <div>[INIT] Connecting to MongoDB memory cluster... OK</div>}
            {bootStep >= 1 && <div>[INIT] Synchronizing SGP4 orbital catalogue... OK</div>}
            {bootStep >= 2 && <div>[INIT] Calibrating telemetry physics engine... OK</div>}
          </div>
        </div>
      )}

      {/* Hero content overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-8 pointer-events-none">
        {/* Top header */}
        <div className="flex justify-between items-start pointer-events-auto">
          <div>
            <h1 className="text-3xl font-display font-bold text-ion tracking-widest uppercase">
              Supernova Mission Control
            </h1>
            <p className="text-xs font-mono text-dust mt-1">
              Physics-consistent satellite telemetry, space weather & AI operations platform
            </p>
          </div>
          <button
            onClick={() => navigate('/console')}
            className="px-5 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/40 border border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/10 transition-colors"
          >
            Enter Mission Control →
          </button>
        </div>

        {/* Bottom stats banner */}
        <div className="grid grid-cols-4 gap-4 max-w-3xl bg-black/70 backdrop-blur-xl border border-white/10 p-4 rounded-2xl pointer-events-auto font-mono text-xs">
          <div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">Tracked Satellites</div>
            <div className="text-xl font-bold text-white mt-0.5">{stats.total}</div>
          </div>
          <div>
            <div className="text-[10px] text-green-400 uppercase tracking-widest">Fleet Nominal</div>
            <div className="text-xl font-bold text-green-400 mt-0.5">{stats.nominal}</div>
          </div>
          <div>
            <div className="text-[10px] text-yellow-400 uppercase tracking-widest">Fleet Warning</div>
            <div className="text-xl font-bold text-yellow-400 mt-0.5">{stats.warning}</div>
          </div>
          <div>
            <div className="text-[10px] text-red-400 uppercase tracking-widest">Fleet Critical</div>
            <div className="text-xl font-bold text-red-400 mt-0.5">{stats.critical}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
