import mongoose from 'mongoose';

// ─── Telemetry (time-series) ──────────────────────────────────────────────────
const telemetrySchema = new mongoose.Schema(
  {
    ts: { type: Date, required: true },
    satelliteId: { type: Number, required: true },
    power: { soc: Number, solarCurrent: Number, busVoltage: Number },
    thermal: { batteryTemp: Number, busTemp: Number, payloadTemp: Number },
    comms: { signalStrength: Number, connectedStation: String },
    adcs: { pointingError: Number, wheelSpeedRPM: Number },
    radiation: { seuCount: Number },
    mode: {
      type: String,
      enum: ['nominal', 'safe', 'eclipse', 'contact', 'payload_ops'],
    },
  },
  { timestamps: false },
);

export const Telemetry = mongoose.model('Telemetry', telemetrySchema);

// ─── Alert ───────────────────────────────────────────────────────────────────
const alertSchema = new mongoose.Schema({
  satelliteId: { type: Number, required: true },
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' },
  type: String,
  severity: { type: String, enum: ['warning', 'critical'] },
  message: String,
  value: Number,
  threshold: Number,
  status: { type: String, enum: ['open', 'acknowledged', 'resolved'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  acknowledgedAt: Date,
  resolvedAt: Date,
  evidence: [mongoose.Schema.Types.Mixed],
});

export const Alert = mongoose.model('Alert', alertSchema);

// ─── Incident ─────────────────────────────────────────────────────────────────
const incidentSchema = new mongoose.Schema({
  satelliteId: { type: Number, required: true },
  probableCause: String,
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  createdAt: { type: Date, default: Date.now },
  resolvedAt: Date,
});

export const Incident = mongoose.model('Incident', incidentSchema);

// ─── Ground Station ───────────────────────────────────────────────────────────
const groundStationSchema = new mongoose.Schema({
  name: String,
  lat: Number,
  lon: Number,
  elevationMask: { type: Number, default: 5 },
});

export const GroundStation = mongoose.model('GroundStation', groundStationSchema);

// ─── Satellite ────────────────────────────────────────────────────────────────
const satelliteSchema = new mongoose.Schema({
  noradId: { type: Number, unique: true, required: true },
  name: { type: String, required: true },
  tier: { type: String, enum: ['fleet', 'catalogue'], default: 'catalogue' },
  health: { type: String, enum: ['nominal', 'warning', 'critical', 'unknown'], default: 'nominal' },
  tle1: String,
  tle2: String,
  updatedAt: { type: Date, default: Date.now },
});

export const Satellite = mongoose.model('Satellite', satelliteSchema);

// ─── Chat Session ─────────────────────────────────────────────────────────────
const chatSessionSchema = new mongoose.Schema({
  createdAt: { type: Date, default: Date.now },
  messages: [{ role: String, content: String, timestamp: Date }],
});

export const ChatSession = mongoose.model('ChatSession', chatSessionSchema);
