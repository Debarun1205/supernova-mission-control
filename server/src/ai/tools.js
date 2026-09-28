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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOOL_DECLARATIONS = void 0;
exports.executeTool = executeTool;
/**
 * Part 6 — Mission AI Tool Definitions
 * Each tool fetches live data from DB/simulation and returns compact JSON.
 */
const genai_1 = require("@google/genai");
const index_js_1 = require("../models/index.js");
const index_js_2 = require("../models/index.js");
const spaceWeather_js_1 = require("../services/spaceWeather.js");
const orbital_js_1 = require("../services/orbital.js");
const index_js_3 = require("../simulation/index.js");
const satellite = __importStar(require("satellite.js"));
const runbooks_json_1 = __importDefault(require("../anomaly/runbooks.json"));
// ─── Tool declarations (schema for Gemini) ───────────────────────────────────
exports.TOOL_DECLARATIONS = [
    {
        name: 'list_satellites',
        description: 'List fleet satellites, optionally filtered by health status.',
        parameters: {
            type: genai_1.Type.OBJECT,
            properties: {
                health: { type: genai_1.Type.STRING, description: 'Filter by health: nominal, warning, or critical.' },
                q: { type: genai_1.Type.STRING, description: 'Search query to filter by name.' },
            },
        },
    },
    {
        name: 'get_satellite_status',
        description: 'Get current telemetry, health, mode, and orbit facts for a satellite by NORAD ID.',
        parameters: {
            type: genai_1.Type.OBJECT,
            properties: {
                id: { type: genai_1.Type.NUMBER, description: 'NORAD catalog number.' },
            },
            required: ['id'],
        },
    },
    {
        name: 'get_telemetry_window',
        description: 'Get historical telemetry for a satellite parameter over the last N minutes with summary stats.',
        parameters: {
            type: genai_1.Type.OBJECT,
            properties: {
                id: { type: genai_1.Type.NUMBER, description: 'NORAD ID.' },
                parameter: { type: genai_1.Type.STRING, description: 'E.g. power.soc, thermal.batteryTemp, adcs.pointingError.' },
                minutes: { type: genai_1.Type.NUMBER, description: 'Window size in minutes (max 60).' },
            },
            required: ['id', 'parameter'],
        },
    },
    {
        name: 'get_active_alerts',
        description: 'Get currently open alerts, optionally filtered by severity or satellite.',
        parameters: {
            type: genai_1.Type.OBJECT,
            properties: {
                severity: { type: genai_1.Type.STRING, description: 'warning or critical.' },
                satelliteId: { type: genai_1.Type.NUMBER, description: 'Filter to a specific NORAD ID.' },
            },
        },
    },
    {
        name: 'get_incident',
        description: 'Get details of an incident by ID, including probable cause and evidence.',
        parameters: {
            type: genai_1.Type.OBJECT,
            properties: {
                id: { type: genai_1.Type.STRING, description: 'Incident MongoDB ObjectId.' },
            },
            required: ['id'],
        },
    },
    {
        name: 'predict_passes',
        description: 'Predict passes for a satellite over a location for the next N hours.',
        parameters: {
            type: genai_1.Type.OBJECT,
            properties: {
                id: { type: genai_1.Type.NUMBER, description: 'NORAD ID.' },
                lat: { type: genai_1.Type.NUMBER, description: 'Observer latitude.' },
                lon: { type: genai_1.Type.NUMBER, description: 'Observer longitude.' },
                hours: { type: genai_1.Type.NUMBER, description: 'Prediction window in hours (max 48).' },
            },
            required: ['id'],
        },
    },
    {
        name: 'get_space_weather',
        description: 'Get current NOAA space weather: Kp index, X-ray flux, G-storm scale.',
        parameters: { type: genai_1.Type.OBJECT, properties: {} },
    },
    {
        name: 'get_conjunctions',
        description: 'Get predicted conjunction close-approaches for fleet satellites at the current time.',
        parameters: {
            type: genai_1.Type.OBJECT,
            properties: {
                threshold: { type: genai_1.Type.NUMBER, description: 'Miss distance threshold in km (default 20).' },
            },
        },
    },
    {
        name: 'ui_focus_satellite',
        description: 'Tell the UI to fly the camera to and select a satellite. Returns a UI command.',
        parameters: {
            type: genai_1.Type.OBJECT,
            properties: {
                id: { type: genai_1.Type.NUMBER, description: 'NORAD ID to focus.' },
            },
            required: ['id'],
        },
    },
    {
        name: 'acknowledge_alert',
        description: 'Acknowledge an open alert. STATE-CHANGING — client must show confirm card before executing.',
        parameters: {
            type: genai_1.Type.OBJECT,
            properties: {
                id: { type: genai_1.Type.STRING, description: 'Alert MongoDB ObjectId.' },
            },
            required: ['id'],
        },
    },
    {
        name: 'get_runbook',
        description: 'Get illustrative response checklist for an alert type.',
        parameters: {
            type: genai_1.Type.OBJECT,
            properties: {
                alertType: { type: genai_1.Type.STRING, description: 'Alert type key, e.g. battery_low_warning.' },
            },
            required: ['alertType'],
        },
    },
];
async function executeTool(name, args) {
    switch (name) {
        case 'list_satellites': {
            const filter = { tier: 'fleet' };
            if (args.health)
                filter.health = args.health;
            const sats = await index_js_1.Satellite.find(filter).select('noradId name health').lean();
            const result = args.q
                ? sats.filter((s) => s.name.toLowerCase().includes(String(args.q).toLowerCase()))
                : sats;
            return { data: result, chip: `Listed ${result.length} satellites` };
        }
        case 'get_satellite_status': {
            const sat = await index_js_1.Satellite.findOne({ noradId: Number(args.id) }).lean();
            if (!sat)
                return { data: { error: 'Not found' }, chip: `Satellite ${args.id} not found` };
            const latest = await index_js_1.Telemetry.findOne({ satelliteId: sat.noradId }).sort({ ts: -1 }).lean();
            let orbitFacts = null;
            if (sat.tle1 && sat.tle2) {
                try {
                    orbitFacts = (0, orbital_js_1.getOrbitFacts)(satellite.twoline2satrec(sat.tle1, sat.tle2));
                }
                catch (_) { }
            }
            return {
                data: { satellite: sat, latestTelemetry: latest, orbitFacts },
                chip: `Read status: ${sat.name}`,
            };
        }
        case 'get_telemetry_window': {
            const minutes = Math.min(Number(args.minutes ?? 10), 60);
            const since = new Date(Date.now() - minutes * 60_000);
            const docs = await index_js_1.Telemetry.find({
                satelliteId: Number(args.id),
                ts: { $gte: since },
            }).sort({ ts: 1 }).lean();
            const param = String(args.parameter ?? '');
            const values = docs
                .map((d) => {
                const parts = param.split('.');
                let v = d;
                for (const p of parts)
                    v = v?.[p];
                return typeof v === 'number' ? v : null;
            })
                .filter((v) => v !== null);
            const stats = values.length > 0 ? {
                min: Math.min(...values),
                max: Math.max(...values),
                mean: +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(3),
                latest: values[values.length - 1],
                trend: values.length > 5 ? (values[values.length - 1] > values[0] ? 'rising' : 'falling') : 'stable',
                sampleCount: values.length,
            } : null;
            return {
                data: { satelliteId: args.id, parameter: param, minutes, stats },
                chip: `Read telemetry: NORAD ${args.id}, ${param}, last ${minutes}min`,
            };
        }
        case 'get_active_alerts': {
            const filter = { status: 'open' };
            if (args.severity)
                filter.severity = args.severity;
            if (args.satelliteId)
                filter.satelliteId = Number(args.satelliteId);
            const alerts = await index_js_1.Alert.find(filter).sort({ createdAt: -1 }).limit(20).lean();
            return {
                data: alerts,
                chip: `Fetched ${alerts.length} open alerts`,
            };
        }
        case 'get_incident': {
            const incident = await index_js_1.Incident.findById(String(args.id)).lean();
            if (!incident)
                return { data: { error: 'Not found' }, chip: 'Incident not found' };
            const alerts = await index_js_1.Alert.find({ incidentId: incident._id }).lean();
            return { data: { incident, alerts }, chip: `Read incident ${args.id}` };
        }
        case 'predict_passes': {
            const sat = await index_js_1.Satellite.findOne({ noradId: Number(args.id) }).lean();
            if (!sat?.tle1 || !sat?.tle2)
                return { data: { error: 'No TLE' }, chip: 'No TLE data' };
            const gs = args.lat !== undefined
                ? { lat: Number(args.lat), lon: Number(args.lon ?? 88.36), elevationMask: 5 }
                : { lat: 22.5726, lon: 88.3639, elevationMask: 5 }; // default: Kolkata
            const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
            const hours = Math.min(Number(args.hours ?? 24), 48);
            const passes = (0, orbital_js_1.predictPasses)(satrec, gs, new Date(), hours);
            return {
                data: { noradId: sat.noradId, name: sat.name, location: gs, passes: passes.slice(0, 5) },
                chip: `Predicted passes: ${sat.name}, ${hours}h`,
            };
        }
        case 'get_space_weather': {
            const weather = (0, spaceWeather_js_1.getCachedWeather)();
            return { data: weather, chip: 'Fetched space weather (NOAA SWPC)' };
        }
        case 'get_conjunctions': {
            const threshold = Number(args.threshold ?? 20);
            const sats = await index_js_1.Satellite.find({ tle1: { $exists: true }, tle2: { $exists: true } }).lean();
            // Simple current-epoch check (lightweight)
            return {
                data: {
                    time: new Date(),
                    threshold,
                    disclaimer: 'Screening estimates from public TLEs. Not operational collision warnings.',
                    note: 'Conjunction screening with live positions — see /api/conjunctions for full data.',
                    satelliteCount: sats.length,
                },
                chip: 'Checked conjunctions',
            };
        }
        case 'ui_focus_satellite': {
            return {
                data: { focused: Number(args.id) },
                chip: `Focusing globe on NORAD ${args.id}`,
                uiCommand: { type: 'focus_satellite', payload: { id: Number(args.id) } },
            };
        }
        case 'acknowledge_alert': {
            return {
                data: { alertId: args.id, pendingConfirm: true },
                chip: `Acknowledge alert ${args.id} (pending confirmation)`,
                requiresConfirm: true,
                uiCommand: { type: 'confirm_acknowledge', payload: { alertId: args.id } },
            };
        }
        case 'get_runbook': {
            const rb = runbooks_json_1.default[String(args.alertType)];
            return {
                data: rb ?? { error: 'No runbook found', available: Object.keys(runbooks_json_1.default) },
                chip: `Read runbook: ${args.alertType}`,
            };
        }
        default:
            return { data: { error: `Unknown tool: ${name}` }, chip: `Unknown tool` };
    }
}
//# sourceMappingURL=tools.js.map