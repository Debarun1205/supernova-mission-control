"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSunPositionEci = getSunPositionEci;
exports.isInEclipse = isInEclipse;
exports.predictPasses = predictPasses;
exports.screenConjunctions = screenConjunctions;
exports.getOrbitFacts = getOrbitFacts;
/**
 * Part 3: Orbital Intelligence Engine
 * Sun position, eclipse detection, pass prediction, conjunction screening
 */
const satellite = __importStar(require("satellite.js"));
const EARTH_RADIUS_KM = 6371;
const AU_KM = 149_597_870.7;
// ─── Sun Position (low-precision, good to ~1°) ────────────────────────────────
function getSunPositionEci(date) {
    const JD = date.getTime() / 86_400_000 + 2_440_587.5;
    const T = (JD - 2_451_545.0) / 36_525;
    const L0 = (280.46646 + 36000.76983 * T) % 360;
    const M = ((357.52911 + 35999.05029 * T - 0.0001537 * T * T) * Math.PI) / 180;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
        (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
        0.000289 * Math.sin(3 * M);
    const sunLon = ((L0 + C) * Math.PI) / 180;
    const e = ((23.439291 - 0.013004 * T) * Math.PI) / 180;
    const distAU = 1.000001018 * (1 - 0.01671123 ** 2) / (1 + 0.01671123 * Math.cos(M - (102.93768 * Math.PI) / 180));
    const distKm = distAU * AU_KM;
    return {
        x: distKm * Math.cos(sunLon),
        y: distKm * Math.sin(sunLon) * Math.cos(e),
        z: distKm * Math.sin(sunLon) * Math.sin(e),
    };
}
// ─── Eclipse check ────────────────────────────────────────────────────────────
function isInEclipse(satPos, sunPos) {
    // Project satellite onto Sun-Earth axis
    const sunMag = Math.sqrt(sunPos.x ** 2 + sunPos.y ** 2 + sunPos.z ** 2);
    const dot = (satPos.x * sunPos.x + satPos.y * sunPos.y + satPos.z * sunPos.z) / sunMag;
    if (dot > 0)
        return false; // Satellite is on sun side of Earth
    // Perpendicular distance from Earth-Sun line
    const perpX = satPos.x - (dot * sunPos.x) / sunMag;
    const perpY = satPos.y - (dot * sunPos.y) / sunMag;
    const perpZ = satPos.z - (dot * sunPos.z) / sunMag;
    const perpDist = Math.sqrt(perpX ** 2 + perpY ** 2 + perpZ ** 2);
    return perpDist < EARTH_RADIUS_KM;
}
function predictPasses(satrec, gs, startDate, durationHours = 24, stepSeconds = 10) {
    const passes = [];
    const obsGd = {
        latitude: satellite.degreesToRadians(gs.lat),
        longitude: satellite.degreesToRadians(gs.lon),
        height: 0.01, // km above ellipsoid
    };
    let inPass = false;
    let passStart = null;
    let maxEl = 0;
    let maxElTime = null;
    const steps = Math.floor((durationHours * 3600) / stepSeconds);
    for (let i = 0; i <= steps; i++) {
        const t = new Date(startDate.getTime() + i * stepSeconds * 1000);
        const pv = satellite.propagate(satrec, t);
        if (!pv.position || typeof pv.position === 'boolean')
            continue;
        const gmst = satellite.gstime(t);
        const ecf = satellite.eciToEcf(pv.position, gmst);
        const look = satellite.ecfToLookAngles(obsGd, ecf);
        const elDeg = satellite.radiansToDegrees(look.elevation);
        if (elDeg >= gs.elevationMask) {
            if (!inPass) {
                inPass = true;
                passStart = t;
                maxEl = elDeg;
                maxElTime = t;
            }
            else if (elDeg > maxEl) {
                maxEl = elDeg;
                maxElTime = t;
            }
        }
        else if (inPass) {
            inPass = false;
            if (passStart && maxElTime) {
                const los = t;
                passes.push({
                    aos: passStart,
                    los,
                    maxEl,
                    maxElTime,
                    duration: (los.getTime() - passStart.getTime()) / 1000,
                });
            }
        }
    }
    return passes;
}
function screenConjunctions(sats, date, thresholdKm = 20) {
    const conjunctions = [];
    const positions = [];
    for (const sat of sats) {
        const pv = satellite.propagate(sat.satrec, date);
        if (pv.position && typeof pv.position !== 'boolean') {
            positions.push({ noradId: sat.noradId, pos: pv.position });
        }
    }
    for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
            const p1 = positions[i].pos;
            const p2 = positions[j].pos;
            const dist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + (p1.z - p2.z) ** 2);
            if (dist < thresholdKm) {
                conjunctions.push({
                    sat1: positions[i].noradId,
                    sat2: positions[j].noradId,
                    tca: date,
                    distance: dist,
                });
            }
        }
    }
    return conjunctions;
}
function getOrbitFacts(satrec) {
    const MU = 398600.4418; // km³/s²
    const meanMotionRadS = (satrec.no * 2 * Math.PI) / 86400; // rad/s
    const semiMajorAxisKm = Math.cbrt(MU / meanMotionRadS ** 2);
    const altitudeKm = semiMajorAxisKm - EARTH_RADIUS_KM;
    const periodMinutes = (2 * Math.PI) / meanMotionRadS / 60;
    const velocityKms = Math.sqrt(MU / semiMajorAxisKm);
    let orbitType;
    if (altitudeKm < 2000)
        orbitType = 'LEO';
    else if (altitudeKm < 35_000)
        orbitType = 'MEO';
    else if (altitudeKm < 36_100)
        orbitType = 'GEO';
    else if (satrec.ecco > 0.3)
        orbitType = 'HEO';
    else
        orbitType = 'Deep Space';
    return {
        semiMajorAxisKm: +semiMajorAxisKm.toFixed(1),
        eccentricity: +satrec.ecco.toFixed(6),
        inclinationDeg: +(satrec.inclo * (180 / Math.PI)).toFixed(2),
        periodMinutes: +periodMinutes.toFixed(1),
        altitudeKm: +altitudeKm.toFixed(1),
        velocityKms: +velocityKms.toFixed(3),
        orbitType,
    };
}
//# sourceMappingURL=orbital.js.map