"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCorrelationLayer = runCorrelationLayer;
exports.autoResolveAlerts = autoResolveAlerts;
exports.computeSatelliteHealth = computeSatelliteHealth;
/**
 * Part 5 — Correlation Layer + Incident Grouping
 * Groups co-occurring alerts into Incidents with a probable-cause hypothesis.
 * Suppresses alert storms with deduplication and cooldown.
 */
const index_js_1 = require("../models/index.js");
const index_js_2 = require("../index.js");
// Cooldown: alert type -> last fired timestamp (ms) per satellite
const cooldowns = new Map();
const COOLDOWN_MS = 15_000; // 15 seconds between repeated same-type alerts
// Open incident IDs per satellite
const openIncidents = new Map();
function cooldownKey(noradId, ruleId) {
    return `${noradId}:${ruleId}`;
}
function isCooledDown(noradId, ruleId) {
    const key = cooldownKey(noradId, ruleId);
    const last = cooldowns.get(key) ?? 0;
    return Date.now() - last < COOLDOWN_MS;
}
function markFired(noradId, ruleId) {
    cooldowns.set(cooldownKey(noradId, ruleId), Date.now());
}
/** Determine probable cause from co-occurring rule IDs */
function inferProbableCause(ruleIds) {
    if (ruleIds.includes('battery_low_warning') && ruleIds.includes('battery_temp_high_warning')) {
        return 'Power/Thermal incident: Low battery combined with high battery temperature. Possible causes: extended eclipse, heater fault, or degraded solar panels.';
    }
    if (ruleIds.includes('wheel_saturation') && ruleIds.includes('pointing_error_high')) {
        return 'ADCS incident: Reaction wheel saturation causing attitude pointing error. Momentum dump required.';
    }
    if (ruleIds.includes('battery_low_warning') && ruleIds.includes('bus_voltage_low')) {
        return 'Power incident: Low battery and bus voltage degradation. Possible power bus fault or load imbalance.';
    }
    if (ruleIds.includes('radiation_seu_rate') && ruleIds.includes('battery_temp_high_warning')) {
        return 'Space weather incident: Elevated radiation and thermal anomaly consistent with intense solar particle event.';
    }
    if (ruleIds.includes('pointing_error_high')) {
        return 'ADCS anomaly: Attitude control degradation. Check star-tracker and reaction wheel health.';
    }
    return `Multi-subsystem anomaly: ${ruleIds.join(', ')}`;
}
async function runCorrelationLayer(noradId, violations, sample) {
    const now = new Date();
    const firedRuleIds = [];
    for (const v of violations) {
        if (isCooledDown(noradId, v.ruleId))
            continue;
        markFired(noradId, v.ruleId);
        firedRuleIds.push(v.ruleId);
        // Create alert document
        const alert = await index_js_1.Alert.create({
            satelliteId: noradId,
            type: v.ruleId,
            severity: v.severity,
            message: `${v.label}: ${v.parameter} = ${v.value.toFixed(2)} (threshold: ${v.threshold})`,
            value: v.value,
            threshold: v.threshold,
            status: 'open',
            createdAt: now,
            evidence: [sample], // snapshot of the full telemetry sample
        });
        index_js_2.io.emit('alert:new', alert.toObject());
    }
    if (firedRuleIds.length === 0)
        return;
    // Correlation: if 2+ rules fired for the same satellite, group into an Incident
    if (firedRuleIds.length >= 2) {
        const existingIncidentId = openIncidents.get(noradId);
        if (existingIncidentId) {
            // Update existing incident
            await index_js_1.Incident.findByIdAndUpdate(existingIncidentId, {
                $push: { alerts: { $each: firedRuleIds } },
                probableCause: inferProbableCause([
                    ...firedRuleIds,
                    // Fetch existing rules from the open incident
                ]),
            });
            index_js_2.io.emit('incident:update', { id: existingIncidentId, noradId, newAlerts: firedRuleIds });
        }
        else {
            const incident = await index_js_1.Incident.create({
                satelliteId: noradId,
                probableCause: inferProbableCause(firedRuleIds),
                status: 'open',
                createdAt: now,
            });
            openIncidents.set(noradId, String(incident._id));
            // Link alerts to incident
            await index_js_1.Alert.updateMany({ satelliteId: noradId, status: 'open', type: { $in: firedRuleIds } }, { incidentId: incident._id });
            index_js_2.io.emit('incident:update', {
                id: incident._id,
                noradId,
                probableCause: incident.probableCause,
                status: 'open',
            });
        }
    }
}
/** Auto-resolve alerts when condition clears (called from detector) */
async function autoResolveAlerts(noradId, resolvedRuleIds) {
    if (resolvedRuleIds.length === 0)
        return;
    const updated = await index_js_1.Alert.updateMany({ satelliteId: noradId, type: { $in: resolvedRuleIds }, status: 'open' }, { status: 'resolved', resolvedAt: new Date() });
    if (updated.modifiedCount > 0) {
        index_js_2.io.emit('alert:update', { noradId, resolved: resolvedRuleIds });
        // Check if the incident is now fully resolved
        const incidentId = openIncidents.get(noradId);
        if (incidentId) {
            const openAlerts = await index_js_1.Alert.countDocuments({
                satelliteId: noradId,
                incidentId,
                status: 'open',
            });
            if (openAlerts === 0) {
                await index_js_1.Incident.findByIdAndUpdate(incidentId, {
                    status: 'resolved',
                    resolvedAt: new Date(),
                });
                openIncidents.delete(noradId);
                index_js_2.io.emit('incident:update', { id: incidentId, noradId, status: 'resolved' });
            }
        }
    }
}
/** Health rollup: worst open alert severity for a satellite */
async function computeSatelliteHealth(noradId) {
    const critCount = await index_js_1.Alert.countDocuments({ satelliteId: noradId, severity: 'critical', status: 'open' });
    if (critCount > 0)
        return 'critical';
    const warnCount = await index_js_1.Alert.countDocuments({ satelliteId: noradId, severity: 'warning', status: 'open' });
    if (warnCount > 0)
        return 'warning';
    return 'nominal';
}
//# sourceMappingURL=correlator.js.map