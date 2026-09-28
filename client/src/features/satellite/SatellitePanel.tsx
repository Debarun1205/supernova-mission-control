import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useMissionStore } from '../../store/useMissionStore';

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

  useEffect(() => {
    if (!selectedSatelliteId) {
      setFacts(null);
      setPasses([]);
      setEclipse(null);
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
        setPasses(passesRes.data.passes || []);
        setEclipse(eclipseRes.data.inEclipse);
      })
      .catch(() => {
        // server may not be up yet
      })
      .finally(() => setLoading(false));
  }, [selectedSatelliteId]);

  if (!selectedSatelliteId) return null;

  const badgeCls = eclipse
    ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-500/40'
    : 'bg-yellow-900/60 text-yellow-300 border border-yellow-500/40';

  return (
    <div className="absolute top-4 right-4 w-72 z-10 bg-black/80 backdrop-blur border border-white/10 rounded-xl p-4 text-sm text-white font-mono space-y-4 pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-white/50 uppercase tracking-widest">Selected</div>
          <div className="text-base font-bold text-cyan-300 truncate">{satName || `NORAD ${selectedSatelliteId}`}</div>
        </div>
        <button
          className="text-white/40 hover:text-white text-lg leading-none"
          onClick={() => useMissionStore.getState().setSelectedSatellite(null)}
        >
          ×
        </button>
      </div>

      {loading && <div className="text-white/40 text-center animate-pulse">Loading...</div>}

      {/* Eclipse status */}
      {eclipse !== null && (
        <div className={`text-xs px-2 py-1 rounded-full text-center ${badgeCls}`}>
          {eclipse ? '🌑 IN ECLIPSE' : '☀️ IN SUNLIGHT'}
        </div>
      )}

      {/* Orbit facts */}
      {facts && (
        <div className="space-y-1">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-1">Orbit Facts</div>
          <Row label="Type" value={facts.orbitType} />
          <Row label="Alt" value={`${facts.altitudeKm.toLocaleString()} km`} />
          <Row label="Period" value={`${facts.periodMinutes} min`} />
          <Row label="Velocity" value={`${facts.velocityKms} km/s`} />
          <Row label="Incl." value={`${facts.inclinationDeg}°`} />
          <Row label="Ecc." value={facts.eccentricity.toString()} />
          <Row label="SMA" value={`${facts.semiMajorAxisKm.toLocaleString()} km`} />
        </div>
      )}

      {/* Next passes */}
      {passes.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-white/40 uppercase tracking-widest mb-1">
            Next Passes (24h)
          </div>
          {passes.slice(0, 4).map((p, i) => (
            <div key={i} className="flex justify-between text-xs bg-white/5 rounded px-2 py-1">
              <span className="text-white/70">
                {new Date(p.aos).toUTCString().slice(17, 22)}Z
              </span>
              <span className="text-green-400">{p.maxEl.toFixed(1)}° max</span>
              <span className="text-white/50">{Math.round(p.duration)}s</span>
            </div>
          ))}
          {passes.length > 4 && (
            <div className="text-xs text-white/30 text-center">
              +{passes.length - 4} more passes
            </div>
          )}
        </div>
      )}

      {!loading && passes.length === 0 && facts && (
        <div className="text-xs text-white/30 text-center">No passes in next 24h</div>
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
