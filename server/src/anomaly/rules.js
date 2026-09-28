"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runRulesLayer = runRulesLayer;
exports.getActiveRules = getActiveRules;
/**
 * Part 5 — Rules Layer
 * Threshold-based anomaly detection with hysteresis and duration debounce.
 */
const thresholds_json_1 = __importDefault(require("./thresholds.json"));
// Per-satellite debounce state: ruleId -> consecutive violation ticks
const debounceCounters = new Map();
// Per-satellite active state: ruleId -> current severity (for hysteresis)
const activeState = new Map();
function getDebounce(noradId, ruleId) {
    const key = String(noradId);
    if (!debounceCounters.has(key))
        debounceCounters.set(key, new Map());
    return debounceCounters.get(key).get(ruleId) ?? 0;
}
function setDebounce(noradId, ruleId, count) {
    const key = String(noradId);
    if (!debounceCounters.has(key))
        debounceCounters.set(key, new Map());
    debounceCounters.get(key).set(ruleId, count);
}
function getActive(noradId, ruleId) {
    const key = String(noradId);
    if (!activeState.has(key))
        activeState.set(key, new Map());
    return activeState.get(key).get(ruleId) ?? null;
}
function setActive(noradId, ruleId, level) {
    const key = String(noradId);
    if (!activeState.has(key))
        activeState.set(key, new Map());
    activeState.get(key).set(ruleId, level);
}
function getNestedValue(obj, path) {
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
        if (cur == null || typeof cur !== 'object')
            return null;
        cur = cur[p];
    }
    // Handle arrays (e.g. wheelSpeedRPM) — take max absolute value
    if (Array.isArray(cur))
        return Math.max(...cur.map(Math.abs));
    return typeof cur === 'number' ? cur : null;
}
function runRulesLayer(noradId, sample) {
    const violations = [];
    for (const [ruleId, rule] of Object.entries(thresholds_json_1.default)) {
        const cfg = rule;
        const value = getNestedValue(sample, cfg.parameter);
        if (value === null)
            continue;
        const currentActive = getActive(noradId, ruleId);
        let targetSeverity = null;
        // Determine raw violation level with hysteresis applied to clearing
        if ('critBelow' in cfg && value < cfg.critBelow) {
            targetSeverity = 'critical';
        }
        else if ('warnBelow' in cfg) {
            const clearThresh = currentActive === 'warning' ? cfg.warnBelow + cfg.hysteresis : cfg.warnBelow;
            if (value < clearThresh)
                targetSeverity = 'warning';
        }
        else if ('critAbove' in cfg && value > cfg.critAbove) {
            targetSeverity = 'critical';
        }
        else if ('warnAbove' in cfg) {
            const clearThresh = currentActive === 'warning' ? cfg.warnAbove - cfg.hysteresis : cfg.warnAbove;
            if (value > clearThresh)
                targetSeverity = 'warning';
        }
        // Debounce: require N consecutive ticks before firing
        const prevCount = getDebounce(noradId, ruleId);
        if (targetSeverity) {
            const newCount = prevCount + 1;
            setDebounce(noradId, ruleId, newCount);
            if (newCount >= cfg.debounceSecs) {
                setActive(noradId, ruleId, targetSeverity);
                const threshVal = targetSeverity === 'critical'
                    ? (cfg.critBelow ?? cfg.critAbove ?? 0)
                    : (cfg.warnBelow ?? cfg.warnAbove ?? 0);
                violations.push({
                    ruleId,
                    label: cfg.label,
                    severity: targetSeverity,
                    parameter: cfg.parameter,
                    value,
                    threshold: threshVal,
                });
            }
        }
        else {
            // Condition cleared — reset debounce
            setDebounce(noradId, ruleId, 0);
            setActive(noradId, ruleId, null);
        }
    }
    return violations;
}
function getActiveRules(noradId) {
    const key = String(noradId);
    const map = activeState.get(key);
    if (!map)
        return [];
    return [...map.entries()].filter(([, v]) => v !== null).map(([k]) => k);
}
//# sourceMappingURL=rules.js.map