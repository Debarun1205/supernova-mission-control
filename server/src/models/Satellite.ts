import mongoose from 'mongoose';

const satelliteSchema = new mongoose.Schema({
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

export const Satellite = mongoose.model('Satellite', satelliteSchema);
