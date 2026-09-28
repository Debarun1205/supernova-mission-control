/**
 * Shared physics constants and types for Part 4.
 * Used by both server simulation and client display.
 */
export declare const EARTH_RADIUS_KM = 6371;
/** South Atlantic Anomaly bounding polygon (approximate) */
export declare const SAA_POLYGON: Array<[number, number]>;
export type SatMode = 'nominal' | 'safe' | 'eclipse' | 'contact' | 'payload_ops';
export interface PowerState {
    soc: number;
    solarCurrent: number;
    busVoltage: number;
}
export interface ThermalState {
    batteryTemp: number;
    busTemp: number;
    payloadTemp: number;
}
export interface CommsState {
    signalStrength: number;
    connectedStation: string;
    linkQuality: number;
    rangeKm: number;
}
export interface AdcsState {
    pointingError: number;
    wheelSpeedRPM: number[];
    angularRateDps: number;
}
export interface RadiationState {
    seuCount: number;
    inSaa: boolean;
    doserate: number;
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
    healthScore: number;
}
/** Power loads per mode (W) */
export declare const MODE_LOAD_W: Record<SatMode, number>;
/** Check if a lat/lon point is inside the SAA polygon (ray-casting) */
export declare function isInSaa(lat: number, lon: number): boolean;
/** Clamp a value between min and max */
export declare function clamp(v: number, min: number, max: number): number;
/** Compute free-space path loss (dB) */
export declare function fspl(rangeKm: number, freqMHz?: number): number;
//# sourceMappingURL=index.d.ts.map