"use strict";
/**
 * Part 5 — Predictive Layer
 * Linear trend time-to-threshold estimation.
 * Returns predicted alerts labelled 'predicted'.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPredictiveLayer = runPredictiveLayer;
// Rolling window (last N samples) per parameter per satellite
const WINDOW = 30; // 30 seconds of history
const history = new Map();
function histKey(noradId, param) {
    return `${noradId}:${param}`;
}
function getNestedValue(obj, path) {
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
        if (cur == null)
            return null;
        cur = cur[p];
    }
    if (Array.isArray(cur))
        return cur[0]; // first wheel for trend
    return typeof cur === 'number' ? cur : null;
}
// Compute linear regression slope (value units per second)
function linearSlope(values) {
    const n = values.length;
    if (n < 5)
        return 0;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumX2 += i * i;
    }
    const denom = n * sumX2 - sumX * sumX;
    return denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
}
const PREDICTION_TARGETS = [
    { parameter: 'power.soc', label: 'Battery Warning', warnThreshold: 25, critThreshold: 10, direction: 'below' },
    { parameter: 'thermal.batteryTemp', label: 'Battery Temperature Warning', warnThreshold: 35, critThreshold: 45, direction: 'above' },
    { parameter: 'adcs.pointingError', label: 'Pointing Error Warning', warnThreshold: 3, critThreshold: 8, direction: 'above' },
];
function runPredictiveLayer(noradId, sample) {
    const alerts = [];
    for (const target of PREDICTION_TARGETS) {
        const value = getNestedValue(sample, target.parameter);
        if (value === null)
            continue;
        const key = histKey(noradId, target.parameter);
        if (!history.has(key))
            history.set(key, []);
        const buf = history.get(key);
        buf.push(value);
        if (buf.length > WINDOW)
            buf.shift();
        if (buf.length < 10)
            continue; // not enough data
        const slope = linearSlope(buf); // value/sec
        // If slope is moving toward threshold
        if (target.direction === 'below' && slope >= 0)
            continue;
        if (target.direction === 'above' && slope <= 0)
            continue;
        for (const [thresh, severity] of [
            [target.warnThreshold, 'warning'],
            [target.critThreshold, 'critical'],
        ]) {
            const secsToThresh = target.direction === 'below'
                ? (value - thresh) / Math.abs(slope)
                : (thresh - value) / Math.abs(slope);
            // Only predict if it will happen within 30 minutes and the current value isn't already past threshold
            const pastThreshold = target.direction === 'below' ? value <= thresh : value >= thresh;
            if (!pastThreshold && secsToThresh > 0 && secsToThresh < 1800) {
                alerts.push({
                    parameter: target.parameter,
                    label: target.label,
                    currentValue: +value.toFixed(2),
                    thresholdValue: thresh,
                    minutesToThreshold: +(secsToThresh / 60).toFixed(1),
                    severity,
                    predicted: true,
                });
                break; // Only predict the nearest threshold
            }
        }
    }
    return alerts;
}
//# sourceMappingURL=predictive.js.map