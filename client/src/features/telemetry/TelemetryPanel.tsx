import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { subscribeToSatellite } from '../../hooks/useTelemetrySocket';
import { useMissionStore } from '../../store/useMissionStore';

interface DataPoint {
  time: string;
  soc: number;
  battTemp: number;
  signalStr: number;
  pointingErr: number;
  healthScore: number;
}

const MAX_POINTS = 60;

function safeNum(v: unknown): number {
  return typeof v === 'number' && isFinite(v) ? v : 0;
}

export function TelemetryPanel({ noradId }: { noradId: number }) {
  const [history, setHistory] = useState<DataPoint[]>([]);
  const [latest, setLatest] = useState<any>(null);

  const handleSample = useCallback((sample: any) => {
    if (!sample || sample.satelliteId !== noradId) return;
    setLatest(sample);
    setHistory((prev) => {
      const pt: DataPoint = {
        time: new Date(sample.ts).toUTCString().slice(17, 22),
        soc: safeNum(sample.power?.soc),
        battTemp: safeNum(sample.thermal?.batteryTemp),
        signalStr: safeNum(sample.comms?.signalStrength),
        pointingErr: safeNum(sample.adcs?.pointingError),
        healthScore: safeNum(sample.healthScore),
      };
      return [...prev.slice(-MAX_POINTS + 1), pt];
    });
  }, [noradId]);

  // Also sync from Zustand store (batch updates)
  const storeSample = useMissionStore((s) => s.latestTelemetry[noradId]);
  useEffect(() => {
    if (storeSample) handleSample(storeSample);
  }, [storeSample, handleSample]);

  // Subscribe to high-rate per-satellite room
  useEffect(() => {
    const unsub = subscribeToSatellite(noradId, handleSample);
    return unsub;
  }, [noradId, handleSample]);

  const modeBadge = (mode: string) => {
    const colors: Record<string, string> = {
      nominal: 'bg-green-900/60 text-green-400 border-green-500/30',
      eclipse: 'bg-indigo-900/60 text-indigo-300 border-indigo-500/30',
      contact: 'bg-cyan-900/60 text-cyan-300 border-cyan-500/30',
      safe: 'bg-orange-900/60 text-orange-300 border-orange-500/30',
      payload_ops: 'bg-purple-900/60 text-purple-300 border-purple-500/30',
    };
    return colors[mode] ?? 'bg-white/10 text-white border-white/20';
  };

  return (
    <div className="space-y-3 text-xs font-mono">
      {/* Mode + health */}
      {latest && (
        <div className="flex items-center justify-between">
          <span className={`px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider ${modeBadge(latest.mode)}`}>
            {latest.mode}
          </span>
          <div className="flex items-center gap-1">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-green-500"
              style={{ width: '60px' }}
            />
            <span className="text-white/70">{latest.healthScore}</span>
          </div>
        </div>
      )}

      {/* Quick stats */}
      {latest && (
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Battery" value={latest.power?.soc?.toFixed(1) + ' %'} warn={latest.power?.soc < 25} />
          <Stat label="Batt Temp" value={latest.thermal?.batteryTemp?.toFixed(1) + ' °C'} warn={latest.thermal?.batteryTemp > 40} />
          <Stat label="Contact" value={latest.comms?.connectedStation ?? '—'} />
          <Stat label="Pointing" value={latest.adcs?.pointingError?.toFixed(2) + ' °'} warn={latest.adcs?.pointingError > 3} />
          <Stat label="Bus V" value={latest.power?.busVoltage?.toFixed(1) + ' V'} />
          <Stat label="SEU" value={String(latest.radiation?.seuCount ?? 0)} warn={latest.radiation?.inSaa} />
        </div>
      )}

      {/* Battery SOC chart */}
      {history.length > 2 && (
        <div>
          <div className="text-white/40 mb-1 text-[10px] uppercase tracking-widest">Battery SOC (%)</div>
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={history} margin={{ top: 2, right: 4, bottom: 2, left: -20 }}>
              <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#555' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#0a0f1e', border: '1px solid #1a2845', borderRadius: 6, fontSize: 10 }}
                labelStyle={{ color: '#88a0c0' }}
              />
              <ReferenceLine y={25} stroke="#FF4D6D" strokeDasharray="3 3" />
              <ReferenceLine y={10} stroke="#FF0000" strokeDasharray="3 3" />
              <Line type="monotone" dataKey="soc" stroke="#5CE1FF" dot={false} strokeWidth={1.5} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Health score sparkline */}
      {history.length > 2 && (
        <div>
          <div className="text-white/40 mb-1 text-[10px] uppercase tracking-widest">Health Score</div>
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={history} margin={{ top: 2, right: 4, bottom: 2, left: -20 }}>
              <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: '#555' }} tickLine={false} axisLine={false} />
              <Line type="monotone" dataKey="healthScore" stroke="#48E5A8" dot={false} strokeWidth={1.5} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {!latest && (
        <div className="text-white/30 text-center py-4 animate-pulse">
          Waiting for telemetry...
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex justify-between bg-white/5 rounded px-2 py-1">
      <span className="text-white/50">{label}</span>
      <span className={warn ? 'text-orange-400 font-bold' : 'text-white'}>{value}</span>
    </div>
  );
}
