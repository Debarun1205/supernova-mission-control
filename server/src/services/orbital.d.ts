/**
 * Part 3: Orbital Intelligence Engine
 * Sun position, eclipse detection, pass prediction, conjunction screening
 */
import * as satellite from 'satellite.js';
export declare function getSunPositionEci(date: Date): {
    x: number;
    y: number;
    z: number;
};
export declare function isInEclipse(satPos: {
    x: number;
    y: number;
    z: number;
}, sunPos: {
    x: number;
    y: number;
    z: number;
}): boolean;
export interface Pass {
    aos: Date;
    los: Date;
    maxEl: number;
    maxElTime: Date;
    duration: number;
}
export interface GroundStationInput {
    lat: number;
    lon: number;
    elevationMask: number;
}
export declare function predictPasses(satrec: satellite.SatRec, gs: GroundStationInput, startDate: Date, durationHours?: number, stepSeconds?: number): Pass[];
export interface Conjunction {
    sat1: number;
    sat2: number;
    tca: Date;
    distance: number;
}
export declare function screenConjunctions(sats: Array<{
    noradId: number;
    satrec: satellite.SatRec;
}>, date: Date, thresholdKm?: number): Conjunction[];
export interface OrbitFacts {
    semiMajorAxisKm: number;
    eccentricity: number;
    inclinationDeg: number;
    periodMinutes: number;
    altitudeKm: number;
    velocityKms: number;
    orbitType: 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'Deep Space';
}
export declare function getOrbitFacts(satrec: satellite.SatRec): OrbitFacts;
//# sourceMappingURL=orbital.d.ts.map