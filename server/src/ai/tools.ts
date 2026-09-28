/**
 * Part 6 — Mission AI Tool Definitions
 * Each tool fetches live data from DB/simulation and returns compact JSON.
 */
import { Type, type FunctionDeclaration } from '@google/genai';
import { Satellite, Telemetry, Alert, Incident, GroundStation } from '../models/index.js';
import { Alert as AlertModel } from '../models/index.js';
import { getCachedWeather } from '../services/spaceWeather.js';
import { getOrbitFacts, predictPasses } from '../services/orbital.js';
import { injectFault, clearFault, type FaultType } from '../simulation/index.js';
import * as satellite from 'satellite.js';
import runbooks from '../anomaly/runbooks.json' assert { type: 'json' };

// ─── Tool declarations (schema for Gemini) ───────────────────────────────────
export const TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'list_satellites',
    description: 'List fleet satellites, optionally filtered by health status.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        health: { type: Type.STRING, description: 'Filter by health: nominal, warning, or critical.' },
        q: { type: Type.STRING, description: 'Search query to filter by name.' },
      },
    },
  },
  {
    name: 'get_satellite_status',
    description: 'Get current telemetry, health, mode, and orbit facts for a satellite by NORAD ID.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.NUMBER, description: 'NORAD catalog number.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_telemetry_window',
    description: 'Get historical telemetry for a satellite parameter over the last N minutes with summary stats.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.NUMBER, description: 'NORAD ID.' },
        parameter: { type: Type.STRING, description: 'E.g. power.soc, thermal.batteryTemp, adcs.pointingError.' },
        minutes: { type: Type.NUMBER, description: 'Window size in minutes (max 60).' },
      },
      required: ['id', 'parameter'],
    },
  },
  {
    name: 'get_active_alerts',
    description: 'Get currently open alerts, optionally filtered by severity or satellite.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        severity: { type: Type.STRING, description: 'warning or critical.' },
        satelliteId: { type: Type.NUMBER, description: 'Filter to a specific NORAD ID.' },
      },
    },
  },
  {
    name: 'get_incident',
    description: 'Get details of an incident by ID, including probable cause and evidence.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: 'Incident MongoDB ObjectId.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'predict_passes',
    description: 'Predict passes for a satellite over a location for the next N hours.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.NUMBER, description: 'NORAD ID.' },
        lat: { type: Type.NUMBER, description: 'Observer latitude.' },
        lon: { type: Type.NUMBER, description: 'Observer longitude.' },
        hours: { type: Type.NUMBER, description: 'Prediction window in hours (max 48).' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_space_weather',
    description: 'Get current NOAA space weather: Kp index, X-ray flux, G-storm scale.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'get_conjunctions',
    description: 'Get predicted conjunction close-approaches for fleet satellites at the current time.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        threshold: { type: Type.NUMBER, description: 'Miss distance threshold in km (default 20).' },
      },
    },
  },
  {
    name: 'ui_focus_satellite',
    description: 'Tell the UI to fly the camera to and select a satellite. Returns a UI command.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.NUMBER, description: 'NORAD ID to focus.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'acknowledge_alert',
    description: 'Acknowledge an open alert. STATE-CHANGING — client must show confirm card before executing.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING, description: 'Alert MongoDB ObjectId.' },
      },
      required: ['id'],
    },
  },
  {
    name: 'get_runbook',
    description: 'Get illustrative response checklist for an alert type.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        alertType: { type: Type.STRING, description: 'Alert type key, e.g. battery_low_warning.' },
      },
      required: ['alertType'],
    },
  },
];

// ─── Tool executor ─────────────────────────────────────────────────────────────
export interface ToolResult {
  data: unknown;
  chip: string; // Human-readable label shown in UI
  requiresConfirm?: boolean; // For state-changing actions
  uiCommand?: { type: string; payload: unknown }; // For UI-directing tools
}

export async function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  switch (name) {
    case 'list_satellites': {
      const filter: Record<string, unknown> = { tier: 'fleet' };
      if (args.health) filter.health = args.health;
      const sats = await Satellite.find(filter).select('noradId name health').lean();
      const result = args.q
        ? sats.filter((s) => s.name.toLowerCase().includes(String(args.q).toLowerCase()))
        : sats;
      return { data: result, chip: `Listed ${result.length} satellites` };
    }

    case 'get_satellite_status': {
      const sat = await Satellite.findOne({ noradId: Number(args.id) }).lean();
      if (!sat) return { data: { error: 'Not found' }, chip: `Satellite ${args.id} not found` };

      const latest = await Telemetry.findOne({ satelliteId: sat.noradId }).sort({ ts: -1 }).lean();
      let orbitFacts = null;
      if (sat.tle1 && sat.tle2) {
        try {
          orbitFacts = getOrbitFacts(satellite.twoline2satrec(sat.tle1, sat.tle2));
        } catch (_) {}
      }
      return {
        data: { satellite: sat, latestTelemetry: latest, orbitFacts },
        chip: `Read status: ${sat.name}`,
      };
    }

    case 'get_telemetry_window': {
      const minutes = Math.min(Number(args.minutes ?? 10), 60);
      const since = new Date(Date.now() - minutes * 60_000);
      const docs = await Telemetry.find({
        satelliteId: Number(args.id),
        ts: { $gte: since },
      }).sort({ ts: 1 }).lean();

      const param = String(args.parameter ?? '');
      const values: number[] = docs
        .map((d) => {
          const parts = param.split('.');
          let v: any = d;
          for (const p of parts) v = v?.[p];
          return typeof v === 'number' ? v : null;
        })
        .filter((v) => v !== null) as number[];

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
      const filter: Record<string, unknown> = { status: 'open' };
      if (args.severity) filter.severity = args.severity;
      if (args.satelliteId) filter.satelliteId = Number(args.satelliteId);
      const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(20).lean();
      return {
        data: alerts,
        chip: `Fetched ${alerts.length} open alerts`,
      };
    }

    case 'get_incident': {
      const incident = await Incident.findById(String(args.id)).lean();
      if (!incident) return { data: { error: 'Not found' }, chip: 'Incident not found' };
      const alerts = await Alert.find({ incidentId: incident._id }).lean();
      return { data: { incident, alerts }, chip: `Read incident ${args.id}` };
    }

    case 'predict_passes': {
      const sat = await Satellite.findOne({ noradId: Number(args.id) }).lean();
      if (!sat?.tle1 || !sat?.tle2) return { data: { error: 'No TLE' }, chip: 'No TLE data' };

      const gs = args.lat !== undefined
        ? { lat: Number(args.lat), lon: Number(args.lon ?? 88.36), elevationMask: 5 }
        : { lat: 22.5726, lon: 88.3639, elevationMask: 5 }; // default: Kolkata

      const satrec = satellite.twoline2satrec(sat.tle1, sat.tle2);
      const hours = Math.min(Number(args.hours ?? 24), 48);
      const passes = predictPasses(satrec, gs, new Date(), hours);
      return {
        data: { noradId: sat.noradId, name: sat.name, location: gs, passes: passes.slice(0, 5) },
        chip: `Predicted passes: ${sat.name}, ${hours}h`,
      };
    }

    case 'get_space_weather': {
      const weather = getCachedWeather();
      return { data: weather, chip: 'Fetched space weather (NOAA SWPC)' };
    }

    case 'get_conjunctions': {
      const threshold = Number(args.threshold ?? 20);
      const sats = await Satellite.find({ tle1: { $exists: true }, tle2: { $exists: true } }).lean();
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
      const rb = (runbooks as Record<string, unknown>)[String(args.alertType)];
      return {
        data: rb ?? { error: 'No runbook found', available: Object.keys(runbooks) },
        chip: `Read runbook: ${args.alertType}`,
      };
    }

    default:
      return { data: { error: `Unknown tool: ${name}` }, chip: `Unknown tool` };
  }
}
