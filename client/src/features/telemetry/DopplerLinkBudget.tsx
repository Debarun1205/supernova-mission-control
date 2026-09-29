import React from 'react';

interface DopplerProps {
  rangeKm: number;
  velocityKms: number;
  freqMHz?: number;
  txPowerW?: number;
}

export function DopplerLinkBudget({
  rangeKm,
  velocityKms,
  freqMHz = 437.5, // UHF satellite frequency
  txPowerW = 2.0,   // 2 Watt transmitter
}: DopplerProps) {
  const SPEED_OF_LIGHT_KMS = 299792.458;

  // Radial velocity estimate (assuming approaching/receding up to velocityKms)
  const maxDopplerShiftHz = (velocityKms / SPEED_OF_LIGHT_KMS) * (freqMHz * 1e6);

  // Free-Space Path Loss: FSPL (dB) = 20*log10(d_km) + 20*log10(f_MHz) + 32.45
  const fsplDb = 20 * Math.log10(Math.max(rangeKm, 100)) + 20 * Math.log10(freqMHz) + 32.45;

  // Transmitter power in dBm: 10 * log10(P_mW)
  const txPowerDbm = 10 * Math.log10(txPowerW * 1000); // 33 dBm for 2W

  // Simple link budget: Tx Power + Tx Antenna Gain (3 dBi) - FSPL + Rx Antenna Gain (12 dBi)
  const rxPowerDbm = txPowerDbm + 3 - fsplDb + 12;

  // Thermal noise floor for 12.5 kHz bandwidth at 290K = -133 dBm
  const noiseFloorDbm = -133;
  const snrDb = rxPowerDbm - noiseFloorDbm;

  return (
    <div className="bg-black/60 border border-cyan-500/30 rounded-xl p-4 font-mono text-xs space-y-3">
      <div className="flex justify-between items-center border-b border-white/10 pb-2">
        <span className="font-bold text-cyan-300 uppercase text-[10px] tracking-widest">
          📡 Doppler & Link Budget Calculator
        </span>
        <span className="text-[10px] text-white/40">{freqMHz} MHz UHF</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white/5 p-2 rounded">
          <div className="text-white/40 text-[10px]">Range</div>
          <div className="text-white font-bold text-sm">{rangeKm.toLocaleString()} km</div>
        </div>
        <div className="bg-white/5 p-2 rounded">
          <div className="text-white/40 text-[10px]">Max Doppler Shift</div>
          <div className="text-cyan-300 font-bold text-sm">±{(maxDopplerShiftHz / 1000).toFixed(2)} kHz</div>
        </div>
        <div className="bg-white/5 p-2 rounded">
          <div className="text-white/40 text-[10px]">FSPL Loss</div>
          <div className="text-yellow-400 font-bold text-sm">-{fsplDb.toFixed(1)} dB</div>
        </div>
        <div className="bg-white/5 p-2 rounded">
          <div className="text-white/40 text-[10px]">Est. Signal SNR</div>
          <div className={snrDb > 10 ? 'text-green-400 font-bold text-sm' : 'text-red-400 font-bold text-sm'}>
            {snrDb.toFixed(1)} dB {snrDb > 10 ? '(STRONG)' : '(WEAK)'}
          </div>
        </div>
      </div>
    </div>
  );
}
