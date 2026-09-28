import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { GlobalHeader } from '../../components/GlobalHeader';
import { TelemetryPanel } from '../telemetry/TelemetryPanel';

const API = 'http://localhost:3000/api';

export function SatelliteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const noradId = Number(id);

  const [satellite, setSatellite] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'orbit' | 'passes' | 'alerts'>('overview');
  const [passes, setPasses] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    if (!noradId) return;

    axios.get(`${API}/satellites/${noradId}`).then((res) => setSatellite(res.data)).catch(() => {});
    axios.get(`${API}/satellites/${noradId}/passes?hours=48`).then((res) => setPasses(res.data.passes ?? [])).catch(() => {});
    axios.get(`${API}/alerts?satelliteId=${noradId}`).then((res) => setAlerts(res.data)).catch(() => {});
  }, [noradId]);

  if (!satellite) {
    return (
      <div className="min-h-screen bg-abyss text-starlight font-sans">
        <GlobalHeader />
        <div className="text-center font-mono py-20 text-white/40 text-sm animate-pulse">
          Loading satellite NORAD {noradId}...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-abyss text-starlight font-sans">
      <GlobalHeader />

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start font-mono">
          <div>
            <Link to="/satellites" className="text-xs text-white/40 hover:text-white">← Explorer</Link>
            <h1 className="text-3xl font-display font-bold text-ion uppercase tracking-wide mt-1">
              {satellite.name}
            </h1>
            <p className="text-xs text-dust">NORAD Catalog ID: {satellite.noradId}</p>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full border uppercase ${
              satellite.health === 'critical'
                ? 'bg-red-900/60 text-red-300 border-red-500/30'
                : satellite.health === 'warning'
                ? 'bg-yellow-900/60 text-yellow-300 border-yellow-500/30'
                : 'bg-green-900/60 text-green-300 border-green-500/30'
            }`}
          >
            {satellite.health}
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 font-mono text-xs">
          {(['overview', 'telemetry', 'orbit', 'passes', 'alerts'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={
                activeTab === t
                  ? 'px-4 py-2 border-b-2 border-cyan-400 text-cyan-300 uppercase font-bold'
                  : 'px-4 py-2 text-white/40 hover:text-white uppercase transition-colors'
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="bg-black/60 backdrop-blur border border-white/10 rounded-2xl p-6 font-mono">
          {activeTab === 'overview' && (
            <div className="space-y-4 text-xs">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Subsystem Status</h2>
              <TelemetryPanel noradId={noradId} />
            </div>
          )}

          {activeTab === 'telemetry' && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Live Subsystem Telemetry
              </h2>
              <TelemetryPanel noradId={noradId} />
            </div>
          )}

          {activeTab === 'passes' && (
            <div className="space-y-3 text-xs">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Predicted Ground Station Passes (48h)</h2>
              {passes.length === 0 ? (
                <div className="text-white/30 text-center py-6">No pass predictions available</div>
              ) : (
                passes.map((p, idx) => (
                  <div key={idx} className="flex justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                    <div>
                      <div className="font-bold text-white">AOS: {new Date(p.aos).toUTCString()}</div>
                      <div className="text-white/40 text-[10px]">LOS: {new Date(p.los).toUTCString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">{p.maxEl.toFixed(1)}° Max Elevation</div>
                      <div className="text-white/50 text-[10px]">{Math.round(p.duration)}s Duration</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-3 text-xs">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Alert History</h2>
              {alerts.length === 0 ? (
                <div className="text-white/30 text-center py-6">✓ No alerts recorded for this satellite</div>
              ) : (
                alerts.map((a) => (
                  <div key={a._id} className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-white">{a.message}</span>
                      <span className="text-[10px] uppercase text-white/40">{a.status}</span>
                    </div>
                    <div className="text-[10px] text-white/30">{new Date(a.createdAt).toUTCString()}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
