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
const express_1 = require("express");
const index_js_1 = require("../models/index.js");
const satellite = __importStar(require("satellite.js"));
const orbital_js_1 = require("../services/orbital.js");
const spaceWeather_js_1 = require("../services/spaceWeather.js");
const index_js_2 = require("../simulation/index.js");
const router = (0, express_1.Router)();
// ─── Satellites ───────────────────────────────────────────────────────────────
router.get('/satellites', async (req, res) => {
    const { tier, health, limit = '500' } = req.query;
    const filter = {};
    if (tier)
        filter.tier = tier;
    if (health)
        filter.health = health;
    const sats = await index_js_1.Satellite.find(filter).limit(Number(limit));
    res.json(sats);
});
router.get('/satellites/:id', async (req, res) => {
    const sat = await index_js_1.Satellite.findOne({ noradId: Number(req.params.id) });
    if (!sat)
        return res.status(404).json({ error: 'Not found' });
    res.json(sat);
});
router.get('/satellites/:id/orbit-facts', async (req, res) => {
    const sat = await index_js_1.Satellite.findOne({ noradId: Number(req.params.id) });
    if (!sat?.tle1 || !sat?.tle2)
        return res.status(404).json({ error: 'No TLE data' });
    const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
    res.json((0, orbital_js_1.getOrbitFacts)(satrec));
});
router.get('/satellites/:id/eclipse', async (req, res) => {
    const sat = await index_js_1.Satellite.findOne({ noradId: Number(req.params.id) });
    if (!sat?.tle1 || !sat?.tle2)
        return res.status(404).json({ error: 'No TLE data' });
    const t = req.query.t ? new Date(String(req.query.t)) : new Date();
    const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
    const pv = satellite.propagate(satrec, t);
    if (!pv.position || typeof pv.position === 'boolean') {
        return res.status(400).json({ error: 'Propagation failed' });
    }
    const sunPos = (0, orbital_js_1.getSunPositionEci)(t);
    const inEclipseNow = (0, orbital_js_1.isInEclipse)(pv.position, sunPos);
    res.json({ noradId: sat.noradId, time: t, inEclipse: inEclipseNow, sunPos });
});
router.get('/satellites/:id/passes', async (req, res) => {
    const sat = await index_js_1.Satellite.findOne({ noradId: Number(req.params.id) });
    if (!sat?.tle1 || !sat?.tle2)
        return res.status(404).json({ error: 'No TLE data' });
    const gsId = req.query.gsId ? String(req.query.gsId) : null;
    const gs = gsId ? await index_js_1.GroundStation.findById(gsId) : await index_js_1.GroundStation.findOne();
    if (!gs)
        return res.status(404).json({ error: 'No ground station found' });
    const hours = Math.min(Number(req.query.hours ?? 24), 72);
    const startDate = req.query.start ? new Date(String(req.query.start)) : new Date();
    const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
    const passes = (0, orbital_js_1.predictPasses)(satrec, { lat: gs.lat, lon: gs.lon, elevationMask: gs.elevationMask }, startDate, hours);
    res.json({ satellite: sat.noradId, groundStation: gs.name, passes });
});
// ─── Conjunctions ─────────────────────────────────────────────────────────────
router.get('/conjunctions', async (req, res) => {
    const threshold = Number(req.query.threshold ?? 20);
    const t = req.query.t ? new Date(String(req.query.t)) : new Date();
    const sats = await index_js_1.Satellite.find({ tle1: { $exists: true }, tle2: { $exists: true } });
    const parsed = sats
        .filter((s) => s.tle1 && s.tle2)
        .map((s) => ({ noradId: s.noradId, satrec: satellite.twoline2satrec(s.tle1, s.tle2) }));
    const conjunctions = (0, orbital_js_1.screenConjunctions)(parsed, t, threshold);
    res.json({
        time: t,
        threshold,
        disclaimer: 'Screening estimates from public TLEs, not operational collision warnings.',
        conjunctions,
    });
});
// ─── Ground Stations ──────────────────────────────────────────────────────────
router.get('/ground-stations', async (_req, res) => {
    res.json(await index_js_1.GroundStation.find());
});
// ─── Telemetry ────────────────────────────────────────────────────────────────
router.get('/telemetry/:satelliteId', async (req, res) => {
    const docs = await index_js_1.Telemetry.find({ satelliteId: Number(req.params.satelliteId) })
        .sort({ ts: -1 })
        .limit(Number(req.query.limit ?? 120));
    res.json(docs.reverse()); // chronological order for charts
});
// ─── Alerts ───────────────────────────────────────────────────────────────────
router.get('/alerts', async (req, res) => {
    const filter = {};
    if (req.query.status)
        filter.status = req.query.status;
    if (req.query.satelliteId)
        filter.satelliteId = Number(req.query.satelliteId);
    res.json(await index_js_1.Alert.find(filter).sort({ createdAt: -1 }).limit(100));
});
router.patch('/alerts/:id/acknowledge', async (req, res) => {
    const alert = await index_js_1.Alert.findByIdAndUpdate(req.params.id, { status: 'acknowledged', acknowledgedAt: new Date() }, { new: true });
    if (!alert)
        return res.status(404).json({ error: 'Not found' });
    res.json(alert);
});
router.patch('/alerts/:id/resolve', async (req, res) => {
    const alert = await index_js_1.Alert.findByIdAndUpdate(req.params.id, { status: 'resolved', resolvedAt: new Date() }, { new: true });
    if (!alert)
        return res.status(404).json({ error: 'Not found' });
    res.json(alert);
});
// ─── Space Weather (Part 4) ───────────────────────────────────────────────────
router.get('/space-weather', async (_req, res) => {
    const data = await (0, spaceWeather_js_1.pollSpaceWeather)();
    res.json(data);
});
// ─── Chaos fault injection (Part 4) ──────────────────────────────────────────
const VALID_FAULTS = [
    'solar_flare', 'battery_cell', 'wheel_saturation',
    'star_tracker_loss', 'thermal_runaway', 'comms_dropout', 'safe_mode',
];
router.post('/scenarios/inject', (req, res) => {
    const { noradId, fault } = req.body;
    if (!noradId || !fault)
        return res.status(400).json({ error: 'noradId and fault required' });
    if (!VALID_FAULTS.includes(fault))
        return res.status(400).json({ error: 'Invalid fault type', valid: VALID_FAULTS });
    const ok = (0, index_js_2.injectFault)(Number(noradId), fault);
    if (!ok)
        return res.status(404).json({ error: 'Satellite not found in simulator' });
    res.json({ injected: true, noradId, fault });
});
router.post('/scenarios/clear', (req, res) => {
    const { noradId, fault } = req.body;
    if (!noradId || !fault)
        return res.status(400).json({ error: 'noradId and fault required' });
    const ok = (0, index_js_2.clearFault)(Number(noradId), fault);
    if (!ok)
        return res.status(404).json({ error: 'Satellite not found in simulator' });
    res.json({ cleared: true, noradId, fault });
});
router.get('/scenarios/faults', (_req, res) => {
    res.json({ available: VALID_FAULTS });
});
// ─── Status ───────────────────────────────────────────────────────────────────
router.get('/status', (_req, res) => {
    res.json({ ok: true, weather: (0, spaceWeather_js_1.getCachedWeather)() });
});
// ─── Part 6: Mission AI Endpoints ──────────────────────────────────────────────
const index_js_3 = require("../ai/index.js");
const index_js_4 = require("../models/index.js");
router.post('/chat', async (req, res) => {
    const { message, sessionId, history = [] } = req.body;
    if (!message)
        return res.status(400).json({ error: 'Message required' });
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    let fullReplyText = '';
    const toolsUsed = [];
    await (0, index_js_3.streamChatResponse)(history, message, (token) => {
        fullReplyText += token;
        res.write(`data: ${JSON.stringify({ type: 'token', text: token })}\n\n`);
    }, (chip, requiresConfirm, uiCommand) => {
        toolsUsed.push(chip);
        res.write(`data: ${JSON.stringify({ type: 'tool', chip, requiresConfirm, uiCommand })}\n\n`);
    }, () => {
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
        // Persist to session if sessionId provided
        if (sessionId) {
            index_js_4.ChatSession.findByIdAndUpdate(sessionId, {
                $push: {
                    messages: [
                        { role: 'user', content: message, timestamp: new Date() },
                        { role: 'model', content: fullReplyText, timestamp: new Date() },
                    ],
                },
            }).catch(() => { });
        }
    }, (errorMsg) => {
        res.write(`data: ${JSON.stringify({ type: 'error', error: errorMsg })}\n\n`);
        res.end();
    });
});
router.get('/reports/shift', async (req, res) => {
    const hours = Number(req.query.hours ?? 8);
    const report = await (0, index_js_3.generateShiftReport)(hours);
    res.json({ hours, report, generatedAt: new Date() });
});
router.get('/chat/sessions', async (_req, res) => {
    const sessions = await index_js_4.ChatSession.find().sort({ updatedAt: -1 }).limit(10);
    res.json(sessions);
});
router.post('/chat/sessions', async (req, res) => {
    const session = await index_js_4.ChatSession.create({
        title: req.body.title || 'New Mission Session',
        messages: [],
    });
    res.json(session);
});
exports.default = router;
//# sourceMappingURL=api.js.map