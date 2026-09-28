import React from 'react';
import { useMissionStore } from '../../store/useMissionStore';

const KP_LABEL: Record<number, string> = {
  0: 'Quiet', 1: 'Quiet', 2: 'Quiet', 3: 'Unsettled',
  4: 'Active', 5: 'Minor Storm', 6: 'Moderate Storm',
  7: 'Strong Storm', 8: 'Severe Storm', 9: 'Extreme Storm',
};

const KP_COLOR: Record<string, string> = {
  Quiet: 'text-green-400',
  Unsettled: 'text-yellow-300',
  Active: 'text-orange-400',
  'Minor Storm': 'text-orange-500',
  'Moderate Storm': 'text-red-400',
  'Strong Storm': 'text-red-500',
  'Severe Storm': 'text-red-600',
  'Extreme Storm': 'text-red-700',
};

function xrayClass(flux: number): string {
  if (flux >= 1e-3) return 'X-Class';
  if (flux >= 1e-4) return 'M-Class';
  if (flux >= 1e-5) return 'C-Class';
  if (flux >= 1e-6) return 'B-Class';
  return 'A-Class';
}

export function SpaceWeatherWidget() {
  const weather = useMissionStore((s) => s.spaceWeather);

  if (!weather) {
    return (
      <div className="bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-xs font-mono text-white/30">
        Space weather loading...
      </div>
    );
  }

  const kpInt = Math.round(weather.kp);
  const label = KP_LABEL[Math.min(kpInt, 9)] ?? 'Extreme Storm';
  const colorCls = KP_COLOR[label] ?? 'text-red-700';
  const xray = xrayClass(weather.xrayFlux);
  const barWidth = Math.min((weather.kp / 9) * 100, 100);

  return (
    <div className="bg-black/70 backdrop-blur border border-white/10 rounded-lg px-4 py-3 text-xs font-mono space-y-2 min-w-[180px]">
      <div className="text-white/40 uppercase tracking-widest text-[10px]">Space Weather</div>

      {/* Kp bar */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-white/60">Kp Index</span>
          <span className={colorCls + ' font-bold'}>{weather.kp.toFixed(1)} — {label}</span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 rounded-full transition-all duration-500"
            style={{ width: barWidth + '%' }}
          />
        </div>
      </div>

      {/* X-ray flare */}
      <div className="flex justify-between">
        <span className="text-white/60">Solar Flare</span>
        <span className={weather.xrayFlux >= 1e-5 ? 'text-orange-400 font-bold' : 'text-white/70'}>
          {xray}
        </span>
      </div>

      {/* G-storm scale */}
      {weather.stormScale > 0 && (
        <div className="flex justify-between">
          <span className="text-white/60">G-Storm</span>
          <span className="text-red-400 font-bold">G{weather.stormScale}</span>
        </div>
      )}

      {weather.kp >= 5 && (
        <div className="text-orange-400 text-[10px] pt-1 border-t border-white/10">
          ⚠ Elevated radiation — comms noise increased
        </div>
      )}
    </div>
  );
}
