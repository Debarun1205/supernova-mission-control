"use strict";
/**
 * Part 5 — Statistical Layer
 * EWMA + z-score + rate-of-change detection for "abnormal but within limits" behaviour.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.runStatisticalLayer = runStatisticalLayer;
// Per-satellite EWMA state
const ewmaState = new Map();
// Previous values for rate-of-change
const prevValues = new Map();
const ALPHA = 0.05; // EWMA smoothing factor
const ZSCORE_WARN = 3.0;
const RATE_THRESHOLDS = {
    'thermal.batteryTemp': 0.5, // °C/min
    'thermal.busTemp': 0.3,
    'power.soc': -2.0, // %/min (rapid drain)
    'adcs.pointingError': 2.0, // °/min
};
function ewmaKey(noradId, param) {
    return `${noradId}:${param}`;
}
function updateEwma(key, value) {
    if (!ewmaState.has(key)) {
        ewmaState.set(key, { mean: value, variance: 1, count: 1 });
        return { mean: value, std: 1 };
    }
    const state = ewmaState.get(key);
    const delta = value - state.mean;
    state.mean += ALPHA * delta;
    state.variance = (1 - ALPHA) * (state.variance + ALPHA * delta * delta);
    state.count++;
    return { mean: state.mean, std: Math.sqrt(Math.max(state.variance, 1e-6)) };
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
        return Math.max(...cur.map(Math.abs));
    return typeof cur === 'number' ? cur : null;
}
function runStatisticalLayer(noradId, sample) {
    const anomalies = [];
    const MONITORED = [
        'thermal.batteryTemp',
        'thermal.busTemp',
        'thermal.payloadTemp',
        'power.soc',
        'power.busVoltage',
        'adcs.pointingError',
        'radiation.doserate',
    ];
    for (const param of MONITORED) {
        const value = getNestedValue(sample, param);
        if (value === null)
            continue;
        const key = ewmaKey(noradId, param);
        const { mean, std } = updateEwma(key, value);
        // Z-score anomaly (only after 30+ samples for stable mean)
        const state = ewmaState.get(key);
        if (state.count > 30) {
            const z = Math.abs((value - mean) / std);
            if (z > ZSCORE_WARN) {
                anomalies.push({
                    parameter: param,
                    type: 'zscore',
                    value,
                    zscore: +z.toFixed(2),
                    severity: 'warning',
                    label: `Statistical anomaly: ${param} z-score ${z.toFixed(1)}σ`,
                });
            }
        }
        // Rate-of-change anomaly
        const prevKey = `${noradId}:prev:${param}`;
        const prev = prevValues.get(prevKey);
        if (prev !== undefined) {
            const ratePerMin = (value - prev) * 60; // per-minute rate (1 Hz ticks)
            const rateThresh = RATE_THRESHOLDS[param];
            if (rateThresh !== undefined) {
                const exceeded = rateThresh < 0
                    ? ratePerMin < rateThresh
                    : ratePerMin > rateThresh;
                if (exceeded) {
                    anomalies.push({
                        parameter: param,
                        type: 'rate_of_change',
                        value,
                        ratePerMin: +ratePerMin.toFixed(3),
                        severity: 'warning',
                        label: `Rapid change: ${param} at ${ratePerMin.toFixed(2)}/min`,
                    });
                }
            }
        }
        prevValues.set(prevKey, value);
    }
    return anomalies;
}
//# sourceMappingURL=statistical.js.map