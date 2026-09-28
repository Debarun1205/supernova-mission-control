"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectAnomalies = detectAnomalies;
/**
 * Part 5 — Main Anomaly Detector
 * Chains all four layers (Rules → Statistical → Predictive → Correlation).
 * Called once per simulation tick per satellite.
 */
const rules_js_1 = require("./rules.js");
const statistical_js_1 = require("./statistical.js");
const predictive_js_1 = require("./predictive.js");
const correlator_js_1 = require("./correlator.js");
const index_js_1 = require("../models/index.js");
const index_js_2 = require("../index.js");
// Track which rules were active last tick per satellite (for auto-resolve)
const previousRules = new Map();
async function detectAnomalies(sample) {
    const noradId = sample.satelliteId;
    const raw = sample;
    // Layer 1: Rules
    const violations = (0, rules_js_1.runRulesLayer)(noradId, raw);
    const nowActiveRules = new Set(violations.map((v) => v.ruleId));
    // Auto-resolve: rules that were active last tick but no longer are
    const prevActive = previousRules.get(noradId) ?? new Set();
    const cleared = [...prevActive].filter((r) => !nowActiveRules.has(r));
    await (0, correlator_js_1.autoResolveAlerts)(noradId, cleared);
    previousRules.set(noradId, nowActiveRules);
    // Layer 2: Statistical (fire-and-forget, just log for now — no alert storm)
    const statAnomalies = (0, statistical_js_1.runStatisticalLayer)(noradId, raw);
    // Only emit stat anomalies as socket events (not persisted to avoid DB flood)
    if (statAnomalies.length > 0) {
        index_js_2.io.emit('stat:anomaly', { noradId, anomalies: statAnomalies });
    }
    // Layer 3: Predictive
    const predictions = (0, predictive_js_1.runPredictiveLayer)(noradId, raw);
    if (predictions.length > 0) {
        index_js_2.io.emit('alert:predicted', { noradId, predictions });
    }
    // Layer 4: Correlation + incident grouping + alert persistence
    await (0, correlator_js_1.runCorrelationLayer)(noradId, violations, raw);
    // Health rollup — update satellite document
    if (violations.length > 0 || cleared.length > 0) {
        const health = await (0, correlator_js_1.computeSatelliteHealth)(noradId);
        await index_js_1.Satellite.updateOne({ noradId }, { health });
        index_js_2.io.emit('satellite:health', { noradId, health });
    }
}
//# sourceMappingURL=detector.js.map