import { Router, Request, Response } from 'express';
import { Satellite, Telemetry, Alert, GroundStation } from '../models/index.js';
import * as satellite from 'satellite.js';
import {
  predictPasses,
  screenConjunctions,
  getOrbitFacts,
  getSunPositionEci,
  isInEclipse,
} from '../services/orbital.js';
import { getCachedWeather, pollSpaceWeather } from '../services/spaceWeather.js';
import { injectFault, clearFault, type FaultType } from '../simulation/index.js';

const router = Router();

// ─── Satellites ───────────────────────────────────────────────────────────────
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

router.get('/satellites/:id/orbit-facts', async (req: Request, res: Response) => {
  const sat = await Satellite.findOne({ noradId: Number(req.params.id) });
  if (!sat?.tle1 || !sat?.tle2) return res.status(404).json({ error: 'No TLE data' });
  const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
  res.json(getOrbitFacts(satrec));
});

router.get('/satellites/:id/eclipse', async (req: Request, res: Response) => {
  const sat = await Satellite.findOne({ noradId: Number(req.params.id) });
  if (!sat?.tle1 || !sat?.tle2) return res.status(404).json({ error: 'No TLE data' });
  const t = req.query.t ? new Date(String(req.query.t)) : new Date();
  const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
  const pv = satellite.propagate(satrec, t);
  if (!pv.position || typeof pv.position === 'boolean') {
    return res.status(400).json({ error: 'Propagation failed' });
  }
  const sunPos = getSunPositionEci(t);
  const inEclipseNow = isInEclipse(pv.position as { x: number; y: number; z: number }, sunPos);
  res.json({ noradId: sat.noradId, time: t, inEclipse: inEclipseNow, sunPos });
});

router.get('/satellites/:id/passes', async (req: Request, res: Response) => {
  const sat = await Satellite.findOne({ noradId: Number(req.params.id) });
  if (!sat?.tle1 || !sat?.tle2) return res.status(404).json({ error: 'No TLE data' });
  const gsId = req.query.gsId ? String(req.query.gsId) : null;
  const gs = gsId ? await GroundStation.findById(gsId) : await GroundStation.findOne();
  if (!gs) return res.status(404).json({ error: 'No ground station found' });
  const hours = Math.min(Number(req.query.hours ?? 24), 72);
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

// ─── Conjunctions ─────────────────────────────────────────────────────────────
router.get('/conjunctions', async (req: Request, res: Response) => {
  const threshold = Number(req.query.threshold ?? 20);
  const t = req.query.t ? new Date(String(req.query.t)) : new Date();
  const sats = await Satellite.find({ tle1: { $exists: true }, tle2: { $exists: true } });
  const parsed = sats
    .filter((s) => s.tle1 && s.tle2)
    .map((s) => ({ noradId: s.noradId, satrec: satellite.twoline2satrec(s.tle1!, s.tle2!) }));
  const conjunctions = screenConjunctions(parsed, t, threshold);
  res.json({
    time: t,
    threshold,
    disclaimer: 'Screening estimates from public TLEs, not operational collision warnings.',
    conjunctions,
  });
});

// ─── Ground Stations ──────────────────────────────────────────────────────────
router.get('/ground-stations', async (_req: Request, res: Response) => {
  res.json(await GroundStation.find());
});

// ─── Telemetry ────────────────────────────────────────────────────────────────
router.get('/telemetry/:satelliteId', async (req: Request, res: Response) => {
  const docs = await Telemetry.find({ satelliteId: Number(req.params.satelliteId) })
    .sort({ ts: -1 })
    .limit(Number(req.query.limit ?? 120));
  res.json(docs.reverse()); // chronological order for charts
});

// Telemetry Export (CSV / JSON)
router.get('/telemetry/:satelliteId/export', async (req: Request, res: Response) => {
  const format = String(req.query.format ?? 'csv').toLowerCase();
  const docs = await Telemetry.find({ satelliteId: Number(req.params.satelliteId) })
    .sort({ ts: -1 })
    .limit(500)
    .lean();

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="telemetry_${req.params.satelliteId}.json"`);
    return res.json(docs);
  }

  // CSV Export
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="telemetry_${req.params.satelliteId}.csv"`);
  let csv = 'Timestamp,SatelliteID,SOC,BatteryTemp,BusVoltage,PointingError,SEUCount,Mode,HealthScore\n';
  for (const d of docs) {
    const t = d as any;
    csv += `${new Date(t.ts).toISOString()},${t.satelliteId},${t.power?.soc ?? ''},${t.thermal?.batteryTemp ?? ''},${t.power?.busVoltage ?? ''},${t.adcs?.pointingError ?? ''},${t.radiation?.seuCount ?? ''},${t.mode ?? ''},${t.healthScore ?? ''}\n`;
  }
  res.send(csv);
});

// ─── Alerts ───────────────────────────────────────────────────────────────────
router.get('/alerts', async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.satelliteId) filter.satelliteId = Number(req.query.satelliteId);
  res.json(await Alert.find(filter).sort({ createdAt: -1 }).limit(100));
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

// ─── Space Weather (Part 4) ───────────────────────────────────────────────────
router.get('/space-weather', async (_req: Request, res: Response) => {
  const data = await pollSpaceWeather();
  res.json(data);
});

// ─── Chaos fault injection (Part 4) ──────────────────────────────────────────
const VALID_FAULTS: FaultType[] = [
  'solar_flare', 'battery_cell', 'wheel_saturation',
  'star_tracker_loss', 'thermal_runaway', 'comms_dropout', 'safe_mode',
];

router.post('/scenarios/inject', (req: Request, res: Response) => {
  const { noradId, fault } = req.body;
  if (!noradId || !fault) return res.status(400).json({ error: 'noradId and fault required' });
  if (!VALID_FAULTS.includes(fault)) return res.status(400).json({ error: 'Invalid fault type', valid: VALID_FAULTS });
  const ok = injectFault(Number(noradId), fault as FaultType);
  if (!ok) return res.status(404).json({ error: 'Satellite not found in simulator' });
  res.json({ injected: true, noradId, fault });
});

router.post('/scenarios/clear', (req: Request, res: Response) => {
  const { noradId, fault } = req.body;
  if (!noradId || !fault) return res.status(400).json({ error: 'noradId and fault required' });
  const ok = clearFault(Number(noradId), fault as FaultType);
  if (!ok) return res.status(404).json({ error: 'Satellite not found in simulator' });
  res.json({ cleared: true, noradId, fault });
});

router.get('/scenarios/faults', (_req: Request, res: Response) => {
  res.json({ available: VALID_FAULTS });
});

// ─── Status ───────────────────────────────────────────────────────────────────
router.get('/status', (_req: Request, res: Response) => {
  res.json({ ok: true, weather: getCachedWeather() });
});

// ─── Part 6: Mission AI Endpoints ──────────────────────────────────────────────
import { streamChatResponse, generateShiftReport } from '../ai/index.js';
import { ChatSession } from '../models/index.js';

router.post('/chat', async (req: Request, res: Response) => {
  const { message, sessionId, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let fullReplyText = '';
  const toolsUsed: string[] = [];

  await streamChatResponse(
    history,
    message,
    (token) => {
      fullReplyText += token;
      res.write(`data: ${JSON.stringify({ type: 'token', text: token })}\n\n`);
    },
    (chip, requiresConfirm, uiCommand) => {
      toolsUsed.push(chip);
      res.write(
        `data: ${JSON.stringify({ type: 'tool', chip, requiresConfirm, uiCommand })}\n\n`
      );
    },
    () => {
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();

      // Persist to session if sessionId provided
      if (sessionId) {
        ChatSession.findByIdAndUpdate(sessionId, {
          $push: {
            messages: [
              { role: 'user', content: message, timestamp: new Date() },
              { role: 'model', content: fullReplyText, timestamp: new Date() },
            ],
          },
        }).catch(() => {});
      }
    },
    (errorMsg) => {
      res.write(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`);
      res.end();
    }
  );
});

router.get('/reports/shift', async (req: Request, res: Response) => {
  const hours = Number(req.query.hours ?? 8);
  const report = await generateShiftReport(hours);
  res.json({ hours, report, generatedAt: new Date() });
});

router.get('/chat/sessions', async (_req: Request, res: Response) => {
  const sessions = await ChatSession.find().sort({ updatedAt: -1 }).limit(10);
  res.json(sessions);
});

router.post('/chat/sessions', async (req: Request, res: Response) => {
  const session = await ChatSession.create({
    title: req.body.title || 'New Mission Session',
    messages: [],
  });
  res.json(session);
});

export default router;
