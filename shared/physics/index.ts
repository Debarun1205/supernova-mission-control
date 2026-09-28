/**
 * Shared physics constants and types for Part 4.
 * Used by both server simulation and client display.
 */

export const EARTH_RADIUS_KM = 6371;

/** South Atlantic Anomaly bounding polygon (approximate) */
export const SAA_POLYGON: Array<[number, number]> = [
  [-90, -20], [-90, -60], [-30, -60], [10, -20], [10, 0], [-50, 0], [-90, -20],
];

export type SatMode = 'nominal' | 'safe' | 'eclipse' | 'contact' | 'payload_ops';

export interface PowerState {
  soc: number;        // State of charge 0-100 %
  solarCurrent: number; // Amps from solar array
  busVoltage: number;   // Bus voltage (V)
}

export interface ThermalState {
  batteryTemp: number;  // °C
  busTemp: number;      // °C
  payloadTemp: number;  // °C
}

export interface CommsState {
  signalStrength: number;   // dBm
  connectedStation: string; // station name or 'none'
  linkQuality: number;      // 0-1
  rangeKm: number;
}

export interface AdcsState {
  pointingError: number;    // degrees
  wheelSpeedRPM: number[];  // 3 wheels
  angularRateDps: number;   // deg/s
}

export interface RadiationState {
  seuCount: number;         // cumulative SEU count
  inSaa: boolean;
  doserate: number;         // mrad/h
}

export interface TelemetrySample {
  ts: Date;
  satelliteId: number;
  power: PowerState;
  thermal: ThermalState;
  comms: CommsState;
  adcs: AdcsState;
  radiation: RadiationState;
  mode: SatMode;
  healthScore: number;      // 0-100
}

/** Power loads per mode (W) */
export const MODE_LOAD_W: Record<SatMode, number> = {
  nominal: 180,
  safe: 80,
  eclipse: 160,
  contact: 220,
  payload_ops: 280,
};

/** Check if a lat/lon point is inside the SAA polygon (ray-casting) */
export function isInSaa(lat: number, lon: number): boolean {
  const poly = SAA_POLYGON;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect =
      yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Clamp a value between min and max */
export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/** Compute free-space path loss (dB) */
export function fspl(rangeKm: number, freqMHz = 437): number {
  return 20 * Math.log10(rangeKm) + 20 * Math.log10(freqMHz) + 32.45;
}
