"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatSession = exports.Satellite = exports.GroundStation = exports.Incident = exports.Alert = exports.Telemetry = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// ─── Telemetry (time-series) ──────────────────────────────────────────────────
const telemetrySchema = new mongoose_1.default.Schema({
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
}, { timestamps: false });
exports.Telemetry = mongoose_1.default.model('Telemetry', telemetrySchema);
// ─── Alert ───────────────────────────────────────────────────────────────────
const alertSchema = new mongoose_1.default.Schema({
    satelliteId: { type: Number, required: true },
    incidentId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Incident' },
    type: String,
    severity: { type: String, enum: ['warning', 'critical'] },
    message: String,
    value: Number,
    threshold: Number,
    status: { type: String, enum: ['open', 'acknowledged', 'resolved'], default: 'open' },
    createdAt: { type: Date, default: Date.now },
    acknowledgedAt: Date,
    resolvedAt: Date,
    evidence: [mongoose_1.default.Schema.Types.Mixed],
});
exports.Alert = mongoose_1.default.model('Alert', alertSchema);
// ─── Incident ─────────────────────────────────────────────────────────────────
const incidentSchema = new mongoose_1.default.Schema({
    satelliteId: { type: Number, required: true },
    probableCause: String,
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
    createdAt: { type: Date, default: Date.now },
    resolvedAt: Date,
});
exports.Incident = mongoose_1.default.model('Incident', incidentSchema);
// ─── Ground Station ───────────────────────────────────────────────────────────
const groundStationSchema = new mongoose_1.default.Schema({
    name: String,
    lat: Number,
    lon: Number,
    elevationMask: { type: Number, default: 5 },
});
exports.GroundStation = mongoose_1.default.model('GroundStation', groundStationSchema);
// ─── Satellite ────────────────────────────────────────────────────────────────
const satelliteSchema = new mongoose_1.default.Schema({
    noradId: { type: Number, unique: true, required: true },
    name: { type: String, required: true },
    tier: { type: String, enum: ['fleet', 'catalogue'], default: 'catalogue' },
    health: { type: String, enum: ['nominal', 'warning', 'critical', 'unknown'], default: 'nominal' },
    tle1: String,
    tle2: String,
    updatedAt: { type: Date, default: Date.now },
});
exports.Satellite = mongoose_1.default.model('Satellite', satelliteSchema);
// ─── Chat Session ─────────────────────────────────────────────────────────────
const chatSessionSchema = new mongoose_1.default.Schema({
    createdAt: { type: Date, default: Date.now },
    messages: [{ role: String, content: String, timestamp: Date }],
});
exports.ChatSession = mongoose_1.default.model('ChatSession', chatSessionSchema);
//# sourceMappingURL=index.js.map