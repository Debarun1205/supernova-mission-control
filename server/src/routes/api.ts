import { Router, Request, Response } from 'express';
import { Satellite, Telemetry, Alert, Incident, GroundStation } from '../models';
import * as satellite from 'satellite.js';
import { predictPasses, screenConjunctions, getOrbitFacts, getSunPositionEci, isInEclipse } from '../services/orbital';

const router = Router();

// ─── Satellites ──────────────────────────────────────────────────────────────
router.get('/satellites', async (req: Request, res: Response) => {
  const { tier, health, limit = '500' } = req.query;
  const filter: Record<string, unknown> = {};
  if (tier) filter.tier = tier;
  if (health) filter.health = health;
  const sats = await Satellite.find(filter).limit(Number(limit));
  res.json(sats);
});

router.get('/satellites/:id', async (req: Request, res: Response) => {
  const sat = await Satellite.findOne({ noradId: Number(req.params.id) });
  if (!sat) return res.status(404).json({ error: 'Not found' });
  res.json(sat);
});

// ─── Orbit facts (Part 3) ─────────────────────────────────────────────────────
router.get('/satellites/:id/orbit-facts', async (req: Request, res: Response) => {
  const sat = await Satellite.findOne({ noradId: Number(req.params.id) });
  if (!sat || !sat.tle1 || !sat.tle2) return res.status(404).json({ error: 'No TLE data' });
  const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
  res.json(getOrbitFacts(satrec));
});

// ─── Eclipse status (Part 3) ─────────────────────────────────────────────────
router.get('/satellites/:id/eclipse', async (req: Request, res: Response) => {
  const sat = await Satellite.findOne({ noradId: Number(req.params.id) });
  if (!sat || !sat.tle1 || !sat.tle2) return res.status(404).json({ error: 'No TLE data' });

  const t = req.query.t ? new Date(String(req.query.t)) : new Date();
  const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
  const pv = satellite.propagate(satrec, t);

  if (!pv.position || typeof pv.position === 'boolean') {
    return res.status(400).json({ error: 'Propagation failed' });
  }

  const sunPos = getSunPositionEci(t);
  const inEclipse = isInEclipse(pv.position as { x: number; y: number; z: number }, sunPos);
  res.json({ noradId: sat.noradId, time: t, inEclipse, sunPos });
});

// ─── Pass predictions (Part 3) ────────────────────────────────────────────────
router.get('/satellites/:id/passes', async (req: Request, res: Response) => {
  const sat = await Satellite.findOne({ noradId: Number(req.params.id) });
  if (!sat || !sat.tle1 || !sat.tle2) return res.status(404).json({ error: 'No TLE data' });

  const gsId = req.query.gsId ? String(req.query.gsId) : null;
  let gs;
  if (gsId) {
    gs = await GroundStation.findById(gsId);
  } else {
    gs = await GroundStation.findOne(); // default to first
  }
  if (!gs) return res.status(404).json({ error: 'No ground station found' });

  const hours = Math.min(Number(req.query.hours || 24), 72);
  const startDate = req.query.start ? new Date(String(req.query.start)) : new Date();

  const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
  const passes = predictPasses(
    satrec,
    { lat: gs.lat!, lon: gs.lon!, elevationMask: gs.elevationMask! },
    startDate,
    hours,
  );

  res.json({ satellite: sat.noradId, groundStation: gs.name, passes });
});

// ─── Conjunctions (Part 3) ───────────────────────────────────────────────────
router.get('/conjunctions', async (req: Request, res: Response) => {
  const threshold = Number(req.query.threshold || 20);
  const t = req.query.t ? new Date(String(req.query.t)) : new Date();

  const sats = await Satellite.find({ tle1: { $exists: true }, tle2: { $exists: true } });
  const parsed = sats
    .filter((s) => s.tle1 && s.tle2)
    .map((s) => ({
      noradId: s.noradId,
      satrec: satellite.twoline2satrec(s.tle1!, s.tle2!),
    }));

  const conjunctions = screenConjunctions(parsed, t, threshold);
  res.json({ time: t, threshold, conjunctions });
});

// ─── Ground Stations ──────────────────────────────────────────────────────────
router.get('/ground-stations', async (_req: Request, res: Response) => {
  const stations = await GroundStation.find();
  res.json(stations);
});

// ─── Telemetry ────────────────────────────────────────────────────────────────
router.get('/telemetry/:satelliteId', async (req: Request, res: Response) => {
  const docs = await Telemetry.find({ satelliteId: Number(req.params.satelliteId) })
    .sort({ ts: -1 })
    .limit(60);
  res.json(docs);
});

// ─── Alerts ──────────────────────────────────────────────────────────────────
router.get('/alerts', async (req: Request, res: Response) => {
  const { status, satelliteId } = req.query;
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (satelliteId) filter.satelliteId = Number(satelliteId);
  const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100);
  res.json(alerts);
});

router.patch('/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    { status: 'acknowledged', acknowledgedAt: new Date() },
    { new: true },
  );
  if (!alert) return res.status(404).json({ error: 'Not found' });
  res.json(alert);
});

router.patch('/alerts/:id/resolve', async (req: Request, res: Response) => {
  const alert = await Alert.findByIdAndUpdate(
    req.params.id,
    { status: 'resolved', resolvedAt: new Date() },
    { new: true },
  );
  if (!alert) return res.status(404).json({ error: 'Not found' });
  res.json(alert);
});

// ─── Status ───────────────────────────────────────────────────────────────────
router.get('/status', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

export default router;
