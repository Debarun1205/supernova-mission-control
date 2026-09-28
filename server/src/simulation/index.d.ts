/**
 * Part 4 — Physics-consistent simulation engine
 * Runs at 1 Hz for each fleet satellite. Computes telemetry from real orbital state.
 */
import * as satellite from 'satellite.js';
interface SatState {
    noradId: number;
    name: string;
    satrec: satellite.SatRec;
    soc: number;
    batteryTemp: number;
    busTemp: number;
    payloadTemp: number;
    wheelRpm: [number, number, number];
    pointingError: number;
    seuCount: number;
    faults: Set<string>;
}
export declare function initSimulator(): Promise<void>;
export declare function simTick(simTimeMs?: number): void;
export declare function updateSpaceWeather(kp: number, xrayFlux: number, stormScale: number): void;
export declare function getSpaceWeather(): {
    kp: number;
    xrayFlux: number;
    stormScale: number;
};
export type FaultType = 'solar_flare' | 'battery_cell' | 'wheel_saturation' | 'star_tracker_loss' | 'thermal_runaway' | 'comms_dropout' | 'safe_mode';
export declare function injectFault(noradId: number, fault: FaultType): boolean;
export declare function clearFault(noradId: number, fault: FaultType): boolean;
export declare function getSatelliteState(noradId: number): SatState | undefined;
export {};
//# sourceMappingURL=index.d.ts.map