/**
 * Part 4 — Physics-consistent simulation engine
 * Runs at 1 Hz for each fleet satellite. Computes telemetry from real orbital state.
 */
import * as satellite from 'satellite.js';
import {
  clamp, fspl, isInSaa,
  MODE_LOAD_W,
  type SatMode,
  type TelemetrySample,
} from '../../../shared/physics/index.js';
import { getSunPositionEci, isInEclipse } from '../services/orbital.js';
import { GroundStation, Satellite, Telemetry } from '../models/index.js';
import { io } from '../index.js';

// ─── Per-satellite mutable state ─────────────────────────────────────────────
interface SatState {
  noradId: number;
  name: string;
  satrec: satellite.SatRec;
  // Power
  soc: number;             // %
  batteryTemp: number;     // °C
  busTemp: number;         // °C
  payloadTemp: number;     // °C
  // ADCS
  wheelRpm: [number, number, number];
  pointingError: number;
  // Radiation
  seuCount: number;
  // Chaos fault injections
  faults: Set<string>;
}

const states = new Map<number, SatState>();
let groundStations: Array<{ name: string; lat: number; lon: number; elevationMask: number }> = [];
let spaceWeather = { kp: 2, xrayFlux: 1e-7, stormScale: 0 };

// ─── Initialise ───────────────────────────────────────────────────────────────
export async function initSimulator() {
  const sats = await Satellite.find({ tier: 'fleet', tle1: { $exists: true } });
  const gs = await GroundStation.find();
  groundStations = gs.map((g) => ({
    name: g.name ?? 'Unknown',
    lat: g.lat ?? 0,
    lon: g.lon ?? 0,
    elevationMask: g.elevationMask ?? 5,
  }));

  for (const sat of sats) {
    if (!sat.tle1 || !sat.tle2) continue;
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
const batchBuffer: TelemetrySample[] = [];
let batchTimer: ReturnType<typeof setTimeout> | null = null;

export function simTick(simTimeMs?: number) {
  const now = new Date(simTimeMs ?? Date.now());
  const sunPos = getSunPositionEci(now);

  const samples: TelemetrySample[] = [];

  for (const [, st] of states) {
    const pv = satellite.propagate(st.satrec, now);
    if (!pv.position || typeof pv.position === 'boolean') continue;

    const pos = pv.position as { x: number; y: number; z: number };
    const gmst = satellite.gstime(now);

    // ── Orbital geometry ────────────────────────────────────────────────────
    const inEclipse = isInEclipse(pos, sunPos);
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
    const lossDb = inContact ? fspl(Math.max(bestRange, 100)) : 0;
    const signalStrength = inContact
      ? clamp(-50 - lossDb * 0.05 + (Math.random() - 0.5) * 2, -130, -50)
      : -999;
    const linkQuality = inContact ? clamp(1 - lossDb / 200, 0.1, 1) : 0;

    // Inject comms-dropout fault
    const hasCommsDropout = st.faults.has('comms_dropout');

    // ── Mode ────────────────────────────────────────────────────────────────
    let mode: SatMode = 'nominal';
    if (st.faults.has('safe_mode')) mode = 'safe';
    else if (inEclipse) mode = 'eclipse';
    else if (inContact && !hasCommsDropout) mode = 'contact';

    const loadW = MODE_LOAD_W[mode];

    // ── Power model ──────────────────────────────────────────────────────────
    // P_solar: 150 W peak, degraded in eclipse
    const pSolar = 150 * sunlitFraction * (st.faults.has('battery_cell') ? 0.5 : 1);
    const panelEff = 0.28;
    const battCap = 50 * 3600; // 50 Wh in Joules
    const chargeEff = 0.92;
    const dSocDt = ((pSolar * panelEff - loadW) / battCap) * 100 * DT * chargeEff;
    st.soc = clamp(st.soc + dSocDt, 0, 100);

    const solarCurrent = (pSolar * panelEff) / 28;
    const busVoltage = 26 + (st.soc / 100) * 4 + (Math.random() - 0.5) * 0.2;

    // ── Thermal model ────────────────────────────────────────────────────────
    const tauBatt = 600;   // seconds time constant
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
      st.wheelRpm[i] = clamp(st.wheelRpm[i] + drift * DT, -6000, 6000);
    }
    const starTrackerFault = st.faults.has('star_tracker_loss');
    const targetPointing = starTrackerFault ? 8 : 0.15;
    st.pointingError += (targetPointing - st.pointingError) * 0.01 + (Math.random() - 0.5) * 0.02;
    st.pointingError = Math.max(0, st.pointingError);
    const angularRate = Math.abs((Math.random() - 0.5) * 0.1);

    // ── Radiation ────────────────────────────────────────────────────────────
    const inSaa = isInSaa(latDeg, lonDeg);
    const kpBoost = Math.pow(spaceWeather.kp / 5, 2);
    const solarFlare = st.faults.has('solar_flare');
    const doserate = (inSaa ? 40 : 1) * (1 + kpBoost * 3) * (solarFlare ? 15 : 1);
    const seuProb = doserate / 1e6;
    if (Math.random() < seuProb) st.seuCount++;

    // ── Health score ─────────────────────────────────────────────────────────
    const socScore = clamp(st.soc, 0, 100);
    const tempScore = clamp(100 - Math.max(0, st.batteryTemp - 30) * 3, 0, 100);
    const pointingScore = clamp(100 - st.pointingError * 20, 0, 100);
    const healthScore = Math.round((socScore * 0.4 + tempScore * 0.3 + pointingScore * 0.3));

    const sample: TelemetrySample = {
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
        wheelSpeedRPM: st.wheelRpm.map((r) => +r.toFixed(0)) as [number, number, number],
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
    io.to(`sat:${st.noradId}`).emit('telemetry:detail', sample);

    // Part 5: run anomaly detector on every sample (async, non-blocking)
    import('../anomaly/detector.js')
      .then(({ detectAnomalies }) => detectAnomalies(sample))
      .catch(() => {});
  }

  // Emit compact batch to all connected clients
  if (samples.length > 0) {
    io.emit('telemetry:batch', samples);
  }

  // Bulk-insert to MongoDB every 5 seconds (not every tick)
  if (!batchTimer) {
    batchTimer = setTimeout(async () => {
      if (batchBuffer.length > 0) {
        const toInsert = batchBuffer.splice(0, batchBuffer.length);
        await Telemetry.insertMany(toInsert).catch(() => {});
      }
      batchTimer = null;
    }, 5000);
  }
}

// ─── Space weather ────────────────────────────────────────────────────────────
export function updateSpaceWeather(kp: number, xrayFlux: number, stormScale: number) {
  spaceWeather = { kp, xrayFlux, stormScale };
  io.emit('weather:update', spaceWeather);
}

export function getSpaceWeather() {
  return { ...spaceWeather };
}

// ─── Chaos fault injection ────────────────────────────────────────────────────
export type FaultType =
  | 'solar_flare'
  | 'battery_cell'
  | 'wheel_saturation'
  | 'star_tracker_loss'
  | 'thermal_runaway'
  | 'comms_dropout'
  | 'safe_mode';

export function injectFault(noradId: number, fault: FaultType) {
  const st = states.get(noradId);
  if (!st) return false;
  st.faults.add(fault);
  io.emit('scenario:state', { noradId, fault, active: true });
  return true;
}

export function clearFault(noradId: number, fault: FaultType) {
  const st = states.get(noradId);
  if (!st) return false;
  st.faults.delete(fault);
  io.emit('scenario:state', { noradId, fault, active: false });
  return true;
}

export function getSatelliteState(noradId: number) {
  return states.get(noradId);
}
