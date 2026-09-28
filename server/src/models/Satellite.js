"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Satellite = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const satelliteSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    noradId: { type: Number, required: true, unique: true },
    intlDesignator: String,
    group: String,
    tle1: String,
    tle2: String,
    epoch: Date,
    inclination: Number,
    period: Number,
    apogee: Number,
    perigee: Number,
    country: String,
    tier: { type: String, enum: ['catalogue', 'fleet'], default: 'catalogue' },
    health: { type: String, enum: ['nominal', 'warning', 'critical', 'no_contact'], default: 'nominal' },
    healthScore: { type: Number, min: 0, max: 100, default: 100 },
    lastSyncedAt: Date
});
exports.Satellite = mongoose_1.default.model('Satellite', satelliteSchema);
//# sourceMappingURL=Satellite.js.map