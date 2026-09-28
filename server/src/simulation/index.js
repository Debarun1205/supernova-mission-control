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
exports.initSimulator = initSimulator;
exports.simTick = simTick;
exports.updateSpaceWeather = updateSpaceWeather;
exports.getSpaceWeather = getSpaceWeather;
exports.injectFault = injectFault;
exports.clearFault = clearFault;
exports.getSatelliteState = getSatelliteState;
/**
 * Part 4 — Physics-consistent simulation engine
 * Runs at 1 Hz for each fleet satellite. Computes telemetry from real orbital state.
 */
const satellite = __importStar(require("satellite.js"));
const index_js_1 = require("../../../shared/physics/index.js");
const orbital_js_1 = require("../services/orbital.js");
const index_js_2 = require("../models/index.js");
const index_js_3 = require("../index.js");
const states = new Map();
let groundStations = [];
let spaceWeather = { kp: 2, xrayFlux: 1e-7, stormScale: 0 };
// ─── Initialise ───────────────────────────────────────────────────────────────
async function initSimulator() {
    const sats = await index_js_2.Satellite.find({ tier: 'fleet', tle1: { $exists: true } });
    const gs = await index_js_2.GroundStation.find();
    groundStations = gs.map((g) => ({
        name: g.name ?? 'Unknown',
        lat: g.lat ?? 0,
        lon: g.lon ?? 0,
        elevationMask: g.elevationMask ?? 5,
    }));
    for (const sat of sats) {
        if (!sat.tle1 || !sat.tle2)
            continue;
        states.set(sat.noradId, {
            noradId: sat.noradId,
            name: sat.name,
            satrec: satellite.twoline2satrec(sat.tle1, sat.tle2),
            soc: 75 + Math.random() * 15,
            batteryTemp: 15 + Math.random() * 5,
            busTemp: 22 + Math.random() * 3,
            payloadTemp: 20 + Math.random() * 4,
            wheelRpm: [3000, 3000, 3000],
            pointingError: 0.1,
            seuCount: 0,
            faults: new Set(),
        });
    }
}
// ─── Single simulation tick ───────────────────────────────────────────────────
const DT = 1; // seconds per tick
const batchBuffer = [];
let batchTimer = null;
function simTick(simTimeMs) {
    const now = new Date(simTimeMs ?? Date.now());
    const sunPos = (0, orbital_js_1.getSunPositionEci)(now);
    const samples = [];
    for (const [, st] of states) {
        const pv = satellite.propagate(st.satrec, now);
        if (!pv.position || typeof pv.position === 'boolean')
            continue;
        const pos = pv.position;
        const gmst = satellite.gstime(now);
        // ── Orbital geometry ────────────────────────────────────────────────────
        const inEclipse = (0, orbital_js_1.isInEclipse)(pos, sunPos);
        const geodetic = satellite.eciToGeodetic(pos, gmst);
        const latDeg = satellite.radiansToDegrees(geodetic.latitude);
        const lonDeg = satellite.radiansToDegrees(geodetic.longitude);
        const altKm = geodetic.height;
        const sunlitFraction = inEclipse ? 0 : 1;
        // ── Comms ───────────────────────────────────────────────────────────────
        const ecf = satellite.eciToEcf(pos, gmst);
        let bestStation = 'none';
        let bestEl = -90;
        let bestRange = 0;
        for (const gs of groundStations) {
            const obsGd = {
                latitude: satellite.degreesToRadians(gs.lat),
                longitude: satellite.degreesToRadians(gs.lon),
                height: 0.01,
            };
            const look = satellite.ecfToLookAngles(obsGd, ecf);
            const elDeg = satellite.radiansToDegrees(look.elevation);
            if (elDeg > gs.elevationMask && elDeg > bestEl) {
                bestEl = elDeg;
                bestStation = gs.name;
                // Range: pythagorean from station to satellite
                const dx = pos.x - ecf.x;
                const dy = pos.y - ecf.y;
                const dz = pos.z - ecf.z;
                bestRange = Math.sqrt(dx * dx + dy * dy + dz * dz);
            }
        }
        const inContact = bestStation !== 'none';
        const lossDb = inContact ? (0, index_js_1.fspl)(Math.max(bestRange, 100)) : 0;
        const signalStrength = inContact
            ? (0, index_js_1.clamp)(-50 - lossDb * 0.05 + (Math.random() - 0.5) * 2, -130, -50)
            : -999;
        const linkQuality = inContact ? (0, index_js_1.clamp)(1 - lossDb / 200, 0.1, 1) : 0;
        // Inject comms-dropout fault
        const hasCommsDropout = st.faults.has('comms_dropout');
        // ── Mode ────────────────────────────────────────────────────────────────
        let mode = 'nominal';
        if (st.faults.has('safe_mode'))
            mode = 'safe';
        else if (inEclipse)
            mode = 'eclipse';
        else if (inContact && !hasCommsDropout)
            mode = 'contact';
        const loadW = index_js_1.MODE_LOAD_W[mode];
        // ── Power model ──────────────────────────────────────────────────────────
        // P_solar: 150 W peak, degraded in eclipse
        const pSolar = 150 * sunlitFraction * (st.faults.has('battery_cell') ? 0.5 : 1);
        const panelEff = 0.28;
        const battCap = 50 * 3600; // 50 Wh in Joules
        const chargeEff = 0.92;
        const dSocDt = ((pSolar * panelEff - loadW) / battCap) * 100 * DT * chargeEff;
        st.soc = (0, index_js_1.clamp)(st.soc + dSocDt, 0, 100);
        const solarCurrent = (pSolar * panelEff) / 28;
        const busVoltage = 26 + (st.soc / 100) * 4 + (Math.random() - 0.5) * 0.2;
        // ── Thermal model ────────────────────────────────────────────────────────
        const tauBatt = 600; // seconds time constant
        const tBattTarget = inEclipse ? -5 : (st.faults.has('thermal_runaway') ? 65 : 20);
        st.batteryTemp += ((tBattTarget - st.batteryTemp) / tauBatt) * DT + (Math.random() - 0.5) * 0.05;
        const tBusTarget = inEclipse ? 5 : 28;
        st.busTemp += ((tBusTarget - st.busTemp) / 900) * DT + (Math.random() - 0.5) * 0.03;
        const tPayTarget = inEclipse ? 0 : 25;
        st.payloadTemp += ((tPayTarget - st.payloadTemp) / 1200) * DT + (Math.random() - 0.5) * 0.04;
        // ── ADCS model ──────────────────────────────────────────────────────────
        const wheelSatFault = st.faults.has('wheel_saturation');
        for (let i = 0; i < 3; i++) {
            const drift = wheelSatFault ? 50 : (Math.random() - 0.48) * 5;
            st.wheelRpm[i] = (0, index_js_1.clamp)(st.wheelRpm[i] + drift * DT, -6000, 6000);
        }
        const starTrackerFault = st.faults.has('star_tracker_loss');
        const targetPointing = starTrackerFault ? 8 : 0.15;
        st.pointingError += (targetPointing - st.pointingError) * 0.01 + (Math.random() - 0.5) * 0.02;
        st.pointingError = Math.max(0, st.pointingError);
        const angularRate = Math.abs((Math.random() - 0.5) * 0.1);
        // ── Radiation ────────────────────────────────────────────────────────────
        const inSaa = (0, index_js_1.isInSaa)(latDeg, lonDeg);
        const kpBoost = Math.pow(spaceWeather.kp / 5, 2);
        const solarFlare = st.faults.has('solar_flare');
        const doserate = (inSaa ? 40 : 1) * (1 + kpBoost * 3) * (solarFlare ? 15 : 1);
        const seuProb = doserate / 1e6;
        if (Math.random() < seuProb)
            st.seuCount++;
        // ── Health score ─────────────────────────────────────────────────────────
        const socScore = (0, index_js_1.clamp)(st.soc, 0, 100);
        const tempScore = (0, index_js_1.clamp)(100 - Math.max(0, st.batteryTemp - 30) * 3, 0, 100);
        const pointingScore = (0, index_js_1.clamp)(100 - st.pointingError * 20, 0, 100);
        const healthScore = Math.round((socScore * 0.4 + tempScore * 0.3 + pointingScore * 0.3));
        const sample = {
            ts: now,
            satelliteId: st.noradId,
            power: {
                soc: +st.soc.toFixed(2),
                solarCurrent: +solarCurrent.toFixed(3),
                busVoltage: +busVoltage.toFixed(2),
            },
            thermal: {
                batteryTemp: +st.batteryTemp.toFixed(2),
                busTemp: +st.busTemp.toFixed(2),
                payloadTemp: +st.payloadTemp.toFixed(2),
            },
            comms: {
                signalStrength: +signalStrength.toFixed(1),
                connectedStation: hasCommsDropout ? 'none' : bestStation,
                linkQuality: hasCommsDropout ? 0 : +linkQuality.toFixed(3),
                rangeKm: +Math.max(bestRange, 0).toFixed(1),
            },
            adcs: {
                pointingError: +st.pointingError.toFixed(3),
                wheelSpeedRPM: st.wheelRpm.map((r) => +r.toFixed(0)),
                angularRateDps: +angularRate.toFixed(4),
            },
            radiation: {
                seuCount: st.seuCount,
                inSaa,
                doserate: +doserate.toFixed(2),
            },
            mode,
            healthScore,
        };
        samples.push(sample);
        batchBuffer.push(sample);
        // Emit per-satellite high-rate detail to room subscribers
        index_js_3.io.to(`sat:${st.noradId}`).emit('telemetry:detail', sample);
        // Part 5: run anomaly detector on every sample (async, non-blocking)
        import('../anomaly/detector.js')
            .then(({ detectAnomalies }) => detectAnomalies(sample))
            .catch(() => { });
    }
    // Emit compact batch to all connected clients
    if (samples.length > 0) {
        index_js_3.io.emit('telemetry:batch', samples);
    }
    // Bulk-insert to MongoDB every 5 seconds (not every tick)
    if (!batchTimer) {
        batchTimer = setTimeout(async () => {
            if (batchBuffer.length > 0) {
                const toInsert = batchBuffer.splice(0, batchBuffer.length);
                await index_js_2.Telemetry.insertMany(toInsert).catch(() => { });
            }
            batchTimer = null;
        }, 5000);
    }
}
// ─── Space weather ────────────────────────────────────────────────────────────
function updateSpaceWeather(kp, xrayFlux, stormScale) {
    spaceWeather = { kp, xrayFlux, stormScale };
    index_js_3.io.emit('weather:update', spaceWeather);
}
function getSpaceWeather() {
    return { ...spaceWeather };
}
function injectFault(noradId, fault) {
    const st = states.get(noradId);
    if (!st)
        return false;
    st.faults.add(fault);
    index_js_3.io.emit('scenario:state', { noradId, fault, active: true });
    return true;
}
function clearFault(noradId, fault) {
    const st = states.get(noradId);
    if (!st)
        return false;
    st.faults.delete(fault);
    index_js_3.io.emit('scenario:state', { noradId, fault, active: false });
    return true;
}
function getSatelliteState(noradId) {
    return states.get(noradId);
}
//# sourceMappingURL=index.js.map