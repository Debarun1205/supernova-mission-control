/**
 * Part 5 — Main Anomaly Detector
 * Chains all four layers (Rules → Statistical → Predictive → Correlation).
 * Called once per simulation tick per satellite.
 */
import { runRulesLayer, getActiveRules } from './rules.js';
import { runStatisticalLayer } from './statistical.js';
import { runPredictiveLayer } from './predictive.js';
import { runCorrelationLayer, autoResolveAlerts, computeSatelliteHealth } from './correlator.js';
import { Alert, Satellite } from '../models/index.js';
import { io } from '../index.js';
import type { TelemetrySample } from '../../../shared/physics/index.js';

// Track which rules were active last tick per satellite (for auto-resolve)
const previousRules = new Map<number, Set<string>>();

export async function detectAnomalies(sample: TelemetrySample): Promise<void> {
  const noradId = sample.satelliteId;
  const raw = sample as unknown as Record<string, any>;

  // Layer 1: Rules
  const violations = runRulesLayer(noradId, raw);
  const nowActiveRules = new Set(violations.map((v) => v.ruleId));

  // Auto-resolve: rules that were active last tick but no longer are
  const prevActive = previousRules.get(noradId) ?? new Set<string>();
  const cleared = [...prevActive].filter((r) => !nowActiveRules.has(r));
  await autoResolveAlerts(noradId, cleared);
  previousRules.set(noradId, nowActiveRules);

  // Layer 2: Statistical (fire-and-forget, just log for now — no alert storm)
  const statAnomalies = runStatisticalLayer(noradId, raw);
  // Only emit stat anomalies as socket events (not persisted to avoid DB flood)
  if (statAnomalies.length > 0) {
    io.emit('stat:anomaly', { noradId, anomalies: statAnomalies });
  }

  // Layer 3: Predictive
  const predictions = runPredictiveLayer(noradId, raw);
  if (predictions.length > 0) {
    io.emit('alert:predicted', { noradId, predictions });
  }

  // Layer 4: Correlation + incident grouping + alert persistence
  await runCorrelationLayer(noradId, violations, raw);

  // Health rollup — update satellite document
  if (violations.length > 0 || cleared.length > 0) {
    const health = await computeSatelliteHealth(noradId);
    await Satellite.updateOne({ noradId }, { health });
    io.emit('satellite:health', { noradId, health });
  }
}
