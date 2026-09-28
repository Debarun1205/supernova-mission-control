import React, { useEffect, useState } from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import axios from 'axios';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const API = 'http://localhost:3000/api';

interface AlertDoc {
  _id: string;
  satelliteId: number;
  type: string;
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  status: 'open' | 'acknowledged' | 'resolved';
  createdAt: string;
  evidence: any[];
  incidentId?: string;
}

const SEV_COLORS = {
  warning: { badge: 'bg-yellow-900/60 text-yellow-300 border-yellow-500/40', border: 'border-yellow-500/20' },
  critical: { badge: 'bg-red-900/60 text-red-300 border-red-500/40', border: 'border-red-500/30' },
};

export function AlertCenter() {
  const [alerts, setAlerts] = useState<AlertDoc[]>([]);
  const [sevFilter, setSevFilter] = useState<'all' | 'warning' | 'critical'>('all');
  const [statusFilter, setStatusFilter] = useState<'open' | 'all'>('open');
  const [satFilter, setSatFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const fetchAlerts = () => {
    const params: Record<string, string> = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (satFilter !== 'all') params.satelliteId = satFilter;
    axios.get(`${API}/alerts`, { params }).then((res) => {
      setAlerts(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAlerts();
    const iv = setInterval(fetchAlerts, 3000);
    return () => clearInterval(iv);
  }, [sevFilter, statusFilter, satFilter]);

  const filtered = sevFilter === 'all' ? alerts : alerts.filter((a) => a.severity === sevFilter);

  const ack = async (id: string) => {
    await axios.patch(`${API}/alerts/${id}/acknowledge`);
    fetchAlerts();
  };
  const resolve = async (id: string) => {
    await axios.patch(`${API}/alerts/${id}/resolve`);
    fetchAlerts();
  };

  const openCount = alerts.filter((a) => a.status === 'open').length;
  const critCount = alerts.filter((a) => a.severity === 'critical' && a.status === 'open').length;
  const uniqueSats = [...new Set(alerts.map((a) => String(a.satelliteId)))];

  return (
    <div className="min-h-screen bg-abyss text-starlight font-sans p-6">
      {/* aria-live region for screen reader announcements */}
      <div aria-live="assertive" aria-atomic="true" className="sr-only" id="alert-live-region" />

      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-ion tracking-wide uppercase">Alert Center</h1>
            <p className="text-xs text-dust font-mono mt-1">
              {openCount} open · {critCount} critical
            </p>
          </div>
          <a href="/" className="text-xs font-mono text-white/40 hover:text-white transition-colors">
            ← Globe
          </a>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Severity */}
          <div className="flex gap-1 bg-black/40 border border-white/10 rounded-lg p-1">
            {(['all', 'warning', 'critical'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSevFilter(s)}
                className={
                  sevFilter === s
                    ? 'px-3 py-1 rounded text-xs font-mono bg-white/10 text-white'
                    : 'px-3 py-1 rounded text-xs font-mono text-white/40 hover:text-white/70'
                }
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Status */}
          <div className="flex gap-1 bg-black/40 border border-white/10 rounded-lg p-1">
            {(['open', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={
                  statusFilter === s
                    ? 'px-3 py-1 rounded text-xs font-mono bg-white/10 text-white'
                    : 'px-3 py-1 rounded text-xs font-mono text-white/40 hover:text-white/70'
                }
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Satellite filter */}
          <select
            className="bg-black/40 border border-white/10 rounded-lg px-3 py-1 text-xs font-mono text-white/70"
            value={satFilter}
            onChange={(e) => setSatFilter(e.target.value)}
          >
            <option value="all">All Satellites</option>
            {uniqueSats.map((s) => (
              <option key={s} value={s}>NORAD {s}</option>
            ))}
          </select>
        </div>

        {/* Alert list */}
        {loading && <div className="text-white/30 animate-pulse text-sm font-mono">Loading alerts...</div>}

        {!loading && filtered.length === 0 && (
          <div className="text-center text-white/20 py-12 font-mono text-sm">
            ✓ No alerts match current filters
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((alert) => {
            const sc = SEV_COLORS[alert.severity];
            const evidenceSoc = alert.evidence?.[0]?.power?.soc;
            const miniData = evidenceSoc !== undefined ? [{ v: evidenceSoc }] : [];

            return (
              <div
                key={alert._id}
                className={`bg-black/60 backdrop-blur border ${sc.border} rounded-xl p-4 space-y-2`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Severity badge + message */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono uppercase ${sc.badge}`}>
                        {alert.severity}
                      </span>
                      {alert.status !== 'open' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-white/30 font-mono uppercase">
                          {alert.status}
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-white/30">NORAD {alert.satelliteId}</span>
                      {alert.incidentId && (
                        <span className="text-[10px] font-mono text-purple-400 border border-purple-500/30 px-1 rounded">
                          INC
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white mt-1">{alert.message}</p>
                    <p className="text-[10px] text-white/30 font-mono mt-0.5">
                      {new Date(alert.createdAt).toUTCString()}
                    </p>
                  </div>

                  {/* Evidence mini-chart */}
                  {miniData.length > 0 && (
                    <div className="flex-shrink-0 w-16 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={miniData}>
                          <Line dataKey="v" stroke={alert.severity === 'critical' ? '#FF4D6D' : '#FFB347'} dot={false} strokeWidth={1.5} isAnimationActive={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {alert.status === 'open' && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => ack(alert._id)}
                      className="text-xs font-mono px-3 py-1 rounded border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => resolve(alert._id)}
                      className="text-xs font-mono px-3 py-1 rounded border border-green-500/30 text-green-400 hover:bg-green-900/30 transition-colors"
                    >
                      Resolve
                    </button>
                    <button
                      onClick={() => useMissionStore.getState().setSelectedSatellite(alert.satelliteId)}
                      className="text-xs font-mono px-3 py-1 rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-900/30 transition-colors"
                    >
                      Focus Satellite
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
