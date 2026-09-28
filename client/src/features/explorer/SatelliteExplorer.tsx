import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { GlobalHeader } from '../../components/GlobalHeader';

const API = 'http://localhost:3000/api';

interface SatItem {
  noradId: number;
  name: string;
  tier: string;
  health: 'nominal' | 'warning' | 'critical';
}

export function SatelliteExplorer() {
  const [satellites, setSatellites] = useState<SatItem[]>([]);
  const [query, setQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState<'all' | 'nominal' | 'warning' | 'critical'>('all');
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/satellites`).then((res) => {
      setSatellites(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = satellites.filter((s) => {
    const matchesQ = s.name.toLowerCase().includes(query.toLowerCase()) || String(s.noradId).includes(query);
    const matchesH = healthFilter === 'all' || s.health === healthFilter;
    return matchesQ && matchesH;
  });

  const toggleCompare = (id: number) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare(selectedForCompare.filter((i) => i !== id));
    } else {
      if (selectedForCompare.length < 3) {
        setSelectedForCompare([...selectedForCompare, id]);
      } else {
        alert('You can compare up to 3 satellites at once.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-abyss text-starlight font-sans">
      <GlobalHeader />

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-display font-bold text-ion tracking-wide uppercase">
              Satellite Explorer
            </h1>
            <p className="text-xs text-dust font-mono mt-1">
              Browse tracked objects, filter by status, or select up to 3 satellites for comparison.
            </p>
          </div>
          {selectedForCompare.length > 0 && (
            <div className="bg-cyan-950/60 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-2">
              <span>Compare ({selectedForCompare.length}/3): NORAD {selectedForCompare.join(', ')}</span>
              <button
                onClick={() => setSelectedForCompare([])}
                className="text-white/40 hover:text-white"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap gap-4 bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-xs">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search satellite name or NORAD ID..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
          />

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
            {(['all', 'nominal', 'warning', 'critical'] as const).map((h) => (
              <button
                key={h}
                onClick={() => setHealthFilter(h)}
                className={
                  healthFilter === h
                    ? 'px-3 py-1 rounded bg-white/10 text-white font-bold uppercase'
                    : 'px-3 py-1 rounded text-white/40 hover:text-white uppercase transition-colors'
                }
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of satellites */}
        {loading && <div className="text-white/30 text-center font-mono py-12 text-sm animate-pulse">Loading fleet catalogue...</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map((sat) => {
            const isComparing = selectedForCompare.includes(sat.noradId);
            const badgeCls =
              sat.health === 'critical'
                ? 'bg-red-900/60 text-red-300 border-red-500/30'
                : sat.health === 'warning'
                ? 'bg-yellow-900/60 text-yellow-300 border-yellow-500/30'
                : 'bg-green-900/60 text-green-300 border-green-500/30';

            return (
              <div
                key={sat.noradId}
                className={`bg-black/60 backdrop-blur border rounded-xl p-4 font-mono space-y-3 transition-all ${
                  isComparing ? 'border-cyan-400 bg-cyan-950/20' : 'border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-base">{sat.name}</h3>
                    <p className="text-[10px] text-white/40">NORAD {sat.noradId} · Tier: {sat.tier}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase ${badgeCls}`}>
                    {sat.health}
                  </span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/10 text-xs">
                  <a
                    href={`/satellites/${sat.noradId}`}
                    className="flex-1 text-center py-1.5 rounded bg-white/5 hover:bg-white/10 border border-white/20 text-white transition-colors"
                  >
                    View Details
                  </a>
                  <button
                    onClick={() => toggleCompare(sat.noradId)}
                    className={
                      isComparing
                        ? 'px-3 py-1.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'px-3 py-1.5 rounded bg-white/5 text-white/40 border border-white/10 hover:text-white'
                    }
                  >
                    {isComparing ? '✓ Comparing' : '+ Compare'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
