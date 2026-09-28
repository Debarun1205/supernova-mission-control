import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useMissionStore } from '../../store/useMissionStore';
import { TelemetryPanel } from '../telemetry/TelemetryPanel';

interface OrbitFacts {
  semiMajorAxisKm: number;
  eccentricity: number;
  inclinationDeg: number;
  periodMinutes: number;
  altitudeKm: number;
  velocityKms: number;
  orbitType: string;
}

interface Pass {
  aos: string;
  los: string;
  maxEl: number;
  duration: number;
}

const API = 'http://localhost:3000/api';

export function SatellitePanel() {
  const selectedSatelliteId = useMissionStore((s) => s.selectedSatelliteId);
  const [facts, setFacts] = useState<OrbitFacts | null>(null);
  const [passes, setPasses] = useState<Pass[]>([]);
  const [eclipse, setEclipse] = useState<boolean | null>(null);
  const [satName, setSatName] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'orbit' | 'telemetry'>('telemetry');

  useEffect(() => {
    if (!selectedSatelliteId) {
      setFacts(null);
      setPasses([]);
      setEclipse(null);
      setSatName('');
      return;
    }

    setLoading(true);
    const id = selectedSatelliteId;

    Promise.all([
      axios.get(`${API}/satellites/${id}`),
      axios.get(`${API}/satellites/${id}/orbit-facts`),
      axios.get(`${API}/satellites/${id}/passes?hours=24`),
      axios.get(`${API}/satellites/${id}/eclipse`),
    ])
      .then(([satRes, factsRes, passesRes, eclipseRes]) => {
        setSatName(satRes.data.name);
        setFacts(factsRes.data);
        setPasses(passesRes.data.passes ?? []);
        setEclipse(eclipseRes.data.inEclipse);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedSatelliteId]);

  if (!selectedSatelliteId) return null;

  const eclipseBadge = eclipse
    ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-500/40'
    : 'bg-yellow-900/60 text-yellow-300 border border-yellow-500/40';

  const tabBtn = (tab: typeof activeTab, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={
        activeTab === tab
          ? 'flex-1 text-[10px] font-mono py-1 text-cyan-300 border-b border-cyan-400 uppercase tracking-wider'
          : 'flex-1 text-[10px] font-mono py-1 text-white/30 hover:text-white/60 uppercase tracking-wider transition-colors'
      }
    >
      {label}
    </button>
  );

  return (
    <div className="absolute top-20 right-4 w-72 z-10 bg-black/85 backdrop-blur border border-white/10 rounded-xl p-4 text-sm text-white font-mono space-y-3 pointer-events-auto max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest">Selected</div>
          <div className="text-base font-bold text-cyan-300 truncate">
            {satName || `NORAD ${selectedSatelliteId}`}
          </div>
        </div>
        <button
          className="text-white/40 hover:text-white text-xl leading-none w-6 h-6 flex items-center justify-center"
          onClick={() => useMissionStore.getState().setSelectedSatellite(null)}
          aria-label="Close panel"
        >
          ×
        </button>
      </div>

      {loading && <div className="text-white/40 text-center animate-pulse text-xs">Loading...</div>}

      {/* Eclipse status */}
      {eclipse !== null && (
        <div className={`text-[10px] px-2 py-1 rounded-full text-center border ${eclipseBadge}`}>
          {eclipse ? '🌑 IN ECLIPSE' : '☀️ IN SUNLIGHT'}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex border-b border-white/10">
        {tabBtn('telemetry', 'Telemetry')}
        {tabBtn('orbit', 'Orbit')}
      </div>

      {/* Telemetry tab */}
      {activeTab === 'telemetry' && (
        <TelemetryPanel noradId={selectedSatelliteId} />
      )}

      {/* Orbit tab */}
      {activeTab === 'orbit' && facts && (
        <div className="space-y-1 text-xs">
          <Row label="Type" value={facts.orbitType} />
          <Row label="Altitude" value={`${facts.altitudeKm.toLocaleString()} km`} />
          <Row label="Period" value={`${facts.periodMinutes} min`} />
          <Row label="Velocity" value={`${facts.velocityKms} km/s`} />
          <Row label="Inclination" value={`${facts.inclinationDeg}°`} />
          <Row label="Eccentricity" value={facts.eccentricity.toString()} />
          <Row label="SMA" value={`${facts.semiMajorAxisKm.toLocaleString()} km`} />

          {passes.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Next Passes (24h)</div>
              {passes.slice(0, 4).map((p, i) => (
                <div key={i} className="flex justify-between text-xs bg-white/5 rounded px-2 py-1 mb-1">
                  <span className="text-white/70">{new Date(p.aos).toUTCString().slice(17, 22)}Z</span>
                  <span className="text-green-400">{p.maxEl.toFixed(1)}° max</span>
                  <span className="text-white/50">{Math.round(p.duration)}s</span>
                </div>
              ))}
              {passes.length > 4 && (
                <div className="text-[10px] text-white/30 text-center">+{passes.length - 4} more passes</div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'orbit' && !facts && !loading && (
        <div className="text-xs text-white/30 text-center py-4">No orbit data</div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/50">{label}</span>
      <span className="text-white">{value}</span>
    </div>
  );
}
